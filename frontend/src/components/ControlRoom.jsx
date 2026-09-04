import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Activity, Server, Zap, ShieldAlert, Cpu, Network, RefreshCw,
  Volume2, VolumeX, Eye, EyeOff, Play, Pause, TrendingUp
} from 'lucide-react';
import NetworkMesh from './NetworkMesh';

export default function ControlRoom({ 
  nodes, events, latencyHistory, 
  voiceEnabled, setVoiceEnabled,
  chaosActive, setChaosActive,
  autoPilot, setAutoPilot,
  onInjectSpike, onForceReroute 
}) {
  const [selectedNodeId, setSelectedNodeId] = useState(null);

  // Compute live averages and stats
  const stats = useMemo(() => {
    if (!nodes.length) return { avgLatency: 0, avgLoad: 0, reconfigCount: 0 };
    const totalLatency = nodes.reduce((sum, n) => sum + n.latency, 0);
    const totalLoad = nodes.reduce((sum, n) => sum + n.load, 0);
    const reconfigCount = events.filter(e => e.type === 'REROUTE').length;
    const degradedCount = nodes.filter(n => n.status === 'DEGRADED').length;

    return {
      avgLatency: Math.round(totalLatency / nodes.length),
      avgLoad: Math.round(totalLoad / nodes.length),
      reconfigCount,
      degradedCount
    };
  }, [nodes, events]);

  const selectedNode = useMemo(() => {
    return nodes.find(n => n.id === selectedNodeId);
  }, [nodes, selectedNodeId]);

  // Live SVG chart geometry
  const chartPath = useMemo(() => {
    if (!latencyHistory || latencyHistory.length < 2) return '';
    const width = 280;
    const height = 50;
    const minVal = 35;
    const maxVal = 260; // Max normal scale cap
    
    const points = latencyHistory.map((val, idx) => {
      const x = (idx / (latencyHistory.length - 1)) * width;
      // map value dynamically between min and max bounds
      const ratio = (val - minVal) / (maxVal - minVal);
      const clampedRatio = Math.max(0, Math.min(1, ratio));
      const y = height - clampedRatio * height;
      return `${x},${Math.max(2, Math.min(height - 2, y))}`;
    });
    
    return {
      line: `M ${points.join(' L ')}`,
      area: `M ${points.join(' L ')} L ${width},${height} L 0,${height} Z`
    };
  }, [latencyHistory]);

  return (
    <div className="flex-1 flex flex-col h-full w-full relative overflow-hidden select-none bg-dark-bg scanlines">
      
      {/* 1. Header Bar */}
      <header className="h-16 w-full glass-panel border-b border-white/5 flex items-center justify-between px-6 z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-950/50 border border-cyan-500/30 rounded-lg text-cyan-400 text-glow-blue">
            <Network className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h1 className="font-orbitron font-extrabold text-sm tracking-wider text-white m-0 flex items-center gap-2">
              NEURALFLOW <span className="text-cyan-400">//</span> ORCHESTRATOR
            </h1>
            <p className="font-mono text-[9px] text-slate-500 tracking-widest uppercase">
              Autonomous Infrastructure Agent
            </p>
          </div>
        </div>

        {/* Dynamic Hackathon control options */}
        <div className="flex items-center gap-3">
          
          {/* Toggle Voice Assist */}
          <button
            onClick={() => setVoiceEnabled(!voiceEnabled)}
            className={`p-2 rounded border cursor-pointer transition-all duration-300 flex items-center gap-1.5 font-mono text-[10px] font-bold
              ${voiceEnabled 
                ? 'bg-emerald-950/45 border-emerald-500/50 text-emerald-400 text-glow-green shadow-[0_0_8px_rgba(16,185,129,0.15)]' 
                : 'bg-slate-950/60 border-white/5 text-slate-500 hover:text-slate-300 hover:border-white/10'}`}
            title="Toggle Voice Telemetry Alerts"
          >
            {voiceEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">VOICE ASSIST</span>
          </button>

          {/* Toggle Cinematic autopilot camera */}
          <button
            onClick={() => setAutoPilot(!autoPilot)}
            className={`p-2 rounded border cursor-pointer transition-all duration-300 flex items-center gap-1.5 font-mono text-[10px] font-bold
              ${autoPilot 
                ? 'bg-cyan-950/45 border-cyan-500/50 text-cyan-400 text-glow-blue shadow-[0_0_8px_rgba(6,182,212,0.15)]' 
                : 'bg-slate-950/60 border-white/5 text-slate-500 hover:text-slate-300 hover:border-white/10'}`}
            title="Toggle Cinematic Sweep Mode"
          >
            {autoPilot ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">CINEMATIC RIG</span>
          </button>

          <div className="w-px h-6 bg-white/5 hidden md:block" />

          {/* Global Telemetry Stats */}
          <div className="hidden lg:flex gap-6 font-mono text-xs">
            <div className="flex flex-col items-end">
              <span className="text-[9px] text-slate-500">AVG LATENCY</span>
              <span className={`font-bold font-orbitron transition-colors duration-300 ${stats.avgLatency > 120 ? 'text-red-400 text-glow-red animate-pulse' : 'text-cyan-400 text-glow-blue'}`}>
                {stats.avgLatency} ms
              </span>
            </div>
            <div className="w-px h-8 bg-white/5" />
            <div className="flex flex-col items-end">
              <span className="text-[9px] text-slate-500">AVG CPU LOAD</span>
              <span className="font-bold font-orbitron text-cyan-400 text-glow-blue">
                {stats.avgLoad}%
              </span>
            </div>
            <div className="w-px h-8 bg-white/5" />
            <div className="flex flex-col items-end">
              <span className="text-[9px] text-slate-500">ORCHESTRATIONS</span>
              <span className="font-bold font-orbitron text-purple-400 text-glow-purple">
                {stats.reconfigCount}
              </span>
            </div>
            <div className="w-px h-8 bg-white/5" />
            <div className="flex flex-col items-end">
              <span className="text-[9px] text-slate-500">MESH STATE</span>
              <span className={`font-bold font-orbitron flex items-center gap-1.5 ${stats.degradedCount > 0 ? 'text-red-400 text-glow-red animate-pulse' : 'text-emerald-400 text-glow-green'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${stats.degradedCount > 0 ? 'bg-red-500' : 'bg-emerald-500'}`} />
                {stats.degradedCount > 0 ? 'ANOMALY' : 'OPTIMAL'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* 2. Main Work Area (Left Telemetry Panel + 3D Mesh Canvas + Sidebar) */}
      <div className="flex-1 flex overflow-hidden w-full relative">
        
        {/* Left Telemetry Panel */}
        <aside className="w-80 h-full glass-panel border-r border-white/5 flex flex-col z-10 p-4 space-y-3.5 overflow-y-auto">
          
          {/* Section: Telemetry Overview */}
          <div>
            <h2 className="font-orbitron font-bold text-xs tracking-wider text-slate-400 flex items-center gap-1.5 mb-2">
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              Node Telemetry
            </h2>
            
            <div className="space-y-2">
              {nodes.map(node => {
                const isDegraded = node.status === 'DEGRADED';
                const isReconfig = node.status === 'RECONFIGURING';
                const colorClass = isDegraded ? 'text-red-400 border-red-500/20' : isReconfig ? 'text-orange-400 border-orange-500/20' : 'text-emerald-400 border-emerald-500/10';
                
                return (
                  <div 
                    key={node.id} 
                    onClick={() => setSelectedNodeId(node.id)}
                    className={`p-2 rounded border bg-slate-950/60 cursor-pointer hover:border-cyan-500/30 transition-all duration-300
                      ${selectedNodeId === node.id ? 'border-cyan-500 bg-cyan-950/10' : 'border-white/5'}`}
                  >
                    <div className="flex items-center justify-between font-mono text-[11px] mb-1">
                      <span className="font-bold text-slate-200">{node.name}</span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-sm bg-slate-900 border ${colorClass}`}>
                        {node.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[9px] font-mono text-slate-400">
                      <div>Latency: <span className={isDegraded ? 'text-red-400 font-bold' : isReconfig ? 'text-orange-400' : 'text-slate-200'}>{node.latency}ms</span></div>
                      <div>Load: <span className="text-slate-200">{node.load}%</span></div>
                    </div>

                    {/* Progress Bar for CPU load */}
                    <div className="w-full bg-slate-900 h-1 rounded-full overflow-hidden mt-1.5 border border-white/5">
                      <div 
                        className={`h-full transition-all duration-500 ${isDegraded ? 'bg-red-500' : isReconfig ? 'bg-orange-500' : 'bg-emerald-500'}`}
                        style={{ width: `${node.load}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section: Live Latency Chart */}
          <div className="bg-slate-950/60 p-2.5 rounded border border-white/5">
            <h3 className="font-orbitron font-bold text-[10px] tracking-wider text-slate-400 flex items-center gap-1.5 mb-2">
              <TrendingUp className="w-3 h-3 text-cyan-400" />
              Live Mesh Latency Trend
            </h3>
            {chartPath ? (
              <div className="w-full flex justify-center py-1">
                <svg width="280" height="50" className="overflow-visible">
                  <defs>
                    <linearGradient id="chartGlow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#00f0ff" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#00f0ff" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  
                  {/* Grid Lines */}
                  <line x1="0" y1="12" x2="280" y2="12" stroke="rgba(255,255,255,0.02)" strokeWidth="1" />
                  <line x1="0" y1="25" x2="280" y2="25" stroke="rgba(255,255,255,0.02)" strokeWidth="1" />
                  <line x1="0" y1="37" x2="280" y2="37" stroke="rgba(255,255,255,0.02)" strokeWidth="1" />

                  {/* Shaded Area */}
                  <path d={chartPath.area} fill="url(#chartGlow)" />
                  
                  {/* Glowing Line */}
                  <path 
                    d={chartPath.line} 
                    fill="none" 
                    stroke="#00f0ff" 
                    strokeWidth="1.8" 
                    className="drop-shadow-[0_0_3px_rgba(0,240,255,0.4)]"
                  />
                </svg>
              </div>
            ) : (
              <div className="h-[50px] flex items-center justify-center font-mono text-[9px] text-slate-500">
                Awaiting telemetry ticks...
              </div>
            )}
            <div className="flex justify-between font-mono text-[8px] text-slate-500 mt-1">
              <span>-30s</span>
              <span>LIVE WAVEFORM</span>
              <span>NOW</span>
            </div>
          </div>

          {/* Section: Developer Chaos Module */}
          <div className="border-t border-white/5 pt-3">
            <div className="flex items-center justify-between mb-1.5">
              <h2 className="font-orbitron font-bold text-xs tracking-wider text-slate-400 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-cyan-400" />
                Chaos Module
              </h2>
              {/* Chaos Toggle Switch */}
              <button
                onClick={() => setChaosActive(!chaosActive)}
                className={`py-0.5 px-2 rounded border flex items-center gap-1 font-mono text-[9px] font-bold cursor-pointer transition-all duration-300
                  ${chaosActive
                    ? 'bg-red-950/45 border-red-500/50 text-red-400 text-glow-red animate-pulse'
                    : 'bg-slate-950/60 border-white/5 text-slate-500 hover:text-slate-300'
                  }`}
              >
                {chaosActive ? <Pause className="w-2.5 h-2.5" /> : <Play className="w-2.5 h-2.5" />}
                <span>CHAOS AUTO</span>
              </button>
            </div>
            <p className="font-mono text-[9px] text-slate-500 mb-2 leading-relaxed">
              Inject latency spikes manually, or activate the autonomous Chaos engine to continuously test network resilience.
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {nodes.map(node => (
                <button
                  key={`spike-${node.id}`}
                  onClick={() => onInjectSpike(node.id)}
                  disabled={node.status === 'RECONFIGURING' || node.status === 'DEGRADED'}
                  className={`py-1 px-2 rounded font-mono text-[9px] font-bold flex items-center justify-between border cursor-pointer select-none transition-all duration-300
                    ${node.status === 'RECONFIGURING' || node.status === 'DEGRADED'
                      ? 'bg-slate-950/20 border-white/5 text-slate-600 cursor-not-allowed'
                      : 'bg-red-950/25 hover:bg-red-950/55 border-red-500/25 hover:border-red-500/60 text-red-400 hover:shadow-[0_0_6px_rgba(239,68,68,0.15)]'
                    }`}
                >
                  <span>SPIKE: {node.name.split('-')[0]}</span>
                  <ShieldAlert className="w-2.5 h-2.5 text-red-500/70" />
                </button>
              ))}
            </div>
          </div>

          {/* Section: Architectural Diagram of Backend Brain */}
          <div className="border-t border-white/5 pt-3 flex-1 flex flex-col justify-end">
            <div className="bg-slate-950/75 p-2 rounded border border-white/5 font-mono text-[9px] text-slate-400 space-y-1">
              <div className="text-cyan-400 font-bold text-[9px] font-orbitron border-b border-white/5 pb-1 flex justify-between">
                <span>AGENT ORCHESTRATION</span>
                <span className="text-[7px] text-slate-600">v1.2.0</span>
              </div>
              <div className="text-slate-500 font-semibold">{"// Autopilot Policy"}</div>
              <div>- MONITOR (tick=1.5s)</div>
              <div>- DETECT (threshold &gt; 300ms)</div>
              <div>- AUTO_HEAL (rerouting_duration=3.0s)</div>
            </div>
          </div>
        </aside>

        {/* 3D Network Render Canvas */}
        <main className="flex-1 h-full relative">
          <NetworkMesh nodes={nodes} onSelectNode={(node) => setSelectedNodeId(node.id)} autoPilot={autoPilot} />
          
          {/* Selected Node Telemetry Modal Overlay */}
          {selectedNode && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className={`absolute bottom-4 left-4 p-4 rounded-lg w-72 glass-panel font-mono text-xs space-y-2.5 z-20 transition-all duration-300
                ${selectedNode.status === 'DEGRADED' ? 'glass-panel-neon-alert border-red-500/30' : 
                  selectedNode.status === 'RECONFIGURING' ? 'border-orange-500/30' : 'glass-panel-neon'}`}
            >
              <div className="flex justify-between items-center border-b border-white/5 pb-2">
                <span className="font-orbitron font-extrabold text-sm text-white flex items-center gap-1">
                  <Server className="w-4 h-4 text-cyan-400" />
                  {selectedNode.name}
                </span>
                <button 
                  onClick={() => setSelectedNodeId(null)}
                  className="text-slate-500 hover:text-slate-200 text-xs px-1 border border-transparent hover:border-white/10 rounded"
                >
                  ✖
                </button>
              </div>

              <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-[11px] text-slate-300">
                <div>Region:</div>
                <div className="text-slate-100 text-right">{selectedNode.region}</div>

                <div>IP Address:</div>
                <div className="text-slate-100 text-right">{selectedNode.ip}</div>

                <div>Latency:</div>
                <div className={`text-right font-bold ${selectedNode.status === 'DEGRADED' ? 'text-red-400 text-glow-red animate-pulse' : 'text-slate-100'}`}>
                  {selectedNode.latency} ms
                </div>

                <div>Load:</div>
                <div className="text-slate-100 text-right">{selectedNode.load}%</div>
                
                <div>Status:</div>
                <div className={`text-right font-bold ${selectedNode.status === 'DEGRADED' ? 'text-red-400' : selectedNode.status === 'RECONFIGURING' ? 'text-orange-400' : 'text-emerald-400'}`}>
                  {selectedNode.status}
                </div>
              </div>

              {selectedNode.status === 'DEGRADED' && (
                <button
                  onClick={() => onForceReroute(selectedNode.id)}
                  className="w-full mt-2 py-1.5 px-3 rounded bg-orange-950/45 hover:bg-orange-950/70 border border-orange-500/30 hover:border-orange-500/60 text-orange-400 font-bold text-[10px] flex items-center justify-center gap-1.5 transition-all duration-300"
                >
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '4s' }} />
                  FORCE AGENT REROUTE
                </button>
              )}
            </motion.div>
          )}

          {/* User tips overlay */}
          <div className="absolute top-4 right-4 bg-slate-950/80 p-2.5 rounded border border-white/5 font-mono text-[10px] text-slate-500 z-10 pointer-events-none">
            💡 Drag to rotate 3D Mesh | Click nodes to inspect / manual reroute
          </div>
        </main>
      </div>
    </div>
  );
}
