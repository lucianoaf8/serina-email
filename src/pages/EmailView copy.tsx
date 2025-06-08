import React, { useState, useRef, useCallback, useEffect, useLayoutEffect } from 'react';
import { Rnd } from 'react-rnd';
import type { DraggableEvent, DraggableData } from 'react-draggable';
import { invoke } from "@tauri-apps/api/tauri";
import { Settings, Moon, Sun, Minimize2, Maximize2, X, Mail, Bot, CheckSquare, Send, Archive, Flag, Clock, MoreHorizontal } from "lucide-react";

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
  const [emails, setEmails] = useState<Email[]>([]);
  const [selectedEmailIndex, setSelectedEmailIndex] = useState(0);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [replyText, setReplyText] = useState('');
  const [selectedLLM, setSelectedLLM] = useState('openai');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<string>("");
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [replyLoading, setReplyLoading] = useState(false);
  const [dragging, setDragging] = useState<string | null>(null);
  const [resizing, setResizing] = useState<any>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  
  // Box layout state with flexible sizing
  // (1) Your existing boxLayout state:
  const [boxLayout, setBoxLayout] = useState([
    { id: 'email-list',    component: 'EmailList',   position: { x: 0, y: 0, w: 1, h: 2 } },
    { id: 'email-content', component: 'EmailContent',position: { x: 1, y: 0, w: 2, h: 1 } },
    { id: 'ai-summary',    component: 'AISummary',   position: { x: 3, y: 0, w: 1, h: 1 } },
    { id: 'reply-area',    component: 'ReplyArea',   position: { x: 1, y: 1, w: 2, h: 1 } }
  ]);

  // (2) NEW: pixel-based styles for each box (x,y,width,height in px)
  const [boxStyles, setBoxStyles] = useState<
    Record<string, { x:number; y:number; width:number; height:number }>
  >({});

  // (3) NEW: handleDragStop — update x,y on drag end
  const handleDragStop = (
    _e: DraggableEvent,
    d: DraggableData,
    id: string
  ) => {
  
    setBoxStyles(styles => ({
      ...styles,
      [id]: { ...styles[id], x: d.x, y: d.y }
    }));
  };

  // (4) NEW: handleResizeStop — update width,height,x,y on resize end
  const handleResizeStop = (
    _e: DraggableEvent,
    _dir: any,
    ref: HTMLElement,
    delta: { width: number; height: number },
    pos: { x: number; y: number },
    id: string
  ) => {
    setBoxStyles(styles => {
      const updated = { ...styles };
      updated[id] = {
        x: pos.x,
        y: pos.y,
        width: ref.offsetWidth,
        height: ref.offsetHeight
      };
      // TODO: find neighbor(s) adjacent in the resize direction
      //       and subtract `delta.width` or `delta.height` from them.
      return updated;
    });
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
    const { width, height } = grid.getBoundingClientRect();
    const colW = width  / 4;
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
  }, [boxLayout]);

  const loadEmails = async () => {
    try {
      setLoading(true);
      const response = await invoke('get_emails', { limit: 20 });
      const emailData = JSON.parse(response as string);
      setEmails(emailData);
      if (emailData.length > 0) {
        setSelectedEmail(emailData[0]);
      }
    } catch (error) {
      console.error('Failed to load emails:', error);
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
      const summaryData = JSON.parse(response as string);
      setSummary(summaryData.summary);
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
      const replyData = JSON.parse(response as string);
      setReplyText(replyData.reply);
    } catch (error) {
      console.error('Failed to generate reply:', error);
    } finally {
      setReplyLoading(false);
    }
  };

  const handleSendReply = async () => {
    if (!selectedEmail || !replyText.trim()) return;

    try {
      await invoke('send_reply', {
        emailId: selectedEmail.id,
        replyText
      });
      setReplyText("");
      alert('Reply sent successfully!');
    } catch (error) {
      console.error('Failed to send reply:', error);
      alert('Failed to send reply');
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
      const taskData = JSON.parse(taskResponse as string);
      
      await invoke('create_task_from_email', {
        emailId: selectedEmail.id,
        title: taskData.title,
        description: taskData.description
      });

      alert('Task created successfully!');
    } catch (error) {
      console.error('Failed to create task:', error);
      alert('Failed to create task');
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

  // Drag and Drop functionality
  const handleDragStart = (e: React.DragEvent, boxId: string) => {
    setDragging(boxId);
    e.dataTransfer.setData('text/plain', boxId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetBoxId: string) => {
    e.preventDefault();
    const draggedBoxId = e.dataTransfer.getData('text/plain');
    
    if (draggedBoxId !== targetBoxId) {
      setBoxLayout(prev => {
        const newLayout = [...prev];
        const draggedIndex = newLayout.findIndex(box => box.id === draggedBoxId);
        const targetIndex = newLayout.findIndex(box => box.id === targetBoxId);
        
        const draggedBox = newLayout[draggedIndex];
        const targetBox = newLayout[targetIndex];
        
        const tempPosition = draggedBox.position;
        draggedBox.position = targetBox.position;
        targetBox.position = tempPosition;
        
        return newLayout;
      });
    }
    setDragging(null);
  };

  const handleResizeStart = (e: React.MouseEvent, boxId: string, direction: string) => {
    e.preventDefault();
    e.stopPropagation();
    setResizing({ boxId, direction, startX: e.clientX, startY: e.clientY });
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!resizing || !gridRef.current) return;

    const gridRect = gridRef.current.getBoundingClientRect();
    const cellWidth = gridRect.width / 4;
    const cellHeight = gridRect.height / 2;
    
    const deltaX = Math.round((e.clientX - resizing.startX) / cellWidth);
    const deltaY = Math.round((e.clientY - resizing.startY) / cellHeight);
    
    setBoxLayout(prev => {
      const newLayout = [...prev];
      const boxIndex = newLayout.findIndex(box => box.id === resizing.boxId);
      const box = newLayout[boxIndex];
      
      if (resizing.direction === 'se') {
        const newW = Math.max(1, Math.min(4 - box.position.x, box.position.w + deltaX));
        const newH = Math.max(1, Math.min(2 - box.position.y, box.position.h + deltaY));
        box.position = { ...box.position, w: newW, h: newH };
      } else if (resizing.direction === 'e') {
        const newW = Math.max(1, Math.min(4 - box.position.x, box.position.w + deltaX));
        box.position = { ...box.position, w: newW };
      } else if (resizing.direction === 's') {
        const newH = Math.max(1, Math.min(2 - box.position.y, box.position.h + deltaY));
        box.position = { ...box.position, h: newH };
      }
      
      return newLayout;
    });
  }, [resizing]);

  const handleMouseUp = useCallback(() => {
    setResizing(null);
  }, []);

  useEffect(() => {
    if (resizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [resizing, handleMouseMove, handleMouseUp]);

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
                <div 
                  dangerouslySetInnerHTML={{ 
                    __html: selectedEmail.body.replace(/\n/g, '<br>') 
                  }}
                />
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
          <select 
            value={selectedLLM} 
            onChange={(e) => setSelectedLLM(e.target.value)}
            className="text-xs border border-gray-600 rounded px-2 py-1 bg-gray-800 text-gray-300 focus:border-blue-500 focus:outline-none"
          >
            <option value="openai">OpenAI</option>
            <option value="openrouter">OpenRouter</option>
          </select>
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
          onChange={(e) => setReplyText(e.target.value)}
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
          </div>
          
          <div className="flex items-center space-x-4">
            <input
              type="text"
              placeholder="Search emails..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-4 py-2 border border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64 bg-gray-800 text-gray-300 placeholder-gray-500 transition-all duration-200"
            />
            <button
              onClick={() => invoke('show_settings_window')}
              className="p-2 text-gray-400 hover:text-gray-200 transition-colors duration-200 hover:scale-110"
            >
              <Settings className="w-5 h-5" />
            </button>
            <button
              onClick={onToggleDarkMode}
              className="p-2 text-gray-400 hover:text-gray-200 transition-colors duration-200 hover:scale-110"   
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button
              onClick={() => handleWindowControl('minimize_window')}
              className="p-2 text-gray-400 hover:text-gray-200 transition-colors duration-200"
            >
              <Minimize2 className="w-5 h-5" />
            </button>
            <button
              onClick={() => handleWindowControl('maximize_window')}
              className="p-2 text-gray-400 hover:text-gray-200 transition-colors duration-200"
            >
              <Maximize2 className="w-5 h-5" />
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
            position={{ x: boxStyles[box.id].x,    y: boxStyles[box.id].y }}
            onDragStop={(e, d) => handleDragStop(e, d, box.id)}
            onResizeStop={(e, dir, ref, delta, pos) => handleResizeStop(e, dir, ref, delta, pos, box.id)}
            bounds="parent"
            enableResizing={{
              top: true, right: true, bottom: true, left: true,
              topRight: true, bottomRight: true, bottomLeft: true, topLeft: true
            }}
            className="rounded-lg border overflow-hidden transition-all duration-200 relative"
            style={{
              width:  boxStyles[box.id].width,
              height: boxStyles[box.id].height,
              top:    boxStyles[box.id].y,
              left:   boxStyles[box.id].x,
              position: 'absolute',
              background: 'linear-gradient(135deg, #374151 0%, #374151 100%)',
              borderColor: '#4b5563',
              boxShadow: dragging === box.id 
                ? '0 20px 40px rgba(0, 0, 0, 0.5)' 
                : '0 8px 25px rgba(0, 0, 0, 0.3)'
            }}            
            >
              <div className="h-full relative">
                {/* Drag handle */}
                <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-60 transition-opacity duration-200">
                  <MoreHorizontal className="w-4 h-4 text-gray-400" />
                </div>
                
                {/* Resize handles */}
                <div 
                  className="absolute bottom-0 right-0 w-4 h-4 opacity-0 group-hover:opacity-60 transition-opacity duration-200 z-20"
                  style={{
                    background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                    clipPath: 'polygon(100% 0%, 0% 100%, 100% 100%)'
                  }}
                />
                <div 
                  className="absolute bottom-0 right-0 left-0 h-2 opacity-0 group-hover:opacity-30 transition-opacity duration-200 z-20"
                  style={{ background: 'linear-gradient(90deg, transparent 0%, #3b82f6 50%, transparent 100%)' }}
                />
                <div 
                  className="absolute top-0 bottom-0 right-0 w-2 opacity-0 group-hover:opacity-30 transition-opacity duration-200 z-20"
                  style={{ background: 'linear-gradient(180deg, transparent 0%, #3b82f6 50%, transparent 100%)' }}
                />
                
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
            <button className="px-4 py-2 border border-gray-600 rounded-lg hover:bg-gray-700 transition-all duration-200 text-gray-300 hover:text-white flex items-center space-x-2">
              <Archive className="w-4 h-4" />
              <span>Archive</span>
            </button>
            <button className="px-4 py-2 border border-gray-600 rounded-lg hover:bg-gray-700 transition-all duration-200 text-gray-300 hover:text-white flex items-center space-x-2">
              <Flag className="w-4 h-4" />
              <span>Flag</span>
            </button>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-4 text-sm text-gray-400">
              <span>{emails.filter(e => e.is_unread).length} unread</span>
              <span>{emails.length} total</span>
            </div>
            
            <div className="flex items-center space-x-3">
              <button className="px-4 py-2 border border-gray-600 rounded-lg hover:bg-gray-700 transition-all duration-200 text-gray-300 hover:text-white">
                Skip
              </button>
              <button className="px-4 py-2 border border-gray-600 rounded-lg hover:bg-gray-700 transition-all duration-200 text-gray-300 hover:text-white flex items-center space-x-2">
                <Clock className="w-4 h-4" />
                <span>Snooze</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SerinaEmailReviewer;
