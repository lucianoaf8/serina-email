import React, { useState, useEffect } from 'react';
import { useEmailSummarization, useReplyGeneration } from '../hooks/useLLM';

function EmailDetail({ emailId, onClose, onEmailUpdate }) {
  const [email, setEmail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showSummary, setShowSummary] = useState(false);
  const [summary, setSummary] = useState('');
  const [replyDraft, setReplyDraft] = useState('');
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyInstructions, setReplyInstructions] = useState('');

  // Use LLM hooks
  const { summarizeEmail, summaryLoading, summaryError } = useEmailSummarization();
  const { generateReply, replyLoading, replyError } = useReplyGeneration();

  // Fetch email details
  useEffect(() => {
    if (emailId) {
      fetchEmail();
    }
  }, [emailId]);

  const fetchEmail = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`http://localhost:8000/emails/${emailId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch email: ${response.statusText}`);
      }

      const data = await response.json();
      setEmail(data);

      // Mark as read if not already
      if (!data.is_read) {
        updateEmailStatus({ is_read: true });
      }

    } catch (err) {
      console.error('Error fetching email:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Update email status
  const updateEmailStatus = async (statusUpdate) => {
    try {
      const response = await fetch(`http://localhost:8000/emails/${emailId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(statusUpdate)
      });

      if (!response.ok) {
        throw new Error('Failed to update email status');
      }

      // Update local state
      setEmail(prev => ({ ...prev, ...statusUpdate }));
      
      // Notify parent component
      if (onEmailUpdate) {
        onEmailUpdate(emailId, statusUpdate);
      }

    } catch (err) {
      console.error('Error updating email status:', err);
      setError(err.message);
    }
  };

  // Generate email summary using LLM
  const generateSummary = async () => {
    if (!email?.body_content && !email?.body_preview) {
      setError('No email content available for summarization');
      return;
    }

    try {
      const content = email.body_content || email.body_preview;
      const summaryText = await summarizeEmail(content);
      setSummary(summaryText);
      setShowSummary(true);
    } catch (err) {
      console.error('Error generating summary:', err);
      setError(err.message || 'Failed to generate summary');
    }
  };

  // Generate reply draft
  const handleGenerateReply = async () => {
    if (!email) return;

    if (!replyInstructions.trim()) {
      setError('Please provide instructions for the reply');
      return;
    }

    try {
      // Prepare email context
      const emailContext = `
Subject: ${email.subject || '(No Subject)'}
From: ${email.sender?.name || email.sender?.email || 'Unknown'}
Date: ${email.received_date_time || email.sent_date_time}

${email.body_content || email.body_preview || 'No content available'}
      `.trim();

      const draftText = await generateReply(emailContext, replyInstructions);
      setReplyDraft(draftText);
      setShowReplyForm(true);
    } catch (err) {
      console.error('Error generating reply draft:', err);
      setError(err.message || 'Failed to generate reply');
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Get display name for email address
  const getDisplayName = (emailAddress) => {
    if (!emailAddress) return '';
    return emailAddress.name || emailAddress.email || '';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <div className="text-red-600 text-center">
          <h3 className="text-lg font-medium">Error loading email</h3>
          <p className="text-sm">{error}</p>
        </div>
        <button
          onClick={fetchEmail}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!email) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        Select an email to view details
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {email.subject || '(No Subject)'}
            </h1>
            
            <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center space-x-2">
                <span className="font-medium">From:</span>
                <span>{getDisplayName(email.sender)}</span>
              </div>
              
              {email.to_recipients && email.to_recipients.length > 0 && (
                <div className="flex items-center space-x-2">
                  <span className="font-medium">To:</span>
                  <span>{email.to_recipients.map(getDisplayName).join(', ')}</span>
                </div>
              )}
              
              {email.cc_recipients && email.cc_recipients.length > 0 && (
                <div className="flex items-center space-x-2">
                  <span className="font-medium">CC:</span>
                  <span>{email.cc_recipients.map(getDisplayName).join(', ')}</span>
                </div>
              )}
              
              <div className="flex items-center space-x-2">
                <span className="font-medium">Date:</span>
                <span>{formatDate(email.received_date_time || email.sent_date_time)}</span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center space-x-2 ml-4">
            <button
              onClick={() => updateEmailStatus({ is_flagged: !email.is_flagged })}
              className={`p-2 rounded-md transition-colors ${
                email.is_flagged 
                  ? 'text-yellow-500 bg-yellow-50 hover:bg-yellow-100 dark:bg-yellow-900/20 dark:hover:bg-yellow-900/30' 
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
              title={email.is_flagged ? 'Remove flag' : 'Add flag'}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md dark:hover:bg-gray-800"
              title="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Action bar */}
        <div className="flex items-center space-x-2 mt-4">
          <button
            onClick={generateSummary}
            disabled={summaryLoading}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {summaryLoading ? 'Generating...' : 'Summarize'}
          </button>
          
          <button
            onClick={() => setShowReplyForm(true)}
            className="px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Draft Reply
          </button>
          
          <button
            onClick={() => {/* TODO: Implement reminder creation */}}
            className="px-3 py-1 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700"
          >
            Set Reminder
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {/* Error display */}
        {(summaryError || replyError) && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <h3 className="text-sm font-medium text-red-900 dark:text-red-300 mb-2">
              Error
            </h3>
            <p className="text-sm text-red-800 dark:text-red-200">
              {summaryError || replyError}
            </p>
          </div>
        )}

        {/* Summary section */}
        {showSummary && summary && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">
              Email Summary
            </h3>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              {summary}
            </p>
          </div>
        )}

        {/* Attachments */}
        {email.attachments && email.attachments.length > 0 && (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
              Attachments ({email.attachments.length})
            </h3>
            <div className="space-y-2">
              {email.attachments.map((attachment, index) => (
                <div key={index} className="flex items-center space-x-2 text-sm">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">{attachment.name}</span>
                  {attachment.size && (
                    <span className="text-gray-500 text-xs">
                      ({Math.round(attachment.size / 1024)} KB)
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Email body */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="prose dark:prose-invert max-w-none">
            {email.body_content ? (
              <div 
                className="text-gray-900 dark:text-gray-100"
                dangerouslySetInnerHTML={{ __html: email.body_content }}
              />
            ) : email.body_preview ? (
              <p className="text-gray-900 dark:text-gray-100">{email.body_preview}</p>
            ) : (
              <p className="text-gray-500 italic">No content available</p>
            )}
          </div>
        </div>

        {/* Reply form */}
        {showReplyForm && (
          <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
              Draft Reply
            </h3>
            
            {/* Instructions input */}
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Reply Instructions
              </label>
              <input
                type="text"
                value={replyInstructions}
                onChange={(e) => setReplyInstructions(e.target.value)}
                placeholder="e.g., 'Write a brief professional response accepting the meeting'"
                className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
              <button
                onClick={handleGenerateReply}
                disabled={replyLoading || !replyInstructions.trim()}
                className="mt-2 px-3 py-1 text-xs bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {replyLoading ? 'Generating...' : 'Generate Draft'}
              </button>
            </div>

            {/* Reply draft textarea */}
            {replyDraft && (
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Generated Draft
                </label>
                <textarea
                  value={replyDraft}
                  onChange={(e) => setReplyDraft(e.target.value)}
                  rows={6}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Your reply will appear here..."
                />
              </div>
            )}

            <div className="flex justify-end space-x-2 mt-3">
              <button
                onClick={() => {
                  setShowReplyForm(false);
                  setReplyDraft('');
                  setReplyInstructions('');
                }}
                className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                Cancel
              </button>
              {replyDraft && (
                <button
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  title="Send reply functionality would require email service integration"
                >
                  Send Reply
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default EmailDetail;