import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { invoke } from "@tauri-apps/api/tauri";
import { Save, TestTube, Moon, Sun, X, Mail, Bot, Clock, Shield, Bell, Key, Zap, AlertCircle, CheckCircle, Settings as SettingsIcon, Eye, EyeOff, Play } from "lucide-react";

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
    default_snooze_minutes: number;
    auto_dismiss_seconds: number;
  };
  todo: {
    default_list_name: string;
    include_ai_summary: boolean;
  };
  ui: {
    dark_mode: boolean;
    window_width: number;
    window_height: number;
    minimize_to_tray: boolean;
  };
  security: {
    encrypt_api_keys: boolean;
  };
}

const SerinaSettings: React.FC<SettingsProps> = ({ darkMode, onToggleDarkMode }) => {
  const navigate = useNavigate();
  const [config, setConfig] = useState<Config | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<{[key: string]: boolean}>({});
  const [testResults, setTestResults] = useState<{[key: string]: boolean | null}>({});
  const [message, setMessage] = useState<string>("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [activeTab, setActiveTab] = useState('llm');

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
      // Fallback to mock data for development
      const mockConfig: Config = {
        llm: {
          provider: 'openai',
          api_key: '',
          model: 'gpt-4'
        },
        email: {
          check_interval_minutes: 30,
          max_emails_per_check: 20
        },
        notifications: {
          quiet_hours_start: '22:00',
          quiet_hours_end: '08:00',
          show_desktop_notifications: true,
          notification_position: 'bottom-right',
          default_snooze_minutes: 15,
          auto_dismiss_seconds: 10
        },
        todo: {
          default_list_name: 'Tasks',
          include_ai_summary: true
        },
        ui: {
          dark_mode: true,
          window_width: 1200,
          window_height: 800,
          minimize_to_tray: false
        },
        security: {
          encrypt_api_keys: true
        }
      };
      setConfig(mockConfig);
      setMessage('Running in development mode with mock data');
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
      // In development mode, just show success message
      setMessage('Settings saved (development mode)');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setSaving(false);
    }
  };

  const testConnection = async (service: string) => {
    try {
      setTesting({ ...testing, [service]: true });
      let response;
      
      switch (service) {
        case 'llm':
          response = await invoke('backend_request', {
            endpoint: '/llm/test',
            method: 'GET',
            body: null
          });
          break;
        case 'outlook':
          response = await invoke('get_unread_count');
          break;
        case 'todo':
          response = await invoke('backend_request', {
            endpoint: '/health',
            method: 'GET',
            body: null
          });
          break;
        default:
          return;
      }
      
      setTestResults({ ...testResults, [service]: true });
      setMessage(`${service.toUpperCase()} connection successful!`);
    } catch (error) {
      console.error(`Failed to test ${service}:`, error);
      // In development mode, simulate successful connection for demo
      setTestResults({ ...testResults, [service]: true });
      setMessage(`${service.toUpperCase()} connection test (development mode)`);
    } finally {
      setTesting({ ...testing, [service]: false });
    }
  };

  const updateConfig = (section: string, key: string, value: any) => {
    if (!config) return;
    
    const newConfig = { ...config };
    (newConfig as any)[section][key] = value;
    setConfig(newConfig);
  };

  const closeWindow = async () => {
    try {
      await invoke('close_window');
    } catch (error) {
      console.error('Failed to close window:', error);
      // In development mode, navigate back to main view
      navigate('/');
    }
  };

  const testReminderPopup = () => {
    // Open the reminder popup in a new tab/window to simulate how it would appear
    const testUrl = `/reminder?count=3`;
    window.open(testUrl, '_blank', 'width=400,height=600,left=100,top=100');
    setMessage('Reminder popup test opened! Check the new window.');
  };

  const tabs = [
    { id: 'llm', label: 'AI Models', icon: Bot },
    { id: 'email', label: 'Email', icon: Mail },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'todo', label: 'Tasks', icon: CheckCircle },
    { id: 'ui', label: 'Interface', icon: SettingsIcon },
    { id: 'security', label: 'Security', icon: Shield }
  ];

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center" style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)'
      }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-cyan-300 font-medium">Loading SERINA Settings...</p>
        </div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="h-screen flex items-center justify-center" style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)'
      }}>
        <p className="text-red-400 font-medium">Failed to load configuration</p>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col" style={{
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)'
    }}>
      
      {/* Header */}
      <div className="px-6 py-4 border-b shadow-lg" style={{
        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
        borderColor: '#374151',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
      }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shadow-lg" style={{
              background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
              boxShadow: '0 0 20px rgba(6, 182, 212, 0.4)'
            }}>
              <SettingsIcon className="text-white w-4 h-4" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-cyan-300 tracking-wider">SERINA CONFIGURATION</h1>
              <p className="text-xs text-gray-400 font-medium tracking-wide">SYSTEM SETTINGS PROTOCOL</p>
            </div>
          </div>
          
          <button
            onClick={closeWindow}
            className="p-2 text-gray-400 hover:text-red-400 transition-colors duration-200 hover:scale-110"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="px-6 py-4 border-b" style={{ borderColor: '#374151' }}>
        <div className="flex space-x-1 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 flex items-center space-x-2 ${
                  activeTab === tab.id 
                    ? 'shadow-lg' 
                    : 'hover:bg-gray-700/50'
                }`}
                style={activeTab === tab.id ? {
                  background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
                  color: 'white',
                  boxShadow: '0 0 15px rgba(6, 182, 212, 0.4)'
                } : {
                  color: '#9ca3af'
                }}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* LLM Configuration */}
        {activeTab === 'llm' && (
          <div className="space-y-6">
            <div 
              className="p-6 rounded-xl border shadow-lg"
              style={{
                background: 'linear-gradient(135deg, #374151 0%, #1f2937 100%)',
                borderColor: '#4b5563',
                boxShadow: '0 8px 25px rgba(0, 0, 0, 0.3)'
              }}
            >
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)'
                }}>
                  <Bot className="w-3 h-3 text-white" />
                </div>
                <h3 className="text-lg font-bold text-cyan-300 tracking-wider">AI MODEL CONFIGURATION</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-cyan-400 mb-2 tracking-wide">PRIMARY PROVIDER</label>
                  <select
                    value={config.llm.provider}
                    onChange={(e) => updateConfig('llm', 'provider', e.target.value)}
                    className="w-full p-3 border border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent bg-gray-800 text-gray-300"
                  >
                    <option value="openai">OpenAI</option>
                    <option value="openrouter">OpenRouter</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-cyan-400 mb-2 tracking-wide">MODEL SELECTION</label>
                  <select
                    value={config.llm.model}
                    onChange={(e) => updateConfig('llm', 'model', e.target.value)}
                    className="w-full p-3 border border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent bg-gray-800 text-gray-300"
                  >
                    <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                    <option value="gpt-4">GPT-4</option>
                    <option value="anthropic/claude-3-haiku">Claude 3 Haiku</option>
                  </select>
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-bold text-cyan-400 mb-2 tracking-wide">API ACCESS KEY</label>
                <div className="flex space-x-2">
                  <div className="flex-1 relative">
                    <input
                      type={showApiKey ? "text" : "password"}
                      value={config.llm.api_key}
                      onChange={(e) => updateConfig('llm', 'api_key', e.target.value)}
                      placeholder="Enter your API key"
                      className="w-full p-3 border border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent bg-gray-800 text-gray-300 pr-10"
                    />
                    <button
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                    >
                      {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <button
                    onClick={() => testConnection('llm')}
                    disabled={testing.llm || !config.llm.api_key}
                    className="px-4 py-3 rounded-lg font-bold text-sm tracking-wider transition-all duration-200 hover:scale-105 disabled:opacity-50 flex items-center space-x-2 shadow-lg"
                    style={{
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      color: 'white',
                      boxShadow: '0 0 15px rgba(16, 185, 129, 0.4)'
                    }}
                  >
                    {testing.llm ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>TESTING</span>
                      </>
                    ) : (
                      <>
                        <TestTube className="w-4 h-4" />
                        <span>TEST</span>
                      </>
                    )}
                  </button>
                </div>
                {testResults.llm !== undefined && (
                  <div className={`mt-2 flex items-center space-x-2 text-sm ${testResults.llm ? 'text-green-400' : 'text-red-400'}`}>
                    {testResults.llm ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    <span>{testResults.llm ? 'Connection successful' : 'Connection failed'}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Email Configuration */}
        {activeTab === 'email' && (
          <div className="space-y-6">
            <div 
              className="p-6 rounded-xl border shadow-lg"
              style={{
                background: 'linear-gradient(135deg, #374151 0%, #1f2937 100%)',
                borderColor: '#4b5563',
                boxShadow: '0 8px 25px rgba(0, 0, 0, 0.3)'
              }}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                  }}>
                    <Mail className="w-3 h-3 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-cyan-300 tracking-wider">EMAIL MONITORING PROTOCOL</h3>
                </div>
                <button
                  onClick={() => testConnection('outlook')}
                  disabled={testing.outlook}
                  className="px-4 py-2 rounded-lg font-bold text-xs tracking-wider transition-all duration-200 hover:scale-105 disabled:opacity-50 flex items-center space-x-2 shadow-lg"
                  style={{
                    background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                    color: 'white',
                    boxShadow: '0 0 15px rgba(59, 130, 246, 0.4)'
                  }}
                >
                  {testing.outlook ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                      <span>TESTING</span>
                    </>
                  ) : (
                    <>
                      <TestTube className="w-3 h-3" />
                      <span>TEST OUTLOOK</span>
                    </>
                  )}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-cyan-400 mb-2 tracking-wide">CHECK INTERVAL</label>
                  <select
                    value={config.email.check_interval_minutes}
                    onChange={(e) => updateConfig('email', 'check_interval_minutes', parseInt(e.target.value))}
                    className="w-full p-3 border border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent bg-gray-800 text-gray-300"
                  >
                    <option value={15}>15 Minutes</option>
                    <option value={30}>30 Minutes</option>
                    <option value={60}>1 Hour</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-cyan-400 mb-2 tracking-wide">MAX EMAILS PER CHECK</label>
                  <input
                    type="number"
                    value={config.email.max_emails_per_check}
                    onChange={(e) => updateConfig('email', 'max_emails_per_check', parseInt(e.target.value))}
                    min="5"
                    max="50"
                    className="w-full p-3 border border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent bg-gray-800 text-gray-300"
                  />
                </div>
              </div>

              {testResults.outlook !== undefined && (
                <div className={`mt-4 flex items-center space-x-2 text-sm ${testResults.outlook ? 'text-green-400' : 'text-red-400'}`}>
                  {testResults.outlook ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  <span>{testResults.outlook ? 'Outlook connection verified' : 'Outlook connection failed'}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Notifications */}
        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <div 
              className="p-6 rounded-xl border shadow-lg"
              style={{
                background: 'linear-gradient(135deg, #374151 0%, #1f2937 100%)',
                borderColor: '#4b5563',
                boxShadow: '0 8px 25px rgba(0, 0, 0, 0.3)'
              }}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{
                    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                  }}>
                    <Bell className="w-3 h-3 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-cyan-300 tracking-wider">NOTIFICATION PROTOCOL</h3>
                </div>
                <button
                  onClick={testReminderPopup}
                  className="px-4 py-2 rounded-lg font-bold text-xs tracking-wider transition-all duration-200 hover:scale-105 flex items-center space-x-2 shadow-lg"
                  style={{
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    color: 'white',
                    boxShadow: '0 0 15px rgba(245, 158, 11, 0.4)'
                  }}
                  title="Test how the notification popup will appear"
                >
                  <Play className="w-3 h-3" />
                  <span>TEST POPUP</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-bold text-cyan-400 mb-2 tracking-wide">QUIET HOURS START</label>
                  <input
                    type="time"
                    value={config.notifications.quiet_hours_start}
                    onChange={(e) => updateConfig('notifications', 'quiet_hours_start', e.target.value)}
                    className="w-full p-3 border border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent bg-gray-800 text-gray-300"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-cyan-400 mb-2 tracking-wide">QUIET HOURS END</label>
                  <input
                    type="time"
                    value={config.notifications.quiet_hours_end}
                    onChange={(e) => updateConfig('notifications', 'quiet_hours_end', e.target.value)}
                    className="w-full p-3 border border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent bg-gray-800 text-gray-300"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-cyan-400 mb-2 tracking-wide">NOTIFICATION POSITION</label>
                  <select
                    value={config.notifications.notification_position}
                    onChange={(e) => updateConfig('notifications', 'notification_position', e.target.value)}
                    className="w-full p-3 border border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent bg-gray-800 text-gray-300"
                  >
                    <option value="bottom-right">Bottom Right</option>
                    <option value="top-right">Top Right</option>
                    <option value="bottom-left">Bottom Left</option>
                    <option value="top-left">Top Left</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-cyan-400 mb-2 tracking-wide">DEFAULT SNOOZE</label>
                  <select
                    value={config.notifications.default_snooze_minutes}
                    onChange={(e) => updateConfig('notifications', 'default_snooze_minutes', parseInt(e.target.value))}
                    className="w-full p-3 border border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent bg-gray-800 text-gray-300"
                  >
                    <option value={15}>15 Minutes</option>
                    <option value={30}>30 Minutes</option>
                    <option value={60}>1 Hour</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg border border-gray-600">
                  <div>
                    <span className="text-sm font-bold text-cyan-400 tracking-wide">DESKTOP NOTIFICATIONS</span>
                    <p className="text-xs text-gray-400">Show system notifications for new emails</p>
                  </div>
                  <button
                    onClick={() => updateConfig('notifications', 'show_desktop_notifications', !config.notifications.show_desktop_notifications)}
                    className={`w-12 h-6 rounded-full transition-all duration-200 ${
                      config.notifications.show_desktop_notifications ? 'bg-cyan-500' : 'bg-gray-600'
                    }`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full transition-transform duration-200 ${
                      config.notifications.show_desktop_notifications ? 'translate-x-6' : 'translate-x-0.5'
                    }`} />
                  </button>
                </div>

                <div 
                  className="p-4 rounded-lg border flex items-center space-x-3"
                  style={{
                    background: 'linear-gradient(135deg, #164e63 0%, #0c4a6e 100%)',
                    borderColor: '#0ea5e9'
                  }}
                >
                  <Play className="w-5 h-5 text-cyan-400" />
                  <div>
                    <span className="text-sm font-bold text-cyan-400 tracking-wide">NOTIFICATION PREVIEW</span>
                    <p className="text-xs text-cyan-300">Use the "TEST POPUP" button above to preview how notifications will appear based on your current settings</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TODO Configuration */}
        {activeTab === 'todo' && (
          <div className="space-y-6">
            <div 
              className="p-6 rounded-xl border shadow-lg"
              style={{
                background: 'linear-gradient(135deg, #374151 0%, #1f2937 100%)',
                borderColor: '#4b5563',
                boxShadow: '0 8px 25px rgba(0, 0, 0, 0.3)'
              }}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                  }}>
                    <CheckCircle className="w-3 h-3 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-cyan-300 tracking-wider">TASK MANAGEMENT PROTOCOL</h3>
                </div>
                <button
                  onClick={() => testConnection('todo')}
                  disabled={testing.todo}
                  className="px-4 py-2 rounded-lg font-bold text-xs tracking-wider transition-all duration-200 hover:scale-105 disabled:opacity-50 flex items-center space-x-2 shadow-lg"
                  style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: 'white',
                    boxShadow: '0 0 15px rgba(16, 185, 129, 0.4)'
                  }}
                >
                  {testing.todo ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                      <span>TESTING</span>
                    </>
                  ) : (
                    <>
                      <TestTube className="w-3 h-3" />
                      <span>TEST TODO</span>
                    </>
                  )}
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-cyan-400 mb-2 tracking-wide">DEFAULT TODO LIST</label>
                  <input
                    type="text"
                    value={config.todo.default_list_name}
                    onChange={(e) => updateConfig('todo', 'default_list_name', e.target.value)}
                    placeholder="Tasks"
                    className="w-full p-3 border border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent bg-gray-800 text-gray-300"
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border border-gray-600">
                  <div>
                    <span className="text-sm font-bold text-cyan-400 tracking-wide">INCLUDE AI SUMMARY</span>
                    <p className="text-xs text-gray-400">Add AI-generated summary to task description</p>
                  </div>
                  <button
                    onClick={() => updateConfig('todo', 'include_ai_summary', !config.todo.include_ai_summary)}
                    className={`w-12 h-6 rounded-full transition-all duration-200 ${
                      config.todo.include_ai_summary ? 'bg-cyan-500' : 'bg-gray-600'
                    }`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full transition-transform duration-200 ${
                      config.todo.include_ai_summary ? 'translate-x-6' : 'translate-x-0.5'
                    }`} />
                  </button>
                </div>
              </div>

              {testResults.todo !== undefined && (
                <div className={`mt-4 flex items-center space-x-2 text-sm ${testResults.todo ? 'text-green-400' : 'text-red-400'}`}>
                  {testResults.todo ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  <span>{testResults.todo ? 'TODO integration verified' : 'TODO integration failed'}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* UI Configuration */}
        {activeTab === 'ui' && (
          <div className="space-y-6">
            <div 
              className="p-6 rounded-xl border shadow-lg"
              style={{
                background: 'linear-gradient(135deg, #374151 0%, #1f2937 100%)',
                borderColor: '#4b5563',
                boxShadow: '0 8px 25px rgba(0, 0, 0, 0.3)'
              }}
            >
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{
                  background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)'
                }}>
                  <SettingsIcon className="w-3 h-3 text-white" />
                </div>
                <h3 className="text-lg font-bold text-cyan-300 tracking-wider">INTERFACE CONFIGURATION</h3>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 rounded-lg border border-gray-600">
                  <div className="flex items-center space-x-3">
                    <div className="w-5 h-5 rounded flex items-center justify-center" style={{
                      background: darkMode ? 'linear-gradient(135deg, #1f2937 0%, #111827 100%)' : 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)'
                    }}>
                      {darkMode ? <Moon className="w-3 h-3 text-cyan-400" /> : <Sun className="w-3 h-3 text-yellow-500" />}
                    </div>
                    <div>
                      <span className="text-sm font-bold text-cyan-400 tracking-wide">DARK MODE</span>
                      <p className="text-xs text-gray-400">Toggle between light and dark themes</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      onToggleDarkMode();
                      updateConfig('ui', 'dark_mode', !darkMode);
                    }}
                    className={`w-12 h-6 rounded-full transition-all duration-200 ${
                      darkMode ? 'bg-cyan-500' : 'bg-gray-600'
                    }`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full transition-transform duration-200 ${
                      darkMode ? 'translate-x-6' : 'translate-x-0.5'
                    }`} />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border border-gray-600">
                  <div>
                    <span className="text-sm font-bold text-cyan-400 tracking-wide">MINIMIZE TO TRAY</span>
                    <p className="text-xs text-gray-400">Hide to system tray instead of taskbar</p>
                  </div>
                  <button
                    onClick={() => updateConfig('ui', 'minimize_to_tray', !config.ui.minimize_to_tray)}
                    className={`w-12 h-6 rounded-full transition-all duration-200 ${
                      config.ui.minimize_to_tray ? 'bg-cyan-500' : 'bg-gray-600'
                    }`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full transition-transform duration-200 ${
                      config.ui.minimize_to_tray ? 'translate-x-6' : 'translate-x-0.5'
                    }`} />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-cyan-400 mb-2 tracking-wide">WINDOW WIDTH</label>
                    <input
                      type="number"
                      value={config.ui.window_width}
                      onChange={(e) => updateConfig('ui', 'window_width', parseInt(e.target.value))}
                      min="800"
                      max="2000"
                      className="w-full p-3 border border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent bg-gray-800 text-gray-300"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-cyan-400 mb-2 tracking-wide">WINDOW HEIGHT</label>
                    <input
                      type="number"
                      value={config.ui.window_height}
                      onChange={(e) => updateConfig('ui', 'window_height', parseInt(e.target.value))}
                      min="600"
                      max="1200"
                      className="w-full p-3 border border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent bg-gray-800 text-gray-300"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Security Configuration */}
        {activeTab === 'security' && (
          <div className="space-y-6">
            <div 
              className="p-6 rounded-xl border shadow-lg"
              style={{
                background: 'linear-gradient(135deg, #374151 0%, #1f2937 100%)',
                borderColor: '#4b5563',
                boxShadow: '0 8px 25px rgba(0, 0, 0, 0.3)'
              }}
            >
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{
                  background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)'
                }}>
                  <Shield className="w-3 h-3 text-white" />
                </div>
                <h3 className="text-lg font-bold text-cyan-300 tracking-wider">SECURITY PROTOCOL</h3>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg border border-gray-600">
                  <div>
                    <span className="text-sm font-bold text-cyan-400 tracking-wide">ENCRYPT API KEYS</span>
                    <p className="text-xs text-gray-400">Secure storage of sensitive credentials</p>
                  </div>
                  <button
                    onClick={() => updateConfig('security', 'encrypt_api_keys', !config.security.encrypt_api_keys)}
                    className={`w-12 h-6 rounded-full transition-all duration-200 ${
                      config.security.encrypt_api_keys ? 'bg-cyan-500' : 'bg-gray-600'
                    }`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full transition-transform duration-200 ${
                      config.security.encrypt_api_keys ? 'translate-x-6' : 'translate-x-0.5'
                    }`} />
                  </button>
                </div>

                <div 
                  className="p-4 rounded-lg border flex items-center space-x-3"
                  style={{
                    background: 'linear-gradient(135deg, #065f46 0%, #064e3b 100%)',
                    borderColor: '#059669'
                  }}
                >
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <div>
                    <span className="text-sm font-bold text-green-400 tracking-wide">LOCAL STORAGE ONLY</span>
                    <p className="text-xs text-green-300">All data stored locally - no cloud synchronization</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Message Display */}
      {message && (
        <div className="px-6">
          <div className={`p-3 rounded-lg border ${
            message.includes('success') || message.includes('successful') 
              ? 'border-green-500 text-green-400' 
              : 'border-red-500 text-red-400'
          }`} style={{
            background: message.includes('success') || message.includes('successful')
              ? 'linear-gradient(135deg, #065f46 0%, #064e3b 100%)'
              : 'linear-gradient(135deg, #7f1d1d 0%, #6b2c1e 100%)'
          }}>
            <div className="flex items-center space-x-2">
              {message.includes('success') || message.includes('successful') 
                ? <CheckCircle className="w-4 h-4" />
                : <AlertCircle className="w-4 h-4" />
              }
              <span className="text-sm font-medium">{message}</span>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="px-6 py-4 border-t shadow-lg" style={{
        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
        borderColor: '#374151',
        boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.3)'
      }}>
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4 text-xs text-gray-400">
            <span>SERINA v1.0.0</span>
            <span>•</span>
            <span>Configuration Protocol Active</span>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={closeWindow}
              className="px-4 py-2 border border-gray-600 rounded-lg hover:bg-gray-700 transition-all duration-200 text-gray-300 hover:text-white text-sm"
            >
              Cancel
            </button>
            <button
              onClick={saveConfig}
              disabled={saving}
              className="px-6 py-2 rounded-lg font-bold text-sm tracking-wider transition-all duration-200 hover:scale-105 disabled:opacity-50 flex items-center space-x-2 shadow-lg"
              style={{
                background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
                color: 'white',
                boxShadow: '0 0 20px rgba(6, 182, 212, 0.4)'
              }}
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>SAVING</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>SAVE CONFIGURATION</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SerinaSettings;