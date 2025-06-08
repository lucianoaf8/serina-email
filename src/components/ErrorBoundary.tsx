import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({ error, errorInfo });

    // Log error for debugging (Tauri-compatible)
    if (typeof window !== 'undefined' && (window as any).__TAURI__) {
      try {
        // In Tauri context, we could send this to backend for logging
        console.error('Tauri Error:', { error: error.message, stack: error.stack, errorInfo });
      } catch (e) {
        // Fallback to console if Tauri API fails
        console.error('Failed to log error to Tauri backend:', e);
      }
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center" style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)'
        }}>
          <div className="max-w-md w-full mx-4">
            <div 
              className="p-8 rounded-xl border shadow-2xl text-center"
              style={{
                background: 'linear-gradient(135deg, #374151 0%, #1f2937 100%)',
                borderColor: '#4b5563',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)'
              }}
            >
              <div className="w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center" style={{
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                boxShadow: '0 0 20px rgba(239, 68, 68, 0.4)'
              }}>
                <AlertTriangle className="w-8 h-8 text-white" />
              </div>

              <h1 className="text-xl font-bold text-red-400 mb-2 tracking-wider">
                SYSTEM ERROR
              </h1>
              
              <p className="text-gray-300 mb-6 text-sm">
                SERINA encountered an unexpected error and needs to restart.
              </p>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="mb-6 p-4 bg-gray-800 rounded-lg border border-gray-600 text-left">
                  <p className="text-xs font-mono text-red-400 mb-2">
                    {this.state.error.message}
                  </p>
                  {this.state.error.stack && (
                    <details className="text-xs text-gray-400">
                      <summary className="cursor-pointer hover:text-gray-300">Stack Trace</summary>
                      <pre className="mt-2 whitespace-pre-wrap text-xs">
                        {this.state.error.stack}
                      </pre>
                    </details>
                  )}
                </div>
              )}

              <div className="space-y-3">
                <button
                  onClick={this.handleReset}
                  className="w-full p-3 rounded-lg font-bold text-sm tracking-wider transition-all duration-200 hover:scale-105 shadow-lg flex items-center justify-center space-x-2"
                  style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: 'white',
                    boxShadow: '0 0 15px rgba(16, 185, 129, 0.4)'
                  }}
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>TRY AGAIN</span>
                </button>

                <button
                  onClick={this.handleReload}
                  className="w-full p-3 rounded-lg font-bold text-sm tracking-wider transition-all duration-200 hover:scale-105 shadow-lg flex items-center justify-center space-x-2"
                  style={{
                    background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                    color: 'white',
                    boxShadow: '0 0 15px rgba(59, 130, 246, 0.4)'
                  }}
                >
                  <Home className="w-4 h-4" />
                  <span>RESTART APPLICATION</span>
                </button>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-600">
                <p className="text-xs text-gray-500">
                  SERINA v1.0.0 • Error Recovery Protocol
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;