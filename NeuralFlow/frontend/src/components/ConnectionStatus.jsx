// ConnectionStatus.jsx - Persistent WebSocket connection indicator
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import clsx from 'clsx';
import { API_URL } from '../config';

const ConnectionStatus = ({ wsConnected, wsReconnecting }) => {
  const [showDetails, setShowDetails] = useState(false);
  const [lastDisconnect, setLastDisconnect] = useState(null);

  useEffect(() => {
    if (!wsConnected && !wsReconnecting) {
      setLastDisconnect(new Date());
    }
  }, [wsConnected, wsReconnecting]);

  const getStatus = () => {
    if (wsConnected) return { label: 'Connected', color: 'green', Icon: Wifi };
    if (wsReconnecting) return { label: 'Reconnecting', color: 'yellow', Icon: RefreshCw };
    return { label: 'Disconnected', color: 'red', Icon: WifiOff };
  };

  const { label, color, Icon } = getStatus();

  const colorClasses = {
    green: {
      bg: 'bg-green-500/10',
      border: 'border-green-500/30',
      text: 'text-green-400',
      glow: 'shadow-green-500/20',
      pulse: 'bg-green-500'
    },
    yellow: {
      bg: 'bg-yellow-500/10',
      border: 'border-yellow-500/30',
      text: 'text-yellow-400',
      glow: 'shadow-yellow-500/20',
      pulse: 'bg-yellow-500'
    },
    red: {
      bg: 'bg-red-500/10',
      border: 'border-red-500/30',
      text: 'text-red-400',
      glow: 'shadow-red-500/20',
      pulse: 'bg-red-500'
    }
  };

  const classes = colorClasses[color];

  return (
    <div className="relative">
      <motion.button
        onClick={() => setShowDetails(!showDetails)}
        className={clsx(
          'flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all duration-200',
          classes.bg,
          classes.border,
          classes.text,
          'hover:brightness-110 shadow-lg',
          classes.glow
        )}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {/* Status Pulse */}
        <div className="relative">
          <div className={clsx('w-2 h-2 rounded-full', classes.pulse)} />
          {wsConnected && (
            <div className={clsx(
              'absolute inset-0 rounded-full animate-ping',
              classes.pulse,
              'opacity-75'
            )} />
          )}
        </div>

        {/* Icon */}
        {wsReconnecting ? (
          <RefreshCw className="w-4 h-4 animate-spin" />
        ) : (
          <Icon className="w-4 h-4" />
        )}

        {/* Label */}
        <span className="text-sm font-medium hidden sm:inline">
          {label}
        </span>
      </motion.button>

      {/* Detailed Tooltip */}
      <AnimatePresence>
        {showDetails && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute right-0 top-full mt-2 w-72 bg-[#1a1b1e] border border-gray-800 rounded-lg shadow-2xl p-4 z-50"
          >
            {/* Header */}
            <div className="flex items-center gap-2 mb-3">
              <Icon className={clsx('w-5 h-5', classes.text)} />
              <h3 className="text-white font-semibold">WebSocket Status</h3>
            </div>

            {/* Status Details */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Connection:</span>
                <span className={clsx('font-medium', classes.text)}>
                  {label}
                </span>
              </div>

              {wsConnected && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Protocol:</span>
                    <span className="text-gray-300 font-mono">WSS</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Endpoint:</span>
                    <span className="text-gray-300 font-mono text-xs">
                      {API_URL.replace(/^https?:\/\//, '').replace(/^wss?:\/\//, '')}
                    </span>
                  </div>
                </>
              )}

              {!wsConnected && lastDisconnect && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Last disconnect:</span>
                  <span className="text-gray-300 text-xs">
                    {lastDisconnect.toLocaleTimeString()}
                  </span>
                </div>
              )}

              {wsReconnecting && (
                <div className="flex items-center gap-2 text-yellow-400 mt-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Attempting to reconnect...</span>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="mt-3 pt-3 border-t border-gray-800">
              <p className="text-xs text-gray-500">
                {wsConnected
                  ? 'Real-time updates active. All dashboard data is live.'
                  : 'Dashboard updates paused. Data may be stale until reconnection.'}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ConnectionStatus;
