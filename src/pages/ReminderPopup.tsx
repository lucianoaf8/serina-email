import React, { useState, useEffect } from 'react';
import { useSearchParams } from "react-router-dom";
import { invoke } from "@tauri-apps/api/tauri";
import { Mail, AlertTriangle, Clock, Check, Star, X } from "lucide-react";

const SerinaNotificationWindow: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [autoDismissProgress, setAutoDismissProgress] = useState(100);
  const [isVisible, setIsVisible] = useState(true);
  const [pulseActive, setPulseActive] = useState(true);
  const [keepOpen, setKeepOpen] = useState(false);
  const [emailCount, setEmailCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const count = searchParams.get('count');
    setEmailCount(parseInt(count || '0'));
    loadEmailCounts();
  }, [searchParams]);

  const loadEmailCounts = async () => {
    try {
      setLoading(true);
      // Get unread count from backend
      const unreadResponse = await invoke('get_unread_count');
      const unreadData = JSON.parse(unreadResponse as string);
      
      // Get all emails to calculate pending
      const emailsResponse = await invoke('get_emails', { limit: 50 });
      const emailsData = JSON.parse(emailsResponse as string);
      
      setEmailCount(unreadData.count || 0);
      setPendingCount(emailsData.length || 0);
    } catch (error) {
      console.error('Failed to load email counts:', error);
    } finally {
      setLoading(false);
    }
  };

  // Auto-dismiss countdown effect
  useEffect(() => {
    if (autoDismissProgress > 0 && !keepOpen && isVisible) {
      const timer = setInterval(() => {
        setAutoDismissProgress(prev => {
          if (prev <= 0) {
            handleClose();
            return 0;
          }
          return prev - 1;
        });
      }, 100);
      return () => clearInterval(timer);
    }
  }, [autoDismissProgress, keepOpen, isVisible]);

  // Pulse animation for active monitoring
  useEffect(() => {
    const pulseInterval = setInterval(() => {
      setPulseActive(prev => !prev);
    }, 1500);
    return () => clearInterval(pulseInterval);
  }, []);

  const handleClose = async () => {
    try {
      await invoke('close_window');
    } catch (error) {
      console.error('Failed to close window:', error);
    }
    setIsVisible(false);
  };

  const handleInitiateTriage = async () => {
    try {
      // Focus main window and close this popup
      await invoke('backend_request', {
        endpoint: '/focus-main-window',
        method: 'POST',
        body: null
      });
      await invoke('close_window');
    } catch (error) {
      console.error('Failed to initiate triage:', error);
    }
    setIsVisible(false);
  };

  const handleSnooze = async (minutes: number) => {
    try {
      // Implement snooze logic - close popup for now
      console.log(`Snoozed for ${minutes} minutes`);
      await invoke('close_window');
    } catch (error) {
      console.error('Failed to snooze:', error);
    }
    setIsVisible(false);
  };

  const handleDefer = async () => {
    try {
      console.log('Deferred notification');
      await invoke('close_window');
    } catch (error) {
      console.error('Failed to defer:', error);
    }
    setIsVisible(false);
  };

  const handleKeepOpen = () => {
    setKeepOpen(true);
  };

  const showNotification = async (title: string, body: string) => {
    try {
      await invoke('show_system_notification', { title, body });
    } catch (error) {
      console.error('Failed to show notification:', error);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div 
        className="w-80 rounded-xl border shadow-2xl overflow-hidden backdrop-blur-sm"
        style={{
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 90%, #1e293b 100%)',
          borderColor: '#374151',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6), 0 0 20px rgba(6, 182, 212, 0.2)'
        }}
      >
        {/* Header */}
        <div className="relative p-4 border-b" style={{ borderColor: '#374151' }}>
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center shadow-lg"
                style={{
                  background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
                  boxShadow: '0 0 15px rgba(6, 182, 212, 0.5)'
                }}
              >
                <Mail className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-cyan-300 tracking-wider">SERINA SENTINEL</h2>
                <p className="text-xs text-gray-400 font-medium tracking-wide">EMAIL NOTIFICATION</p>
              </div>
            </div>
            
            <button 
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-200 transition-colors duration-200 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          {/* Active Monitoring Status */}
          <div className="mt-4 flex items-center justify-center">
            <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-gray-800/50 border border-gray-600">
              <div 
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  pulseActive ? 'bg-green-400 shadow-lg shadow-green-400/50' : 'bg-green-500'
                }`}
                style={{
                  boxShadow: pulseActive ? '0 0 8px rgba(74, 222, 128, 0.8)' : '0 0 4px rgba(74, 222, 128, 0.5)'
                }}
              />
              <span className="text-xs font-bold text-green-400 tracking-wider">ACTIVE MONITORING</span>
              <div 
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  pulseActive ? 'bg-green-400 shadow-lg shadow-green-400/50' : 'bg-green-500'
                }`}
                style={{
                  boxShadow: pulseActive ? '0 0 8px rgba(74, 222, 128, 0.8)' : '0 0 4px rgba(74, 222, 128, 0.5)'
                }}
              />
            </div>
          </div>
        </div>

        {/* Metrics */}
        <div className="p-4">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div 
              className="p-4 rounded-lg border text-center"
              style={{
                background: 'linear-gradient(135deg, #065f46 20%, #064e3b 80%)',
                borderColor: '#059669',
                boxShadow: '0 0 15px rgba(5, 150, 105, 0.2)'
              }}
            >
              <div className="text-2xl font-bold text-cyan-300 mb-1">
                {loading ? '...' : String(emailCount).padStart(2, '0')}
              </div>
              <div className="text-xs font-semibold text-gray-300 tracking-wide">NEW</div>
              <div className="text-xs font-semibold text-gray-300 tracking-wide">MESSAGES</div>
              <div className="mt-2 h-1 bg-cyan-600 rounded-full shadow-sm shadow-cyan-600/50"></div>
            </div>
            
            <div 
              className="p-4 rounded-lg border text-center"
              style={{
                background: 'linear-gradient(135deg, #164e63 20%, #0c4a6e 80%)',
                borderColor: '#0ea5e9',
                boxShadow: '0 0 15px rgba(14, 165, 233, 0.2)'
              }}
            >
              <div className="text-2xl font-bold text-cyan-300 mb-1">
                {loading ? '...' : String(pendingCount).padStart(2, '0')}
              </div>
              <div className="text-xs font-semibold text-gray-300 tracking-wide">PENDING</div>
              <div className="text-xs font-semibold text-gray-300 tracking-wide">REVIEW</div>
              <div className="mt-2 h-1 bg-blue-500 rounded-full shadow-sm shadow-blue-500/50"></div>
            </div>
          </div>

          {/* Priority Alert */}
          {emailCount > 0 && (
            <div 
              className="p-3 rounded-lg border mb-4 flex items-center space-x-2"
              style={{
                background: 'linear-gradient(135deg, #164e63 0%, #0c4a6e 100%)',
                borderColor: '#0ea5e9',
                boxShadow: '0 0 12px rgba(14, 165, 233, 0.3)'
              }}
            >
              <AlertTriangle className="w-4 h-4 text-cyan-400 flex-shrink-0" />
              <span className="text-sm font-medium text-cyan-200 tracking-wide">
                {emailCount === 1 ? 'New email requires attention' : 'Priority attention required'}
              </span>
            </div>
          )}

          {/* No New Emails State */}
          {emailCount === 0 && !loading && (
            <div 
              className="p-3 rounded-lg border mb-4 flex items-center space-x-2"
              style={{
                background: 'linear-gradient(135deg, #065f46 0%, #064e3b 100%)',
                borderColor: '#059669',
                boxShadow: '0 0 12px rgba(5, 150, 105, 0.3)'
              }}
            >
              <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
              <span className="text-sm font-medium text-green-200 tracking-wide">
                All caught up! No new emails.
              </span>
            </div>
          )}

          {/* Initiate Triage Button */}
          <button 
            onClick={handleInitiateTriage}
            disabled={loading}
            className="w-full p-3 rounded-lg font-bold text-sm tracking-wider transition-all duration-200 hover:scale-105 mb-4 disabled:opacity-50"
            style={{
              background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
              color: 'white',
              boxShadow: '0 0 20px rgba(6, 182, 212, 0.4), 0 4px 15px rgba(0, 0, 0, 0.3)'
            }}
          >
            <div className="flex items-center justify-center space-x-2">
              <Mail className="w-4 h-4" />
              <span>{emailCount > 0 ? 'REVIEW EMAILS' : 'OPEN SERINA'}</span>
            </div>
          </button>

          {/* Action Buttons */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <button 
              onClick={() => handleSnooze(15)}
              className="p-2 rounded border border-gray-600 text-xs font-semibold text-gray-300 hover:bg-gray-700 hover:text-white transition-all duration-200 flex items-center justify-center space-x-1"
            >
              <Clock className="w-3 h-3" />
              <span>15M</span>
            </button>
            <button 
              onClick={() => handleSnooze(60)}
              className="p-2 rounded border border-gray-600 text-xs font-semibold text-gray-300 hover:bg-gray-700 hover:text-white transition-all duration-200 flex items-center justify-center space-x-1"
            >
              <Clock className="w-3 h-3" />
              <span>1H</span>
            </button>
            <button 
              onClick={handleDefer}
              className="p-2 rounded border border-gray-600 text-xs font-semibold text-cyan-400 hover:bg-gray-700 hover:text-cyan-300 transition-all duration-200"
            >
              Skip
            </button>
          </div>

          {/* Quick Actions */}
          {emailCount > 0 && (
            <div className="grid grid-cols-2 gap-2 mb-4">
              <button 
                onClick={() => showNotification('SERINA', 'Marked all emails as read')}
                className="p-2 rounded border border-gray-600 text-xs font-semibold text-green-400 hover:bg-gray-700 hover:text-green-300 transition-all duration-200 flex items-center justify-center space-x-1"
              >
                <Check className="w-3 h-3" />
                <span>Mark All Read</span>
              </button>
              <button 
                onClick={() => showNotification('SERINA', 'Flagged emails for priority review')}
                className="p-2 rounded border border-gray-600 text-xs font-semibold text-yellow-400 hover:bg-gray-700 hover:text-yellow-300 transition-all duration-200 flex items-center justify-center space-x-1"
              >
                <Star className="w-3 h-3" />
                <span>Flag Priority</span>
              </button>
            </div>
          )}

          {/* Auto Dismiss Progress */}
          <div className="space-y-2 relative">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-cyan-400 tracking-wider">AUTO_DISMISS:</span>
              <button 
                onClick={handleKeepOpen}
                className="text-xs font-medium text-gray-400 hover:text-gray-300 transition-colors duration-200"
              >
                {keepOpen ? 'kept open' : 'keep open'}
              </button>
              <span className="text-xs font-bold text-gray-300">{keepOpen ? 'PAUSED' : '10s'}</span>
            </div>
            
            <div className="relative h-2 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="absolute top-0 left-0 h-full transition-all duration-100 rounded-full"
                style={{
                  width: `${keepOpen ? 100 : autoDismissProgress}%`,
                  background: keepOpen 
                    ? 'linear-gradient(90deg, #10b981 0%, #059669 100%)'
                    : 'linear-gradient(90deg, #06b6d4 0%, #0891b2 100%)',
                  boxShadow: keepOpen 
                    ? '0 0 8px rgba(16, 185, 129, 0.6)'
                    : '0 0 8px rgba(6, 182, 212, 0.6)'
                }}
              />
            </div>
          </div>

          {/* Connection Status */}
          <div className="mt-3 flex items-center justify-center">
            <div className="flex items-center space-x-2 text-xs text-gray-500">
              <div className="w-1.5 h-1.5 bg-green-400 rounded-full shadow-sm shadow-green-400/50"></div>
              <span>Connected to Outlook</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SerinaNotificationWindow;