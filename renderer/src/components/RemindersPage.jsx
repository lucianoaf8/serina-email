// renderer/src/components/RemindersPage.jsx
import React, { useState, useCallback } from 'react';
import ReminderList from './ReminderList';
import ReminderForm from './ReminderForm';

const RemindersPage = () => {
  const [showForm, setShowForm] = useState(false);
  const [editingReminder, setEditingReminder] = useState(null); // null for new, reminder object for edit
  
  // This key forces ReminderList to re-fetch when a reminder is saved.
  // A more granular approach might involve updating the list state directly.
  const [reminderListKey, setReminderListKey] = useState(Date.now()); 

  const handleNewReminder = () => {
    setEditingReminder(null);
    setShowForm(true);
  };

  const handleEditReminder = (reminder) => {
    setEditingReminder(reminder);
    setShowForm(true);
  };

  const handleSaveReminder = (savedReminder) => {
    console.log('Reminder saved:', savedReminder);
    setShowForm(false);
    setEditingReminder(null);
    setReminderListKey(Date.now()); // Trigger re-fetch in ReminderList
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingReminder(null);
  };

  return (
    <div className="container mx-auto p-4 pt-8 bg-gray-100 dark:bg-gray-950 min-h-screen">
      <h1 className="text-3xl font-bold text-center mb-8 text-gray-800 dark:text-gray-200">Manage Your Reminders</h1>
      
      <ReminderList 
        key={reminderListKey} // Force re-render and fetch when key changes
        onEditReminder={handleEditReminder} 
        onNewReminder={handleNewReminder} 
      />

      {showForm && (
        <ReminderForm 
          existingReminder={editingReminder} 
          onSave={handleSaveReminder} 
          onCancel={handleCancelForm} 
        />
      )}
    </div>
  );
};

export default RemindersPage;
