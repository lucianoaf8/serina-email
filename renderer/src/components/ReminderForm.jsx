// renderer/src/components/ReminderForm.jsx
import React, { useState, useEffect } from 'react';

const BACKEND_URL = 'http://localhost:8000';

const ReminderForm = ({ existingReminder, onSave, onCancel }) => {
  const [message, setMessage] = useState('');
  const [reminderTime, setReminderTime] = useState(''); // ISO format string for datetime-local
  const [emailId, setEmailId] = useState(''); // Optional
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (existingReminder) {
      setMessage(existingReminder.message || '');
      // Format date for datetime-local input: YYYY-MM-DDTHH:mm
      const dt = new Date(existingReminder.reminder_time);
      // Adjust for timezone offset to display correctly in local time input
      const timezoneOffset = dt.getTimezoneOffset() * 60000; //offset in milliseconds
      const localISOTime = new Date(dt.getTime() - timezoneOffset).toISOString().slice(0, 16);
      setReminderTime(localISOTime);
      setEmailId(existingReminder.email_id || '');
    } else {
      // Default new reminder time to 1 hour from now
      const dt = new Date(Date.now() + 60 * 60 * 1000);
      const timezoneOffset = dt.getTimezoneOffset() * 60000;
      const localISOTime = new Date(dt.getTime() - timezoneOffset).toISOString().slice(0, 16);
      setReminderTime(localISOTime);
    }
  }, [existingReminder]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!message || !reminderTime) {
      setError('Message and Reminder Time are required.');
      setIsLoading(false);
      return;
    }

    // Convert local datetime-local string back to UTC ISO string for backend
    const utcReminderTime = new Date(reminderTime).toISOString();

    const reminderData = {
      message,
      reminder_time: utcReminderTime,
      email_id: emailId || null, // Send null if empty
      // 'active' status is usually managed by backend on creation/update
    };

    const url = existingReminder 
      ? `${BACKEND_URL}/reminders/${existingReminder.id}` 
      : `${BACKEND_URL}/reminders`;
    const method = existingReminder ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reminderData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: response.statusText }));
        throw new Error(`HTTP error ${response.status}: ${errorData.detail || 'Failed to save reminder'}`);
      }
      
      const savedReminder = await response.json();
      onSave(savedReminder); // Callback to parent to handle successful save (e.g., close form, refresh list)
    } catch (err) {
      setError(err.message);
      console.error('Failed to save reminder:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass = "mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900 dark:text-gray-100";
  const labelClass = "block text-sm font-medium text-gray-700 dark:text-gray-300";

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center items-center">
      <div className="p-6 max-w-lg w-full mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-2xl">
        <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
          {existingReminder ? 'Edit Reminder' : 'Create New Reminder'}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="message" className={labelClass}>Message</label>
            <input 
              type="text" 
              id="message" 
              value={message} 
              onChange={(e) => setMessage(e.target.value)} 
              className={inputClass} 
              required 
            />
          </div>
          <div>
            <label htmlFor="reminderTime" className={labelClass}>Reminder Time (Local)</label>
            <input 
              type="datetime-local" 
              id="reminderTime" 
              value={reminderTime} 
              onChange={(e) => setReminderTime(e.target.value)} 
              className={inputClass} 
              required 
            />
          </div>
          <div>
            <label htmlFor="emailId" className={labelClass}>Associated Email ID (Optional)</label>
            <input 
              type="text" 
              id="emailId" 
              value={emailId} 
              onChange={(e) => setEmailId(e.target.value)} 
              className={inputClass} 
              placeholder="e.g., AAMkAGV..."
            />
          </div>

          {error && <p className="text-sm text-red-500 dark:text-red-400">{error}</p>}

          <div className="flex justify-end space-x-3 pt-2">
            <button 
              type="button" 
              onClick={onCancel} 
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 disabled:opacity-50"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-400 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isLoading ? (existingReminder ? 'Saving...' : 'Creating...') : (existingReminder ? 'Save Changes' : 'Create Reminder')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReminderForm;
