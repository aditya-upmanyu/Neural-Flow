// ErrorBoundary.jsx - Top-level error boundary for resilience
import React from 'react';
import { AlertTriangle, RefreshCw, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import { API_URL } from '../config';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  handleReconnect = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  handleCheckStatus = () => {
    window.open(`${API_URL}/api/health`, '_blank');
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0a0b0d] flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-2xl w-full"
          >
            {/* Error Card */}
            <div className="bg-gradient-to-br from-[#1a1b1e] to-[#12131 5] border border-red-500/30 rounded-2xl p-8 shadow-2xl">
              {/* Icon */}
              <div className="flex items-center justify-center mb-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-red-500/20 blur-xl rounded-full animate-pulse" />
                  <div className="relative bg-red-500/10 p-4 rounded-full border border-red-500/30">
                    <AlertTriangle className="w-12 h-12 text-red-500" />
                  </div>
                </div>
              </div>

              {/* Title */}
              <h1 className="text-3xl font-bold text-white text-center mb-3">
                Something Interrupted the Connection
              </h1>

              {/* Description */}
              <p className="text-gray-400 text-center mb-6 text-lg">
                The dashboard encountered an unexpected error. This can happen if the backend connection was lost or a component failed to render.
              </p>

              {/* Error Details (Collapsible) */}
              {this.state.error && (
                <details className="mb-6 bg-black/30 rounded-lg p-4 border border-gray-700/50">
                  <summary className="cursor-pointer text-gray-300 font-mono text-sm hover:text-white transition-colors">
                    Technical Details (Click to expand)
                  </summary>
                  <div className="mt-3 space-y-2">
                    <div className="text-red-400 font-mono text-xs">
                      {this.state.error.toString()}
                    </div>
                    {this.state.errorInfo && (
                      <pre className="text-gray-500 font-mono text-xs overflow-auto max-h-40 mt-2">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    )}
                  </div>
                </details>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={this.handleReconnect}
                  className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20"
                >
                  <RefreshCw className="w-5 h-5" />
                  Reconnect Dashboard
                </button>

                <button
                  onClick={this.handleCheckStatus}
                  className="flex-1 bg-[#1e1f23] hover:bg-[#2a2b2f] text-gray-300 hover:text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 border border-gray-700/50"
                >
                  <Activity className="w-5 h-5" />
                  Check Backend Status
                </button>
              </div>

              {/* Help Text */}
              <div className="mt-6 text-center text-sm text-gray-500">
                <p>
                  If the problem persists, ensure the backend is running and accessible.
                </p>
              </div>
            </div>

            {/* Additional Info Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-4 bg-[#1a1b1e]/50 border border-gray-800/50 rounded-lg p-4"
            >
              <div className="flex items-start gap-3">
                <div className="bg-blue-500/10 p-2 rounded-lg">
                  <Activity className="w-5 h-5 text-blue-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-semibold mb-1">Quick Troubleshooting</h3>
                  <ul className="text-gray-400 text-sm space-y-1">
                    <li>• Verify backend is running: <code className="text-cyan-400">npm start</code></li>
                    <li>• Check WebSocket connection is available</li>
                    <li>• Clear browser cache and refresh</li>
                    <li>• Check browser console for additional errors</li>
                  </ul>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
