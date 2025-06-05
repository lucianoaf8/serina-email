import React, { useState } from 'react';
import Settings from './components/Settings'; // Import the Settings component
import RemindersPage from './components/RemindersPage'; // Import the RemindersPage component
import EmailsPage from './components/EmailsPage'; // Import the EmailsPage component

function App() {
  const handleMinimize = () => {
    if (window.electronAPI) {
      window.electronAPI.send('minimize-window');
    }
  };

  const handleMaximize = () => {
    if (window.electronAPI) {
      window.electronAPI.send('maximize-window');
    }
  };

  const handleClose = () => {
    if (window.electronAPI) {
      window.electronAPI.send('close-window');
    }
  };

  const [currentPage, setCurrentPage] = useState('emails'); // 'welcome', 'settings', 'reminders', 'emails'

  const toggleSettings = () => {
    setCurrentPage(currentPage === 'settings' ? 'emails' : 'settings');
  };

  const navigateToReminders = () => {
    setCurrentPage('reminders');
  };

  const navigateToEmails = () => {
    setCurrentPage('emails');
  };

  const navigateToWelcome = () => {
    setCurrentPage('welcome');
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white flex flex-col items-stretch">
      {/* Custom Title Bar */}
      <div className="w-full h-10 bg-gray-200 dark:bg-gray-800 flex justify-between items-center fixed top-0 left-0 select-none drag-region shadow-md z-50">
        <div className="pl-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
          SERINA Email Assistant
        </div>
        <div className="flex items-center">
          <button 
            onClick={navigateToEmails} 
            className="px-4 py-2 text-sm hover:bg-gray-300 dark:hover:bg-gray-700 no-drag-region focus:outline-none"
            title="Emails"
          >
            📧
          </button>
          <button 
            onClick={navigateToReminders} 
            className="px-4 py-2 text-sm hover:bg-gray-300 dark:hover:bg-gray-700 no-drag-region focus:outline-none"
            title="Reminders"
          >
            🔔
          </button>
          <button 
            onClick={toggleSettings} 
            className="px-4 py-2 text-sm hover:bg-gray-300 dark:hover:bg-gray-700 no-drag-region focus:outline-none"
            title="Settings"
          >
            ⚙️
          </button>
          <button onClick={handleMinimize} className="px-4 py-2 hover:bg-gray-300 dark:hover:bg-gray-700 no-drag-region focus:outline-none" title="Minimize">_</button>
          <button onClick={handleMaximize} className="px-4 py-2 hover:bg-gray-300 dark:hover:bg-gray-700 no-drag-region focus:outline-none" title="Maximize">[]</button>
          <button onClick={handleClose} className="px-4 py-2 hover:bg-red-500 hover:text-white no-drag-region focus:outline-none" title="Close">X</button>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="pt-10 flex-grow overflow-auto">
        {currentPage === 'settings' ? (
          <Settings onClose={() => setCurrentPage('emails')} />
        ) : currentPage === 'reminders' ? (
          <RemindersPage />
        ) : currentPage === 'emails' ? (
          <EmailsPage />
        ) : (
          <div className="p-6 text-center">
            <h1 className="text-4xl font-bold mb-4 text-indigo-600 dark:text-indigo-400">Welcome to SERINA</h1>
            <p className="text-lg text-gray-700 dark:text-gray-300">Your intelligent email assistant.</p>
            <div className="mt-8 space-y-4">
              <button 
                onClick={navigateToEmails}
                className="w-full max-w-sm mx-auto block px-6 py-3 text-lg font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                📧 View Emails
              </button>
              <button 
                onClick={navigateToReminders}
                className="w-full max-w-sm mx-auto block px-6 py-3 text-lg font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                🔔 Manage Reminders
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );

}

export default App;
