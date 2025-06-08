import React, { useState, useRef, useCallback, useEffect, useLayoutEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Rnd } from 'react-rnd';
import type { DraggableEvent, DraggableData } from 'react-draggable';
import { invoke } from "@tauri-apps/api/tauri";
import { Settings, Moon, Sun, Minimize2, Maximize2, X, Mail, Bot, CheckSquare, Send, Archive, Flag, Clock, MoreHorizontal, Layout, Check, Maximize, Minimize, Minus } from "lucide-react";
import { useNotifications } from '../components/NotificationSystem';
import { sanitizeEmailContent, sanitizeSearchQuery, sanitizeTextInput, safeJsonParse } from '../utils/sanitization';

interface Email {
  id: string;
  subject: string;
  sender: string;
  sender_email: string;
  body: string;
  received_time: string;
  is_unread: boolean;
  importance?: number;
}

interface EmailViewProps {
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

const SerinaEmailReviewer: React.FC<EmailViewProps> = ({ darkMode, onToggleDarkMode }) => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotifications();
  const [emails, setEmails] = useState<Email[]>([]);
  const [selectedEmailIndex, setSelectedEmailIndex] = useState(0);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [replyText, setReplyText] = useState('');
  const [selectedLLM, setSelectedLLM] = useState('openai');
  const [selectedModel, setSelectedModel] = useState('gpt-4');

