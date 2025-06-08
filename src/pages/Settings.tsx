import React, { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import { Save, TestTube, Moon, Sun, X } from "lucide-react";

interface SettingsProps {
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

interface Config {
  llm: {
    provider: string;
    api_key: string;
    model: string;
  };
  email: {
    check_interval_minutes: number;
    max_emails_per_check: number;
  };
  notifications: {
    quiet_hours_start: string;
    quiet_hours_end: string;
    show_desktop_notifications: boolean;
    notification_position: string;
  };
  ui: {
    dark_mode: boolean;
    window_width: number;
    window_height: number;
  };
  reminders: {
    default_snooze_minutes: number;
    snooze_options: number[];
  };
}

export default function Settings({ darkMode, onToggleDarkMode }: SettingsProps) {
  const [config, setConfig] = useState<Config | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const response = await invoke('get_config');
      const configData = JSON.parse(response as string);
      setConfig(configData);
    } catch (error) {
      console.error('Failed to load config:', error);
      setMessage('Failed to load configuration');
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    if (!config) return;

    try {
      setSaving(true);
      await invoke('save_config', { config });
      setMessage('Settings saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Failed to save config:', error);
      setMessage('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const testLLMConnection = async () => {
    try {
      setTesting(true);
      const response = await invoke('backend_request', {
        endpoint: '/llm/test',
        method: 'GET',
        body: null
      });
      const result = JSON.parse(response as string);
      setMessage(result.connected ? 'LLM connection successful!' : 'LLM connection failed');
    } catch (error) {
      console.error('Failed to test LLM:', error);
      setMessage('Failed to test LLM connection');
    } finally {
      setTesting(false);
    }
  };

  const updateConfig = (path: string, value: any) => {
    if (!config) return;

    const keys = path.split('.');
    const newConfig = { ...config };
    let current: any = newConfig;

    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]];
    }
    
    current[keys[keys.length - 1]] = value;
    setConfig(newConfig);
  };

  const closeWindow = async () => {
    try {
      await invoke('close_window');
    } catch (error) {
      console.error('Failed to close window:', error);
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="h-screen flex items-center justify-center">
        <p className="text-red-500">Failed to load configuration</p>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">SERINA Settings</h1>
        <button
          onClick={closeWindow}
          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* LLM Configuration */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">LLM Configuration</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Provider
              </label>
              <select
                value={config.llm.provider}
                onChange={(e) => updateConfig('llm.provider', e.target.value)}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="openai">OpenAI</option>
                <option value="openrouter">OpenRouter</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Model
              </label>
              <input
                type="text"
                value={config.llm.model}
                onChange={(e) => updateConfig('llm.model', e.target.value)}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              API Key
            </label>
            <div className="flex space-x-2">
              <input
                type="password"
                value={config.llm.api_key}
                onChange={(e) => updateConfig('llm.api_key', e.target.value)}
                placeholder="Enter your API key"
                className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <button
                onClick={testLLMConnection}
                disabled={testing || !config.llm.api_key}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 flex items-center space-x-1"
              >
                <TestTube className="w-4 h-4" />
                <span>{testing ? 'Testing...' : 'Test'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Email Settings */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Email Settings</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Check Interval (minutes)
              </label>
              <select
                value={config.email.check_interval_minutes}
                onChange={(e) => updateConfig('email.check_interval_minutes', parseInt(e.target.value))}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={60}>1 hour</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Max Emails Per Check
              </label>
              <input
                type="number"
                value={config.email.max_emails_per_check}
                onChange={(e) => updateConfig('email.max_emails_per_check', parseInt(e.target.value))}
                min="5"
                max="50"
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Notifications</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Quiet Hours Start
              </label>
              <input
                type="time"
                value={config.notifications.quiet_hours_start}
                onChange={(e) => updateConfig('notifications.quiet_hours_start', e.target.value)}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Quiet Hours End
              </label>
              <input
                type="time"
                value={config.notifications.quiet_hours_end}
                onChange={(e) => updateConfig('notifications.quiet_hours_end', e.target.value)}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="notifications"
              checked={config.notifications.show_desktop_notifications}
              onChange={(e) => updateConfig('notifications.show_desktop_notifications', e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <label htmlFor="notifications" className="text-sm text-gray-700 dark:text-gray-300">
              Show desktop notifications
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Notification Position
            </label>
            <select
              value={config.notifications.notification_position}
              onChange={(e) => updateConfig('notifications.notification_position', e.target.value)}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="top-right">Top Right</option>
              <option value="top-left">Top Left</option>
              <option value="bottom-right">Bottom Right</option>
              <option value="bottom-left">Bottom Left</option>
            </select>
          </div>
        </div>

        {/* UI Settings */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">User Interface</h2>
          
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="darkMode"
              checked={config.ui.dark_mode}
              onChange={(e) => {
                updateConfig('ui.dark_mode', e.target.checked);
                onToggleDarkMode();
              }}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <label htmlFor="darkMode" className="text-sm text-gray-700 dark:text-gray-300 flex items-center space-x-1">
              {darkMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              <span>Dark mode</span>
            </label>
          </div>
        </div>

        {/* Message Display */}
        {message && (
          <div className={`p-3 rounded ${
            message.includes('success') || message.includes('successful') 
              ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200' 
              : 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200'
          }`}>
            {message}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex justify-end space-x-2">
          <button
            onClick={closeWindow}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            Cancel
          </button>
          <button
            onClick={saveConfig}
            disabled={saving}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 flex items-center space-x-1"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
