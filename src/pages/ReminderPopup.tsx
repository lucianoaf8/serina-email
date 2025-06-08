import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { invoke } from "@tauri-apps/api/tauri";
import { Mail, Clock, X, Eye } from "lucide-react";

export default function ReminderPopup() {
  const [searchParams] = useSearchParams();
  const [emailCount, setEmailCount] = useState(0);

  useEffect(() => {
    const count = searchParams.get('count');
    setEmailCount(parseInt(count || '0'));
  }, [searchParams]);

  const handleView = async () => {
    try {
      // Focus main window
      await invoke('backend_request', {
        endpoint: '/focus-main-window',
        method: 'POST',
        body: null
      });
      // Close this popup
      await invoke('close_window');
    } catch (error) {
      console.error('Failed to focus main window:', error);
    }
  };

  const handleSnooze = async (minutes: number) => {
    try {
      // Implement snooze logic - for now just close
      await invoke('close_window');
    } catch (error) {
      console.error('Failed to snooze:', error);
    }
  };

  const handleDismiss = async () => {
    try {
      await invoke('close_window');
    } catch (error) {
      console.error('Failed to dismiss:', error);
    }
  };

  return (
    <div className="h-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg">
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Mail className="w-5 h-5 text-blue-500" />
            <span className="font-semibold text-gray-900 dark:text-white">
              SERINA
            </span>
          </div>
          <button
            onClick={handleDismiss}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Message */}
        <div className="mb-4">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            {emailCount === 0 && "No new emails"}
            {emailCount === 1 && "1 new email"}
            {emailCount > 1 && `${emailCount} new emails`}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between space-x-2">
          <button
            onClick={handleView}
            className="flex-1 px-3 py-2 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 flex items-center justify-center space-x-1"
          >
            <Eye className="w-3 h-3" />
            <span>View</span>
          </button>
          
          <button
            onClick={() => handleSnooze(15)}
            className="px-2 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-xs flex items-center space-x-1"
          >
            <Clock className="w-3 h-3" />
            <span>15m</span>
          </button>
          
          <button
            onClick={() => handleSnooze(60)}
            className="px-2 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-xs flex items-center space-x-1"
          >
            <Clock className="w-3 h-3" />
            <span>1h</span>
          </button>
          
          <button
            onClick={handleDismiss}
            className="px-2 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-xs"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