  const getAvailableModels = (provider: string) => {
    switch (provider) {
      case 'openai':
        return [
          { value: 'gpt-4', label: 'GPT-4' },
          { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
          { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' }
        ];
      case 'openrouter':
        return [
          { value: 'anthropic/claude-3-opus', label: 'Claude 3 Opus' },
          { value: 'anthropic/claude-3-sonnet', label: 'Claude 3 Sonnet' },
          { value: 'anthropic/claude-3-haiku', label: 'Claude 3 Haiku' },
          { value: 'openai/gpt-4', label: 'GPT-4' }
        ];
      default:
        return [];
    }
  };
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<string>("");
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [replyLoading, setReplyLoading] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);
  
  const getInitialLayout = () => {
    const saved = localStorage.getItem('email-panel-layout');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.warn('Failed to parse saved layout:', e);
      }
    }
    return [
      { id: 'email-list',    component: 'EmailList',   position: { x: 0, y: 0, w: 1, h: 1 } },
      { id: 'email-content', component: 'EmailContent',position: { x: 1, y: 0, w: 2, h: 1 } },
      { id: 'ai-summary',    component: 'AISummary',   position: { x: 3, y: 0, w: 1, h: 1 } },
      { id: 'reply-area',    component: 'ReplyArea',   position: { x: 0, y: 1, w: 4, h: 1 } }
    ];
  };
  
  const [boxLayout, setBoxLayout] = useState(getInitialLayout());

  const getInitialStyles = () => {
    const saved = localStorage.getItem('email-panel-styles');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.warn('Failed to parse saved styles:', e);
      }
    }
    return {};
  };
  
  const [boxStyles, setBoxStyles] = useState<
    Record<string, { x:number; y:number; width:number; height:number }>
  >(getInitialStyles());
  
  const [containerBounds, setContainerBounds] = useState({ width: 0, height: 0 });
  const [isEditingLayout, setIsEditingLayout] = useState(false);
  const [backupStyles, setBackupStyles] = useState<Record<string, { x:number; y:number; width:number; height:number }>>({});
  const [isFullscreen, setIsFullscreen] = useState(false);

  const startEditingLayout = () => {
    setBackupStyles({ ...boxStyles });
    setIsEditingLayout(true);
  };

  const saveLayoutChanges = () => {
    localStorage.setItem('email-panel-styles', JSON.stringify(boxStyles));
    setIsEditingLayout(false);
    setBackupStyles({});
  };

  const cancelLayoutChanges = () => {
    setBoxStyles(backupStyles);
    setIsEditingLayout(false);
    setBackupStyles({});
  };

  const toggleFullscreen = async () => {
    try {
      if (isFullscreen) {
        await invoke('restore_window');
      } else {
        await invoke('maximize_window');
      }
      setIsFullscreen(!isFullscreen);
    } catch (error) {
      console.error('Failed to toggle fullscreen:', error);
    }
  };

  const handleDragStop = (
    _e: DraggableEvent,
    d: DraggableData,
    id: string
  ) => {
    const grid = gridRef.current;
    if (!grid) return;
    
    const gridRect = grid.getBoundingClientRect();
    const maxX = gridRect.width - boxStyles[id].width;
    const maxY = gridRect.height - boxStyles[id].height;
    
    let boundedX = Math.max(0, Math.min(maxX, d.x));
    let boundedY = Math.max(0, Math.min(maxY, d.y));
    
    // Check for collisions and adjust position
    while (checkCollision(boundedX, boundedY, boxStyles[id].width, boxStyles[id].height, id)) {
      if (boundedX > 0) boundedX -= 10;
      else if (boundedY > 0) boundedY -= 10;
      else break;
    }
    
    const newStyles = {
      ...boxStyles,
      [id]: { ...boxStyles[id], x: boundedX, y: boundedY }
    };
    
    setBoxStyles(newStyles);
    if (!isEditingLayout) {
      localStorage.setItem('email-panel-styles', JSON.stringify(newStyles));
    }
  };

  const checkCollision = (
    x: number, 
    y: number, 
    width: number, 
    height: number, 
    excludeId: string
  ) => {
    for (const otherId of Object.keys(boxStyles)) {
      if (otherId === excludeId) continue;
      
      const other = boxStyles[otherId];
      if (
        x < other.x + other.width &&
        x + width > other.x &&
        y < other.y + other.height &&
        y + height > other.y
      ) {
        return true;
      }
    }
    return false;
  };

  const handleResizeStop = (
    _e: any,
    _dir: any,
    ref: HTMLElement,
    _delta: { width: number; height: number },
    pos: { x: number; y: number },
    id: string
  ) => {
    const grid = gridRef.current;
    if (!grid) return;
    
    const gridRect = grid.getBoundingClientRect();
    const minSize = 200;
    
    // Calculate bounds considering grid edges
    const maxWidth = gridRect.width - pos.x;
    const maxHeight = gridRect.height - pos.y;
    
    let boundedWidth = Math.max(minSize, Math.min(maxWidth, ref.offsetWidth));
    let boundedHeight = Math.max(minSize, Math.min(maxHeight, ref.offsetHeight));
    
    // Check for collisions and adjust size if needed
    while (checkCollision(pos.x, pos.y, boundedWidth, boundedHeight, id) && 
           (boundedWidth > minSize || boundedHeight > minSize)) {
      if (boundedWidth > minSize) boundedWidth -= 10;
      if (boundedHeight > minSize) boundedHeight -= 10;
    }
    
    const newStyles = {
      ...boxStyles,
      [id]: {
        x: pos.x,
        y: pos.y,
        width: boundedWidth,
        height: boundedHeight
      }
    };
    
    setBoxStyles(newStyles);
    if (!isEditingLayout) {
      localStorage.setItem('email-panel-styles', JSON.stringify(newStyles));
    }
  };

  useEffect(() => {
    loadEmails();
  }, []);

  useEffect(() => {
    if (emails.length > 0) {
      const email = emails[selectedEmailIndex];
      setSelectedEmail(email);
      if (email && email.id !== selectedEmail?.id) {
        generateSummary(email);
      }
    }
  }, [selectedEmailIndex, emails]);

  useLayoutEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    
    const updateLayout = () => {
      const { width, height } = grid.getBoundingClientRect();
      setContainerBounds({ width, height });
      
      // Only set initial layout if no saved styles exist
      if (Object.keys(boxStyles).length === 0) {
        const colW = width / 4;
        const rowH = height / 2;
        const initial: Record<string, { x:number; y:number; width:number; height:number }> = {};
        
        boxLayout.forEach(b => {
          initial[b.id] = {
            x: b.position.x * colW,
            y: b.position.y * rowH,
            width: b.position.w * colW,
            height: b.position.h * rowH
          };
        });
        setBoxStyles(initial);
      }
    };
    
    updateLayout();
    
    const resizeObserver = new ResizeObserver(() => {
      const { width, height } = grid.getBoundingClientRect();
      setContainerBounds({ width, height });
    });
    resizeObserver.observe(grid);
    
    return () => resizeObserver.disconnect();
  }, [boxLayout, boxStyles]);

  const loadEmails = async () => {
    try {
      setLoading(true);
      const response = await invoke('get_emails', { limit: 20 });
      const emailData = safeJsonParse(response as string, []);
      
      // Sanitize email content before setting state
      const sanitizedEmails = emailData.map((email: Email) => ({
        ...email,
        subject: sanitizeTextInput(email.subject, 200),
        sender: sanitizeTextInput(email.sender, 100),
        sender_email: sanitizeTextInput(email.sender_email, 254),
        body: sanitizeEmailContent(email.body)
      }));
      
      setEmails(sanitizedEmails);
      if (sanitizedEmails.length > 0) {
        setSelectedEmail(sanitizedEmails[0]);
      }
    } catch (error) {
      console.error('Failed to load emails:', error);
      showError('Failed to load emails', 'There was an error loading your emails. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const generateSummary = async (email: Email) => {
    try {
      setSummaryLoading(true);
      const response = await invoke('summarize_email', { 
        emailContent: email.body 
      });
      const summaryData = safeJsonParse(response as string, { summary: "Unable to generate summary" });
      setSummary(sanitizeTextInput(summaryData.summary, 2000));
    } catch (error) {
      console.error('Failed to generate summary:', error);
      setSummary("Unable to generate summary");
    } finally {
      setSummaryLoading(false);
    }
  };

  const generateReply = async () => {
    if (!selectedEmail) return;
    
    try {
      setReplyLoading(true);
      const response = await invoke('generate_reply', {
        emailContent: selectedEmail.body,
        instruction: "Write a professional, helpful reply"
      });
      const replyData = safeJsonParse(response as string, { reply: "" });
      setReplyText(sanitizeTextInput(replyData.reply, 10000));
    } catch (error) {
      console.error('Failed to generate reply:', error);
      showError('Failed to generate reply', 'There was an error generating the AI reply. Please try again.');
    } finally {
      setReplyLoading(false);
    }
  };

  const handleSendReply = async () => {
    if (!selectedEmail || !replyText.trim()) return;

    const sanitizedReplyText = sanitizeTextInput(replyText, 10000);
    if (!sanitizedReplyText.trim()) {
      showError('Invalid reply content', 'Please enter a valid reply message.');
      return;
    }

    try {
      await invoke('send_reply', {
        emailId: selectedEmail.id,
        replyText: sanitizedReplyText
      });
      setReplyText("");
      showSuccess('Reply sent successfully!', 'Your email reply has been delivered.');
    } catch (error) {
      console.error('Failed to send reply:', error);
      showError('Failed to send reply', 'There was an error sending your email. Please try again.');
    }
  };

  const handleMarkRead = async (emailId: string) => {
    try {
      await invoke('mark_email_read', { emailId });
      setEmails(emails.map(email => 
        email.id === emailId ? { ...email, is_unread: false } : email
      ));
    } catch (error) {
      console.error('Failed to mark email as read:', error);
    }
  };

  const handleCreateTask = async () => {
    if (!selectedEmail) return;

    try {
      const taskResponse = await invoke('generate_task_from_email', {
        emailContent: selectedEmail.body
      });
      const taskData = safeJsonParse(taskResponse as string, { title: "New Task", description: "Generated from email" });
      
      const sanitizedTitle = sanitizeTextInput(taskData.title, 200);
      const sanitizedDescription = sanitizeTextInput(taskData.description, 2000);
      
      await invoke('create_task_from_email', {
        emailId: selectedEmail.id,
        title: sanitizedTitle,
        description: sanitizedDescription
      });

      showSuccess('Task created successfully!', `Created task: "${sanitizedTitle}"`);
    } catch (error) {
      console.error('Failed to create task:', error);
      showError('Failed to create task', 'There was an error creating the task. Please try again.');
    }
  };

  const getPriorityColor = (importance: number = 1) => {
    switch (importance) {
      case 2: return '#ff6b6b'; // High
      case 1: return '#ffd93d'; // Medium  
      case 0: return '#6bcf7f'; // Low
      default: return '#74c0fc';
    }
  };

  const getPriorityLabel = (importance: number = 1) => {
    switch (importance) {
      case 2: return 'high';
      case 1: return 'medium';
      case 0: return 'low';
      default: return 'normal';
    }
  };

  const handleWindowControl = async (action: string) => {
    try {
      await invoke(action);
    } catch (error) {
      console.error(`Failed to ${action}:`, error);
    }
  };


  // Component renderers for each box type
  const EmailListBox = () => (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b" style={{ 
        borderColor: '#374151',
        background: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)'
      }}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-100 text-sm">Emails to Review</h3>
          <button
            onClick={loadEmails}
            className="text-xs text-blue-400 hover:text-blue-300"
          >
            Refresh
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-500">Loading emails...</p>
          </div>
        ) : (
          emails.map((email, index) => (
            <div
              key={email.id}
              onClick={() => setSelectedEmailIndex(index)}
              className={`p-3 border-b cursor-pointer transition-all duration-200 ${
                selectedEmailIndex === index 
                  ? 'bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-l-4 border-l-blue-400' 
                  : 'hover:bg-gray-700/30'
              }`}
              style={{ borderColor: '#374151' }}
            >
              <div className="flex items-start justify-between mb-1">
                <div className="flex items-center space-x-2">
                  {email.is_unread && <div className="w-2 h-2 bg-blue-400 rounded-full shadow-sm shadow-blue-400/50"></div>}
                  <span className="font-medium text-gray-200 text-sm">{email.sender}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div 
                    className="w-2 h-2 rounded-full shadow-sm"
                    style={{ 
                      backgroundColor: getPriorityColor(email.importance),
                      boxShadow: `0 0 4px ${getPriorityColor(email.importance)}40`
                    }}
                  ></div>
                  <span className="text-xs text-gray-400">
                    {new Date(email.received_time).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <h4 className="font-medium text-gray-300 text-sm mb-1 line-clamp-1">{email.subject}</h4>
              <p className="text-xs text-gray-500 line-clamp-2">
                {email.body.substring(0, 100)}...
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const EmailContentBox = () => (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b" style={{ 
        borderColor: '#374151',
        background: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)'
      }}>
        <h3 className="font-semibold text-gray-100 text-sm">Email Content</h3>
      </div>
      {selectedEmail && (
        <>
          <div className="p-4 border-b" style={{ 
            borderColor: '#374151',
            background: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)'
          }}>
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-100 mb-1">{selectedEmail.subject}</h2>
                <div className="flex items-center space-x-3 text-sm text-gray-400">
                  <span className="font-medium text-gray-300">{selectedEmail.sender}</span>
                  <span>{new Date(selectedEmail.received_time).toLocaleString()}</span>
                </div>
              </div>
              <span 
                className="px-3 py-1 rounded-full text-xs font-medium text-white capitalize shadow-lg"
                style={{ 
                  backgroundColor: getPriorityColor(selectedEmail.importance),
                  boxShadow: `0 0 12px ${getPriorityColor(selectedEmail.importance)}40`
                }}
              >
                {getPriorityLabel(selectedEmail.importance)}
              </span>
            </div>
            <div className="flex space-x-2 mt-3">
              <button
                onClick={() => handleMarkRead(selectedEmail.id)}
                className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
              >
                Mark Read
              </button>
              <button
                onClick={handleCreateTask}
                className="px-3 py-1 bg-purple-500 text-white rounded text-sm hover:bg-purple-600 flex items-center space-x-1"
              >
                <CheckSquare className="w-4 h-4" />
                <span>Create Task</span>
              </button>
            </div>
          </div>
          <div className="flex-1 p-4 overflow-y-auto" style={{ backgroundColor: '#1f2937' }}>
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 shadow-lg">
              <div className="prose max-w-none text-sm text-gray-300">
                <div className="whitespace-pre-wrap break-words">
                  {selectedEmail.body}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );

  const AISummaryBox = () => (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b" style={{ 
        borderColor: '#374151',
        background: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)'
      }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full animate-pulse"></div>
            <h3 className="font-semibold text-gray-100 text-sm">AI Assistant</h3>
          </div>
          <div className="flex items-center space-x-2">
            <select 
              value={selectedLLM} 
              onChange={(e) => {
                setSelectedLLM(e.target.value);
                const models = getAvailableModels(e.target.value);
                if (models.length > 0) {
                  setSelectedModel(models[0].value);
                }
              }}
              className="text-xs border border-gray-600 rounded px-2 py-1 bg-gray-800 text-gray-300 focus:border-blue-500 focus:outline-none"
            >
              <option value="openai">OpenAI</option>
              <option value="openrouter">OpenRouter</option>
            </select>
            <select 
              value={selectedModel} 
              onChange={(e) => setSelectedModel(e.target.value)}
              className="text-xs border border-gray-600 rounded px-2 py-1 bg-gray-800 text-gray-300 focus:border-blue-500 focus:outline-none"
            >
              {getAvailableModels(selectedLLM).map(model => (
                <option key={model.value} value={model.value}>
                  {model.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      <div className="flex-1 p-3 overflow-y-auto">
        <div className="mb-4">
          <h4 className="font-medium text-gray-200 text-sm mb-2">Summary</h4>
          <div className="bg-gray-800 p-3 rounded border border-gray-700 text-sm shadow-lg">
            {summaryLoading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                <span className="text-gray-400">Generating summary...</span>
              </div>
            ) : (
              <p className="text-gray-300">{summary || "Select an email to see AI summary"}</p>
            )}
          </div>
        </div>
        <div>
          <h4 className="font-medium text-gray-200 text-sm mb-2">Quick Actions</h4>
          <div className="space-y-2">
            <div className="bg-gradient-to-r from-green-900/30 to-emerald-900/30 p-2 rounded border border-green-700/50 shadow-lg">
              <div className="flex items-center space-x-2">
                <CheckSquare className="w-3 h-3 text-green-400" />
                <span className="text-sm font-medium text-green-200">Create Task</span>
              </div>
            </div>
            <div className="bg-gradient-to-r from-blue-900/30 to-cyan-900/30 p-2 rounded border border-blue-700/50 shadow-lg">
              <div className="flex items-center space-x-2">
                <Bot className="w-3 h-3 text-blue-400" />
                <span className="text-sm font-medium text-blue-200">Generate Reply</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const ReplyAreaBox = () => (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b" style={{ 
        borderColor: '#374151',
        background: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)'
      }}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-100 text-sm">Your Reply</h3>
          <button 
            onClick={generateReply}
            disabled={replyLoading}
            className="px-3 py-1 rounded text-xs font-medium transition-all duration-200 hover:scale-105 shadow-lg disabled:opacity-50"
            style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              color: 'white',
              boxShadow: '0 0 12px rgba(59, 130, 246, 0.4)'
            }}
          >
            {replyLoading ? 'Generating...' : 'Generate'}
          </button>
        </div>
      </div>
      <div className="flex-1 p-3">
        <textarea 
          value={replyText}
          onChange={(e) => setReplyText(sanitizeTextInput(e.target.value, 10000))}
          placeholder="Type your reply here or use AI to generate one..."
          className="w-full h-full border border-gray-600 rounded p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-800 text-gray-300 placeholder-gray-500"
        />
      </div>
    </div>
  );

  const renderBox = (box: any) => {
    const components = {
      EmailList: EmailListBox,
      EmailContent: EmailContentBox,
      AISummary: AISummaryBox,
      ReplyArea: ReplyAreaBox
    };
    const Component = components[box.component as keyof typeof components];
    return <Component />;
  };

  return (
    <div className="h-screen flex flex-col" style={{ 
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)'
    }}>
      
      {/* Header */}
      <div className="px-6 py-4 border-b shadow-lg" style={{
        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
        borderColor: '#374151',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
      }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shadow-lg" style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              boxShadow: '0 0 20px rgba(59, 130, 246, 0.4)'
            }}>
              <Mail className="text-white w-4 h-4" />
            </div>
            <h1 className="text-xl font-semibold text-gray-100">SERINA Email Review</h1>
            <input
              type="text"
              placeholder="Search emails..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(sanitizeSearchQuery(e.target.value))}
              className="px-4 py-2 border border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64 bg-gray-800 text-gray-300 placeholder-gray-500 transition-all duration-200"
            />
          </div>
          
          <div className="flex items-center space-x-4">
            {!isEditingLayout ? (
              <button
                onClick={startEditingLayout}
                className="p-2 text-gray-400 hover:text-blue-400 transition-colors duration-200 hover:scale-110"
                title="Edit Screen Layout"
              >
                <Layout className="w-5 h-5" />
              </button>
            ) : (
              <div className="flex items-center space-x-2">
                <button
                  onClick={saveLayoutChanges}
                  className="p-2 text-green-400 hover:text-green-300 transition-colors duration-200 hover:scale-110"
                  title="Save Layout"
                >
                  <Check className="w-5 h-5" />
                </button>
                <button
                  onClick={cancelLayoutChanges}
                  className="p-2 text-red-400 hover:text-red-300 transition-colors duration-200 hover:scale-110"
                  title="Cancel Changes"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}
            <button
              onClick={() => navigate('/settings')}
              className="p-2 text-gray-400 hover:text-gray-200 transition-colors duration-200 hover:scale-110"
              title="Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
            <button
              onClick={onToggleDarkMode}
              className="p-2 text-gray-400 hover:text-gray-200 transition-colors duration-200 hover:scale-110"   
              title="Toggle Theme"
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button
              onClick={toggleFullscreen}
              className="p-2 text-gray-400 hover:text-gray-200 transition-colors duration-200 hover:scale-110"
              title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            >
              {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
            </button>
            <button
              onClick={() => handleWindowControl('minimize_window')}
              className="p-2 text-gray-400 hover:text-gray-200 transition-colors duration-200"
              title="Minimize"
            >
              <Minus className="w-5 h-5" />
            </button>
            <button
              onClick={() => handleWindowControl('close_window')}
              className="p-2 text-gray-400 hover:text-red-400 transition-colors duration-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid Area */}
      <div className="flex-1 p-4">
        <div ref={gridRef} style={{ position: 'relative', width: '100%', height: '100%' }}>
        {Object.keys(boxStyles).length === 0
          ? null
          : boxLayout.map(box => (
            <Rnd
              key={box.id}
              size={{ width: boxStyles[box.id].width, height: boxStyles[box.id].height }}
              position={{ x: boxStyles[box.id].x, y: boxStyles[box.id].y }}
              onDragStop={(e, d) => handleDragStop(e, d, box.id)}
              onResize={(e, dir, ref, delta, pos) => {
                // Real-time collision checking during resize
                const newWidth = ref.offsetWidth;
                const newHeight = ref.offsetHeight;
                if (checkCollision(pos.x, pos.y, newWidth, newHeight, box.id)) {
                  return false; // Prevent the resize
                }
              }}
              onResizeStop={(e, dir, ref, delta, pos) => handleResizeStop(e, dir, ref, delta, pos, box.id)}
              bounds="parent"
              minWidth={200}
              minHeight={200}
              maxWidth={containerBounds.width}
              maxHeight={containerBounds.height}
              enableResizing={isEditingLayout ? {
                top: true, right: true, bottom: true, left: true,
                topRight: true, bottomRight: true, bottomLeft: true, topLeft: true
              } : false}
              dragHandleClassName={isEditingLayout ? "drag-handle" : ""}
              disableDragging={!isEditingLayout}
              className="rounded-lg border overflow-hidden group"
              style={{
                background: 'linear-gradient(135deg, #374151 0%, #374151 100%)',
                borderColor: isEditingLayout ? '#3b82f6' : '#4b5563',
                borderWidth: isEditingLayout ? '2px' : '1px',
                boxShadow: isEditingLayout 
                  ? '0 8px 25px rgba(59, 130, 246, 0.3), 0 0 0 1px rgba(59, 130, 246, 0.1)' 
                  : '0 8px 25px rgba(0, 0, 0, 0.3)',
                zIndex: 1
              }}
            >
              <div className="h-full relative">
                {/* Drag handle - only show when editing */}
                {isEditingLayout && (
                  <div className="drag-handle absolute top-1 left-1 right-1 h-6 z-10 opacity-60 group-hover:opacity-100 transition-opacity duration-200 cursor-move flex items-center justify-center bg-blue-600/70 hover:bg-blue-500/80 rounded-t">
                    <MoreHorizontal className="w-4 h-4 text-white" />
                  </div>
                )}
                
                {renderBox(box)}
              </div>
            </Rnd>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t shadow-lg" style={{
        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
        borderColor: '#374151',
        boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.3)'
      }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button className="px-4 py-2 border border-gray-600 rounded-lg hover:bg-gray-700 transition-all duration-200 text-gray-300 hover:text-white">
              Skip
            </button>
            <button className="px-4 py-2 border border-gray-600 rounded-lg hover:bg-gray-700 transition-all duration-200 text-gray-300 hover:text-white flex items-center space-x-2">
              <Clock className="w-4 h-4" />
              <span>Snooze</span>
            </button>
            <button className="px-4 py-2 border border-gray-600 rounded-lg hover:bg-gray-700 transition-all duration-200 text-gray-300 hover:text-white flex items-center space-x-2">
              <Flag className="w-4 h-4" />
              <span>Flag</span>
            </button>
          </div>
          
          <div className="flex items-center space-x-3">
            <button 
              onClick={handleCreateTask}
              className="px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:scale-105 shadow-lg flex items-center space-x-2" 
              style={{
                background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                color: 'white',
                boxShadow: '0 0 15px rgba(139, 92, 246, 0.4)'
              }}
            >
              <CheckSquare className="w-4 h-4" />
              <span>Create Task</span>
            </button>
            <button 
              onClick={handleSendReply}
              className="px-6 py-2 rounded-lg font-medium transition-all duration-200 hover:scale-105 shadow-lg flex items-center space-x-2" 
              style={{
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                color: 'white',
                boxShadow: '0 0 20px rgba(59, 130, 246, 0.4)'
              }}
            >
              <Send className="w-4 h-4" />
              <span>Send Reply</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SerinaEmailReviewer;
