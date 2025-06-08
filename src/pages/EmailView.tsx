import React, { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import { Settings, Moon, Sun, Minimize2, Maximize2, X, Mail, Bot, CheckSquare } from "lucide-react";

interface Email {
  id: string;
  subject: string;
  sender: string;
  sender_email: string;
  body: string;
  received_time: string;
  is_unread: boolean;
}

interface EmailViewProps {
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

export default function EmailView({ darkMode, onToggleDarkMode }: EmailViewProps) {
  const [emails, setEmails] = useState<Email[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<string>("");
  const [replyText, setReplyText] = useState<string>("");
  const [showReplyBox, setShowReplyBox] = useState(false);

  useEffect(() => {
    loadEmails();
  }, []);

  const loadEmails = async () => {
    try {
      setLoading(true);
      const response = await invoke('get_emails', { limit: 20 });
      const emailData = JSON.parse(response as string);
      setEmails(emailData);
    } catch (error) {
      console.error('Failed to load emails:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectEmail = async (email: Email) => {
    setSelectedEmail(email);
    setSummary("");
    setShowReplyBox(false);
    
    // Generate AI summary
    try {
      const response = await invoke('summarize_email', { 
        emailContent: email.body 
      });
      const summaryData = JSON.parse(response as string);
      setSummary(summaryData.summary);
    } catch (error) {
      console.error('Failed to generate summary:', error);
      setSummary("Unable to generate summary");
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

  const handleCreateTask = async (email: Email) => {
    try {
      const taskResponse = await invoke('generate_task_from_email', {
        emailContent: email.body
      });
      const taskData = JSON.parse(taskResponse as string);
      
      await invoke('create_task_from_email', {
        emailId: email.id,
        title: taskData.title,
        description: taskData.description
      });

      alert('Task created successfully!');
    } catch (error) {
      console.error('Failed to create task:', error);
      alert('Failed to create task');
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
      setShowReplyBox(false);
      alert('Reply sent successfully!');
    } catch (error) {
      console.error('Failed to send reply:', error);
      alert('Failed to send reply');
    }
  };

  const handleWindowControl = async (action: string) => {
    try {
      await invoke(action);
    } catch (error) {
      console.error(`Failed to ${action}:`, error);
    }
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Custom title bar */}
      <div className="flex items-center justify-between p-2 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <Mail className="w-5 h-5 text-blue-500" />
          <span className="font-semibold">SERINA Email Assistant</span>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => invoke('show_settings_window')}
            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            onClick={onToggleDarkMode}
            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button
            onClick={() => handleWindowControl('minimize_window')}
            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
          >
            <Minimize2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleWindowControl('maximize_window')}
            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleWindowControl('close_window')}
            className="p-1 hover:bg-red-200 dark:hover:bg-red-700 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Email List */}
        <div className="w-1/3 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Inbox</h2>
              <button
                onClick={loadEmails}
                className="text-sm text-blue-500 hover:text-blue-600"
              >
                Refresh
              </button>
            </div>
          </div>

          {loading ? (
            <div className="p-4 text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-500">Loading emails...</p>
            </div>
          ) : (
            <div className="space-y-1">
              {emails.map((email) => (
                <div
                  key={email.id}
                  onClick={() => selectEmail(email)}
                  className={`p-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 border-b border-gray-100 dark:border-gray-800 ${
                    selectedEmail?.id === email.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <p className="font-medium truncate">{email.sender}</p>
                        {email.is_unread && (
                          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                        {email.subject}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(email.received_time).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Email Detail */}
        <div className="flex-1 flex flex-col">
          {selectedEmail ? (
            <>
              {/* Email Header */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold">{selectedEmail.subject}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  From: {selectedEmail.sender} ({selectedEmail.sender_email})
                </p>
                <p className="text-xs text-gray-500">
                  {new Date(selectedEmail.received_time).toLocaleString()}
                </p>

                {/* Action buttons */}
                <div className="flex space-x-2 mt-3">
                  <button
                    onClick={() => handleMarkRead(selectedEmail.id)}
                    className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
                  >
                    Mark Read
                  </button>
                  <button
                    onClick={() => setShowReplyBox(!showReplyBox)}
                    className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                  >
                    Reply
                  </button>
                  <button
                    onClick={() => handleCreateTask(selectedEmail)}
                    className="px-3 py-1 bg-purple-500 text-white rounded text-sm hover:bg-purple-600 flex items-center space-x-1"
                  >
                    <CheckSquare className="w-4 h-4" />
                    <span>Create Task</span>
                  </button>
                </div>
              </div>

              {/* AI Summary */}
              {summary && (
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center space-x-2 mb-2">
                    <Bot className="w-4 h-4 text-yellow-600" />
                    <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                      AI Summary
                    </span>
                  </div>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">{summary}</p>
                </div>
              )}

              {/* Reply Box */}
              {showReplyBox && (
                <div className="p-4 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type your reply..."
                    className="w-full h-24 p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  <div className="flex space-x-2 mt-2">
                    <button
                      onClick={handleSendReply}
                      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      Send Reply
                    </button>
                    <button
                      onClick={() => setShowReplyBox(false)}
                      className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Email Content */}
              <div className="flex-1 p-4 overflow-y-auto">
                <div 
                  className="prose dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ 
                    __html: selectedEmail.body.replace(/\n/g, '<br>') 
                  }}
                />
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <Mail className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Select an email to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
