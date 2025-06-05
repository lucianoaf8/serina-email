// renderer/src/components/Settings.jsx
import React, { useState, useEffect } from 'react';

const Settings = ({ onClose }) => {
  const [llmProvider, setLlmProvider] = useState('OpenAI');
  const [apiKey, setApiKey] = useState('');
  const [apiBaseUrl, setApiBaseUrl] = useState('');
  const [selectedModel, setSelectedModel] = useState('gpt-3.5-turbo');
  
  const [emailAccountType, setEmailAccountType] = useState('microsoft_graph');
  const [msGraphClientId, setMsGraphClientId] = useState('');
  const [msGraphTenantId, setMsGraphTenantId] = useState('');
  // Add more email settings as needed, e.g., for IMAP/SMTP

  const [reminderInterval, setReminderInterval] = useState(15); // in minutes
  const [fetchLimit, setFetchLimit] = useState(25);

  const [uiTheme, setUiTheme] = useState('system'); // system, light, dark
  const [showNotifications, setShowNotifications] = useState(true);

  const [statusMessage, setStatusMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const BACKEND_URL = 'http://localhost:8000'; // Assuming backend runs on port 8000

  const handleLoadSettings = async () => {
    setIsLoading(true);
    setStatusMessage('Loading settings from backend...');
    console.log('Attempting to load settings from backend...');
    try {
      const response = await fetch(`${BACKEND_URL}/config`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: response.statusText }));
        throw new Error(`HTTP error ${response.status}: ${errorData.detail || 'Failed to load settings'}`);
      }
      const fetchedSettings = await response.json();
      
      // Update state with fetched settings, providing defaults for missing fields
      setLlmProvider(fetchedSettings.llmProvider || 'OpenAI');
      setApiKey(fetchedSettings.apiKey || '');
      setApiBaseUrl(fetchedSettings.apiBaseUrl || '');
      setSelectedModel(fetchedSettings.selectedModel || 'gpt-3.5-turbo');
      
      setEmailAccountType(fetchedSettings.emailAccount?.type || 'microsoft_graph');
      setMsGraphClientId(fetchedSettings.emailAccount?.microsoftGraphClientId || '');
      setMsGraphTenantId(fetchedSettings.emailAccount?.microsoftGraphTenantId || '');
      
      setReminderInterval(fetchedSettings.scheduler?.intervalMinutes || 15);
      setFetchLimit(fetchedSettings.scheduler?.fetchLimit || 25);
      
      setUiTheme(fetchedSettings.uiPreferences?.theme || 'system');
      setShowNotifications(fetchedSettings.uiPreferences?.showNotifications !== undefined 
        ? fetchedSettings.uiPreferences.showNotifications 
        : true);
      
      setStatusMessage('Settings loaded successfully.');
      console.log('Settings loaded from backend:', fetchedSettings);
    } catch (error) {
      setStatusMessage(`Error loading settings: ${error.message}`);
      console.error('Error loading settings:', error);
      // Optionally, reset to default values or keep current state on error
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setIsLoading(true);
    setStatusMessage('Saving settings to backend...');
    const settingsToSave = {
      llmProvider,
      apiKey: apiKey || null, // Send null if empty, backend schema might require it or handle it
      apiBaseUrl: apiBaseUrl || null,
      selectedModel,
      emailAccount: {
        type: emailAccountType,
        microsoftGraphClientId: msGraphClientId || null,
        microsoftGraphTenantId: msGraphTenantId || null,
        // Placeholder for other email account types
        imapHost: null,
        imapPort: null,
        imapUser: null,
        imapPassword: null, // Sensitive, handle with care
        smtpHost: null,
        smtpPort: null,
        smtpUser: null,
        smtpPassword: null, // Sensitive, handle with care
        smtpUseTLS: true,
      },
      scheduler: {
        intervalMinutes: parseInt(reminderInterval, 10) || 15,
        fetchLimit: parseInt(fetchLimit, 10) || 25,
      },
      uiPreferences: {
        theme: uiTheme,
        showNotifications,
      },
      // Ensure all fields from settings_schema.json are present or handled as optional
      // For example, if schema has 'database' settings:
      database: {
        type: "sqlite", // Example default
        path: "./serina_db.sqlite3",
        encrypt: false
      }
    };
    console.log('Attempting to save settings to backend:', settingsToSave);
    try {
      const response = await fetch(`${BACKEND_URL}/config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settingsToSave),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: response.statusText }));
        throw new Error(`HTTP error ${response.status}: ${errorData.detail || 'Failed to save settings'}`);
      }
      const savedSettings = await response.json(); // Backend should return the saved (and possibly validated/cleaned) config
      setStatusMessage('Settings saved successfully!');
      console.log('Settings saved successfully, backend response:', savedSettings);
      // Optionally, reload settings from backend to confirm or update UI with validated data
      // handleLoadSettings(); 
    } catch (error) {
      setStatusMessage(`Error saving settings: ${error.message}`);
      console.error('Error saving settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Automatically call load settings on component mount (for this mock version)
  useEffect(() => {
    handleLoadSettings();
  }, []);

  const inputClass = "mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900 dark:text-gray-100";
  const labelClass = "block text-sm font-medium text-gray-700 dark:text-gray-300";
  const sectionClass = "mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg shadow";
  const titleClass = "text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3";

  return (
    <div className="p-6 max-w-3xl mx-auto bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-xl shadow-lg">
      <h1 className="text-2xl font-bold mb-6 text-center text-indigo-600 dark:text-indigo-400">Application Settings</h1>

      {/* LLM Settings */}
      <div className={sectionClass}>
        <h2 className={titleClass}>LLM Configuration</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="llmProvider" className={labelClass}>LLM Provider</label>
            <select id="llmProvider" value={llmProvider} onChange={(e) => setLlmProvider(e.target.value)} className={inputClass}>
              <option value="OpenAI">OpenAI</option>
              {/* <option value="Anthropic">Anthropic</option> */}
              {/* Add other providers here */}
            </select>
          </div>
          <div>
            <label htmlFor="selectedModel" className={labelClass}>Model Name</label>
            <input type="text" id="selectedModel" value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)} className={inputClass} placeholder="e.g., gpt-3.5-turbo" />
          </div>
        </div>
        <div className="mt-4">
          <label htmlFor="apiKey" className={labelClass}>API Key</label>
          <input type="password" id="apiKey" value={apiKey} onChange={(e) => setApiKey(e.target.value)} className={inputClass} placeholder="Enter your API key" />
        </div>
        <div className="mt-4">
          <label htmlFor="apiBaseUrl" className={labelClass}>API Base URL (Optional)</label>
          <input type="text" id="apiBaseUrl" value={apiBaseUrl} onChange={(e) => setApiBaseUrl(e.target.value)} className={inputClass} placeholder="e.g., https://api.openai.com/v1" />
        </div>
      </div>

      {/* Email Account Settings */}
      <div className={sectionClass}>
        <h2 className={titleClass}>Email Account</h2>
        <div>
          <label htmlFor="emailAccountType" className={labelClass}>Account Type</label>
          <select id="emailAccountType" value={emailAccountType} onChange={(e) => setEmailAccountType(e.target.value)} className={inputClass}>
            <option value="microsoft_graph">Microsoft Graph (Outlook/Office 365)</option>
            {/* <option value="imap_smtp">IMAP/SMTP (Generic)</option> */}
          </select>
        </div>
        {emailAccountType === 'microsoft_graph' && (
          <>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="msGraphClientId" className={labelClass}>Microsoft Graph Client ID</label>
                <input type="text" id="msGraphClientId" value={msGraphClientId} onChange={(e) => setMsGraphClientId(e.target.value)} className={inputClass} placeholder="Azure App Client ID" />
              </div>
              <div>
                <label htmlFor="msGraphTenantId" className={labelClass}>Microsoft Graph Tenant ID</label>
                <input type="text" id="msGraphTenantId" value={msGraphTenantId} onChange={(e) => setMsGraphTenantId(e.target.value)} className={inputClass} placeholder="Azure App Tenant ID or 'common'" />
              </div>
            </div>
            {/* Microsoft OAuth Login Button */}
            <div className="mt-4 flex items-center">
              <button
                type="button"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                onClick={async () => {
                  setStatusMessage('Initiating Microsoft OAuth login...');
                  try {
                    const res = await fetch(`${BACKEND_URL}/oauth/login`);
                    if (!res.ok) throw new Error('Failed to initiate OAuth login');
                    const data = await res.json();
                    if (data && data.url) {
                      window.open(data.url, '_blank', 'noopener,noreferrer');
                      setStatusMessage('OAuth login page opened. Complete login in browser.');
                    } else {
                      throw new Error('No login URL returned from backend');
                    }
                  } catch (err) {
                    setStatusMessage('Error starting OAuth login: ' + (err.message || err));
                  }
                }}
              >
                Login with Microsoft
              </button>
            </div>
          </>
        )}
        {/* Add fields for IMAP/SMTP here when implemented */}
      </div>
      
      {/* Scheduler Settings */}
      <div className={sectionClass}>
        <h2 className={titleClass}>Scheduler Configuration</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="reminderInterval" className={labelClass}>Email Check Interval (minutes)</label>
            <input type="number" id="reminderInterval" value={reminderInterval} onChange={(e) => setReminderInterval(e.target.value)} className={inputClass} min="1" />
          </div>
          <div>
            <label htmlFor="fetchLimit" className={labelClass}>Emails to Fetch Per Check</label>
            <input type="number" id="fetchLimit" value={fetchLimit} onChange={(e) => setFetchLimit(e.target.value)} className={inputClass} min="1" max="100" />
          </div>
        </div>
      </div>

      {/* UI Preferences */}
      <div className={sectionClass}>
        <h2 className={titleClass}>UI Preferences</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="uiTheme" className={labelClass}>Theme</label>
            <select id="uiTheme" value={uiTheme} onChange={(e) => setUiTheme(e.target.value)} className={inputClass}>
              <option value="system">System Default</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>
          <div className="flex items-center mt-4 md:mt-0 md:pt-6">
            <input type="checkbox" id="showNotifications" checked={showNotifications} onChange={(e) => setShowNotifications(e.target.checked)} className="h-4 w-4 text-indigo-600 border-gray-300 dark:border-gray-600 rounded focus:ring-indigo-500" />
            <label htmlFor="showNotifications" className="ml-2 block text-sm text-gray-900 dark:text-gray-200">Show Desktop Notifications</label>
          </div>
        </div>
      </div>

      {/* Action Buttons & Status */}
      <div className="mt-8 flex flex-col sm:flex-row justify-end items-center gap-4">
        {statusMessage && (
          <p className={`text-sm ${statusMessage.includes('Error') ? 'text-red-500 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
            {statusMessage}
          </p>
        )}
        <button
          onClick={handleLoadSettings}
          disabled={isLoading}
          className="w-full sm:w-auto px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 dark:bg-gray-500 dark:hover:bg-gray-400 disabled:opacity-50"
        >
          {isLoading ? 'Loading...' : 'Reload Settings'}
        </button>
        <button
          onClick={handleSaveSettings}
          disabled={isLoading}
          className="w-full sm:w-auto px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-400 disabled:opacity-50"
        >
          {isLoading ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
};

export default Settings;
