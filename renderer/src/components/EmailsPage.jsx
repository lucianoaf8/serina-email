import React, { useState } from 'react';
import EmailList from './EmailList';
import EmailDetail from './EmailDetail';

function EmailsPage() {
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [showDetail, setShowDetail] = useState(false);

  const handleEmailSelect = (email) => {
    setSelectedEmail(email);
    setShowDetail(true);
  };

  const handleCloseDetail = () => {
    setShowDetail(false);
    setSelectedEmail(null);
  };

  const handleEmailUpdate = (emailId, statusUpdate) => {
    // This callback can be used to update the email in the list when status changes
    // The EmailList component will handle its own state updates via API calls
    console.log('Email updated:', emailId, statusUpdate);
  };

  return (
    <div className="flex h-full bg-gray-100 dark:bg-gray-900">
      {/* Email List Panel */}
      <div className={`${showDetail ? 'w-1/2' : 'w-full'} border-r border-gray-200 dark:border-gray-700 transition-all duration-300`}>
        <EmailList
          onEmailSelect={handleEmailSelect}
          selectedEmailId={selectedEmail?.id}
        />
      </div>

      {/* Email Detail Panel */}
      {showDetail && (
        <div className="w-1/2 min-w-0">
          <EmailDetail
            emailId={selectedEmail?.id}
            onClose={handleCloseDetail}
            onEmailUpdate={handleEmailUpdate}
          />
        </div>
      )}

      {/* Empty state when no email selected */}
      {!showDetail && (
        <div className="hidden lg:flex lg:flex-1 lg:items-center lg:justify-center">
          <div className="text-center text-gray-500 dark:text-gray-400">
            <svg className="mx-auto h-12 w-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 8l7.89 3.26a2 2 0 001.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <h3 className="text-lg font-medium mb-2">No email selected</h3>
            <p className="text-sm">Choose an email from the list to view its contents</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default EmailsPage;