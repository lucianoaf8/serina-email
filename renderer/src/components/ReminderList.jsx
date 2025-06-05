// renderer/src/components/ReminderList.jsx
import React, { useState, useEffect, useCallback } from 'react';

const BACKEND_URL = 'http://localhost:8000';

const ReminderItem = ({ reminder, onMarkDone, onEdit, onDelete }) => {
  const { id, message, reminder_time, email_id, subject } = reminder;

  const formattedTime = new Date(reminder_time).toLocaleString();

  return (
    <div className="p-4 mb-3 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-lg font-semibold text-indigo-600 dark:text-indigo-400">{message}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Due: {formattedTime}</p>
          {email_id && (
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              Related to Email ID: {email_id} {subject ? `(${subject})` : ''}
            </p>
          )}
        </div>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 mt-2 sm:mt-0">
          <button 
            onClick={() => onMarkDone(id)}
            className="px-3 py-1 text-xs font-medium text-white bg-green-500 hover:bg-green-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-400 dark:bg-green-600 dark:hover:bg-green-700"
          >
            Done
          </button>
          <button 
            onClick={() => onEdit(reminder)}
            className="px-3 py-1 text-xs font-medium text-white bg-yellow-500 hover:bg-yellow-600 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400 dark:bg-yellow-600 dark:hover:bg-yellow-700"
          >
            Edit
          </button>
          <button 
            onClick={() => onDelete(id)}
            className="px-3 py-1 text-xs font-medium text-white bg-red-500 hover:bg-red-600 rounded-md focus:outline-none focus:ring-2 focus:ring-red-400 dark:bg-red-600 dark:hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

const ReminderList = ({ onEditReminder, onNewReminder }) => {
  const [reminders, setReminders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('active'); // 'active', 'all'

  const fetchReminders = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const activeOnly = filter === 'active';
    try {
      const response = await fetch(`${BACKEND_URL}/reminders?active_only=${activeOnly}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: response.statusText }));
        throw new Error(`HTTP error ${response.status}: ${errorData.detail || 'Failed to load reminders'}`);
      }
      const data = await response.json();
      setReminders(data);
    } catch (err) {
      setError(err.message);
      console.error('Failed to fetch reminders:', err);
    } finally {
      setIsLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchReminders();
  }, [fetchReminders]);

  const handleMarkDone = async (reminderId) => {
    console.log(`Marking reminder ${reminderId} as done (placeholder)...`);
    // In a real app, this would call: PUT /reminders/{reminderId} with active: false
    // For now, just refetch to simulate change if backend were updated.
    // To make it optimistic, update local state first.
    try {
      const response = await fetch(`${BACKEND_URL}/reminders/${reminderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: false }) // Assuming other fields are optional or handled by backend
      });
      if (!response.ok) throw new Error('Failed to mark reminder as done');
      fetchReminders(); // Re-fetch the list
    } catch (err) {
      console.error('Error marking reminder done:', err);
      setError('Could not update reminder status. Please try again.');
    }
  };

  const handleDeleteReminder = async (reminderId) => {
    console.log(`Deleting reminder ${reminderId} (placeholder)...`);
    // In a real app, this would call: DELETE /reminders/{reminderId}
    // Optimistic update: setReminders(reminders.filter(r => r.id !== reminderId));
    if (window.confirm('Are you sure you want to delete this reminder?')) {
        try {
            const response = await fetch(`${BACKEND_URL}/reminders/${reminderId}`, {
                method: 'DELETE',
            });
            if (!response.ok) throw new Error('Failed to delete reminder');
            fetchReminders(); // Re-fetch the list
        } catch (err) {
            console.error('Error deleting reminder:', err);
            setError('Could not delete reminder. Please try again.');
        }
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto bg-gray-50 dark:bg-gray-900 rounded-xl shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">Reminders</h2>
        <div className="flex items-center space-x-2">
            <select 
                value={filter} 
                onChange={(e) => setFilter(e.target.value)}
                className="px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900 dark:text-gray-100"
            >
                <option value="active">Active</option>
                <option value="all">All</option>
            </select>
            <button 
                onClick={onNewReminder} 
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-400"
            >
                New Reminder
            </button>
        </div>
      </div>

      {isLoading && <p className="text-center text-gray-700 dark:text-gray-300">Loading reminders...</p>}
      {error && <p className="text-center text-red-500 dark:text-red-400">Error: {error}</p>}
      
      {!isLoading && !error && reminders.length === 0 && (
        <p className="text-center text-gray-500 dark:text-gray-400">
          {filter === 'active' ? 'No active reminders.' : 'No reminders found.'}
        </p>
      )}

      {!isLoading && !error && reminders.length > 0 && (
        <div className="space-y-3">
          {reminders.map(reminder => (
            <ReminderItem 
              key={reminder.id} 
              reminder={reminder} 
              onMarkDone={handleMarkDone} 
              onEdit={onEditReminder} // Pass the prop from parent
              onDelete={handleDeleteReminder} 
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ReminderList;
