import React from 'react';

function EmailItem({ email, isSelected, onClick, onStatusUpdate }) {
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 24 * 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  // Toggle read status
  const toggleRead = (e) => {
    e.stopPropagation();
    onStatusUpdate(email.id, { is_read: !email.is_read });
  };

  // Toggle flag status
  const toggleFlag = (e) => {
    e.stopPropagation();
    onStatusUpdate(email.id, { is_flagged: !email.is_flagged });
  };

  // Get sender display name
  const getSenderDisplay = () => {
    if (email.sender?.name) {
      return email.sender.name;
    }
    if (email.sender?.email) {
      return email.sender.email;
    }
    return 'Unknown Sender';
  };

  // Truncate text to specified length
  const truncateText = (text, maxLength) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div
      className={`p-4 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 ${
        isSelected 
          ? 'bg-blue-50 border-r-2 border-blue-500 dark:bg-blue-900/20 dark:border-blue-400' 
          : ''
      } ${
        !email.is_read 
          ? 'bg-gray-50 dark:bg-gray-800/50' 
          : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-start space-x-3">
        {/* Read/Unread indicator */}
        <button
          onClick={toggleRead}
          className={`mt-1 w-2 h-2 rounded-full transition-colors ${
            email.is_read 
              ? 'bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500' 
              : 'bg-blue-500 hover:bg-blue-600'
          }`}
          title={email.is_read ? 'Mark as unread' : 'Mark as read'}
        />

        {/* Email content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            {/* Sender and subject */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <p className={`text-sm font-medium truncate ${
                  email.is_read 
                    ? 'text-gray-600 dark:text-gray-400' 
                    : 'text-gray-900 dark:text-white'
                }`}>
                  {getSenderDisplay()}
                </p>
                {email.is_important && (
                  <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                  </svg>
                )}
                {email.attachments && email.attachments.length > 0 && (
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                )}
              </div>
              
              <p className={`text-sm mt-1 ${
                email.is_read 
                  ? 'text-gray-600 dark:text-gray-400' 
                  : 'text-gray-900 dark:text-white font-medium'
              }`}>
                {truncateText(email.subject || '(No Subject)', 60)}
              </p>
              
              {email.body_preview && (
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 line-clamp-2">
                  {truncateText(email.body_preview, 100)}
                </p>
              )}
            </div>

            {/* Right side: Date, flag, and actions */}
            <div className="flex items-start space-x-2 ml-4">
              {/* Date */}
              <span className="text-xs text-gray-500 dark:text-gray-500 whitespace-nowrap">
                {formatDate(email.received_date_time || email.sent_date_time)}
              </span>

              {/* Flag button */}
              <button
                onClick={toggleFlag}
                className={`p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${
                  email.is_flagged ? 'text-yellow-500' : 'text-gray-400 hover:text-gray-600'
                }`}
                title={email.is_flagged ? 'Remove flag' : 'Add flag'}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>

          {/* Categories/Labels */}
          {email.categories && email.categories.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {email.categories.slice(0, 3).map((category, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                >
                  {category}
                </span>
              ))}
              {email.categories.length > 3 && (
                <span className="text-xs text-gray-500">
                  +{email.categories.length - 3} more
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default EmailItem;