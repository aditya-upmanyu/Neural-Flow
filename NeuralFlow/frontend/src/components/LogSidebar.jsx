import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, AlertTriangle, ShieldCheck, Cpu, Sliders } from 'lucide-react';

const EVENT_STYLES = {
  ALERT: {
    bg: 'bg-red-950/45 border-red-500/30',
    textColor: 'text-red-400',
    glowClass: 'text-glow-red',
    icon: <AlertTriangle className="w-4 h-4 text-red-500 animate-pulse" />,
    badge: 'ALERT'
  },
  REROUTE: {
    bg: 'bg-orange-950/45 border-orange-500/30',
    textColor: 'text-orange-400',
    glowClass: 'text-glow-orange',
    icon: <Cpu className="w-4 h-4 text-orange-500 animate-spin" style={{ animationDuration: '6s' }} />,
    badge: 'REROUTE'
  },
  RECOVERY: {
    bg: 'bg-emerald-950/45 border-emerald-500/30',
    textColor: 'text-emerald-400',
    glowClass: 'text-glow-green',
    icon: <ShieldCheck className="w-4 h-4 text-emerald-500" />,
    badge: 'HEALED'
  },
  MANUAL: {
    bg: 'bg-purple-950/45 border-purple-500/30',
    textColor: 'text-purple-400',
    glowClass: 'text-glow-purple',
    icon: <Sliders className="w-4 h-4 text-purple-400" />,
    badge: 'MANUAL'
  }
};

export default function LogSidebar({ events }) {
  // Determine global agent status based on logs
  const isRerouting = events.some(e => e.type === 'REROUTE' && (Date.now() - new Date(e.timestamp).getTime() < 3000));
  
  return (
    <div className="w-80 h-full flex flex-col glass-panel border-l border-white/5 z-10 select-none">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-white/5">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 font-orbitron text-sm text-glow-blue text-cyan-400 font-bold">
            <Terminal className="w-4 h-4" />
            Decision Engine
          </div>
          <span className="flex h-2 w-2 relative">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isRerouting ? 'bg-orange-400' : 'bg-cyan-400'}`}></span>
            <span className={`relative inline-flex rounded-full h-2 w-2 ${isRerouting ? 'bg-orange-500' : 'bg-cyan-500'}`}></span>
          </span>
        </div>
        
        {/* Agent Operational Status */}
        <div className="bg-slate-950/80 p-2.5 rounded border border-white/5 font-mono text-[10px] text-slate-400">
          <div className="flex justify-between mb-1">
            <span>AGENT STATE:</span>
            <span className={`font-bold ${isRerouting ? 'text-orange-400 text-glow-orange' : 'text-emerald-400 text-glow-green'}`}>
              {isRerouting ? 'RECONFIGURING_MESH' : 'MONITORING_TELEMETRY'}
            </span>
          </div>
          <div className="flex justify-between">
            <span>DECISION LOOP:</span>
            <span className="text-cyan-400">CLOSED_LOOP_ACTIVE</span>
          </div>
        </div>
      </div>

      {/* Logs Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 font-mono text-xs">
        <AnimatePresence initial={false}>
          {events.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              className="text-center py-8 text-slate-500"
            >
              Awaiting telemetry triggers...
            </motion.div>
          ) : (
            events.map((event) => {
              const style = EVENT_STYLES[event.type] || {
                bg: 'bg-slate-900/60 border-white/5',
                textColor: 'text-slate-300',
                glowClass: '',
                icon: <Terminal className="w-4 h-4 text-slate-400" />,
                badge: 'INFO'
              };

              const timeStr = new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

              return (
                <motion.div
                  key={event.id}
                  layout
                  initial={{ opacity: 0, x: 20, y: -10 }}
                  animate={{ opacity: 1, x: 0, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  className={`p-3 rounded border ${style.bg} flex flex-col gap-1 transition-all duration-300`}
                >
                  <div className="flex items-center justify-between border-b border-white/5 pb-1 mb-1">
                    <div className="flex items-center gap-1.5 font-bold">
                      {style.icon}
                      <span className={`${style.textColor} ${style.glowClass} font-orbitron text-[10px] tracking-wider`}>
                        {style.badge}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500">{timeStr}</span>
                  </div>

                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    {event.message}
                  </p>

                  <div className="flex gap-2 items-center text-[9px] text-slate-500 pt-1 border-t border-white/5 mt-1">
                    <span>Node: <strong className="text-slate-400 font-normal">{event.nodeName}</strong></span>
                    {event.details && event.details.latency && (
                      <span>Latency: <strong className="text-slate-400 font-normal">{event.details.latency}ms</strong></span>
                    )}
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
