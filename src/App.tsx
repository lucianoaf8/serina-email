import React, { useEffect, useState } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { invoke } from "@tauri-apps/api/tauri";
import EmailView from "./pages/EmailView";
import Settings from "./pages/Settings";
import ReminderPopup from "./pages/ReminderPopup";
import ErrorBoundary from "./components/ErrorBoundary";
import { NotificationProvider } from "./components/NotificationSystem";

function App() {
  const location = useLocation();
  const [darkMode, setDarkMode] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load user preferences on startup
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const response = await invoke('get_config');
      const config = JSON.parse(response as string);
      setDarkMode(config.ui?.dark_mode ?? true);
    } catch (error) {
      console.error('Failed to load config:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleDarkMode = async () => {
    try {
      const response = await invoke('get_config');
      const config = JSON.parse(response as string);
      config.ui = { ...config.ui, dark_mode: !darkMode };
      
      await invoke('save_config', { config });
      setDarkMode(!darkMode);
    } catch (error) {
      console.error('Failed to toggle dark mode:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading SERINA...</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <NotificationProvider>
        <div className={darkMode ? 'dark' : ''}>
          <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
            <ErrorBoundary>
              <Routes>
                <Route 
                  path="/" 
                  element={
                    <ErrorBoundary>
                      <EmailView 
                        darkMode={darkMode} 
                        onToggleDarkMode={toggleDarkMode} 
                      />
                    </ErrorBoundary>
                  } 
                />
                <Route 
                  path="/settings" 
                  element={
                    <ErrorBoundary>
                      <Settings 
                        darkMode={darkMode} 
                        onToggleDarkMode={toggleDarkMode} 
                      />
                    </ErrorBoundary>
                  } 
                />
                <Route 
                  path="/reminder" 
                  element={
                    <ErrorBoundary>
                      <ReminderPopup />
                    </ErrorBoundary>
                  } 
                />
              </Routes>
            </ErrorBoundary>
          </div>
        </div>
      </NotificationProvider>
    </ErrorBoundary>
  );
}

export default App;
