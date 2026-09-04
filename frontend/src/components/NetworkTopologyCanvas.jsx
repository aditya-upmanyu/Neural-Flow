// NetworkTopologyCanvas.jsx - Professional Cybersecurity AI Topology Canvas (Zero-Flicker 60fps)
import React, { useRef, useEffect, useState, useCallback } from 'react';

/**
 * Professional Enterprise Network Topology Canvas
 * Built with continuous 60fps render loop, persistent context, DPI scaling,
 * and zero-flicker telemetry reactivity.
 */
export default function NetworkTopologyCanvas({
  nodes = [],
  lastAIDecision = null,
  incident = null,
  className = '',
  style = {},
  onSelectNode = null,
}) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  // Store live props in refs so the animation loop runs continuously without restarting
  const propsRef = useRef({ nodes, lastAIDecision, incident });
  propsRef.current = { nodes, lastAIDecision, incident };

  const [hoveredNode, setHoveredNode] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  // Persistent visual simulation state
  const simRef = useRef({
    particles: [],
    packets: [],
    nodePositions: {}, // id -> { x, y, tx, ty, radius, displayHealth, displayLatency, displayTraffic }
    rerouteBeam: null,
    prevRerouteKey: null,
    hoveredNodeId: null,
    lastTime: 0,
    width: 600,
    height: 350,
    recoveryAnimations: {}, // nodeId -> { startTime, duration, phase }
  });

  // Initialize ambient micro-particles once
  useEffect(() => {
    const pts = [];
    for (let i = 0; i < 40; i++) {
      pts.push({
        x: Math.random(),
        y: Math.random(),
        vx: (Math.random() - 0.5) * 0.00015,
        vy: -0.0002 - Math.random() * 0.0004,
        size: Math.random() * 1.5 + 0.5,
        baseAlpha: Math.random() * 0.4 + 0.1,
        phase: Math.random() * Math.PI * 2,
      });
    }
    simRef.current.particles = pts;
  }, []);

  // Check for AI reroute beam trigger
  useEffect(() => {
    if (lastAIDecision && (lastAIDecision.fromNodeId || lastAIDecision.toNodeId)) {
      const key = `${lastAIDecision.fromNodeId}->${lastAIDecision.toNodeId}-${lastAIDecision.timestamp || lastAIDecision.responseTimeMs || Date.now()}`;
      if (simRef.current.prevRerouteKey !== key) {
        simRef.current.prevRerouteKey = key;
        simRef.current.rerouteBeam = {
          fromId: parseInt(lastAIDecision.fromNodeId, 10),
          toId: parseInt(lastAIDecision.toNodeId, 10),
          startTime: performance.now(),
          duration: 700, // ms
        };
      }
    }
  }, [lastAIDecision]);

  // Trigger recovery animation when recovery_success event arrives
  const triggerRecoveryAnimation = useCallback((nodeId) => {
    simRef.current.recoveryAnimations[nodeId] = {
      startTime: performance.now(),
      duration: 4000, // 4 seconds total
      phase: 'recovering', // 'recovering' -> 'success' -> 'fade'
    };
    console.log(`🟢 Recovery animation triggered for Node ${nodeId}`);
  }, []);

  // Expose trigger function for parent component to call via WebSocket
  useEffect(() => {
    if (window.triggerNodeRecovery) {
      console.warn('window.triggerNodeRecovery already exists, overwriting');
    }
    window.triggerNodeRecovery = triggerRecoveryAnimation;
    return () => {
      delete window.triggerNodeRecovery;
    };
  }, [triggerRecoveryAnimation]);

  // Main Canvas Render Loop (Mounts once, never flickers)
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    let animId;
    let lastPacketTime = 0;

    // Handle high DPI and resizing without resetting animation state
    const handleResize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2); // cap at 2 for performance
      const w = Math.max(rect.width, 100);
      const h = Math.max(rect.height, 100);

      simRef.current.width = w;
      simRef.current.height = h;

      if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    handleResize();
    const ro = new ResizeObserver(handleResize);
    ro.observe(container);

    // Continuous 60fps Render Function
    const render = (now) => {
      const w = simRef.current.width;
      const h = simRef.current.height;
      const time = now * 0.001;
      const dt = simRef.current.lastTime ? (now - simRef.current.lastTime) * 0.001 : 0.016;
      simRef.current.lastTime = now;

      const { nodes: currentNodes, incident: currentIncident } = propsRef.current;
      const activeList = currentNodes && currentNodes.length > 0 ? currentNodes : [
        { nodeId: 1, name: 'Testfire Bank', status: 'HEALTHY', latency: 24, health: 98, traffic: 60 },
        { nodeId: 2, name: 'Zero Bank', status: 'HEALTHY', latency: 32, health: 95, traffic: 25 },
        { nodeId: 3, name: 'VulnWeb PHP', status: 'HEALTHY', latency: 45, health: 92, traffic: 15 },
      ];

      // ── 1. ENHANCED CINEMATIC BACKGROUND ─────────────────────────────────
      ctx.fillStyle = '#030712'; // Deeper void
      ctx.fillRect(0, 0, w, h);

      const cx = w * 0.5;
      const cy = h * 0.48;

      // Multi-layer radial depth effect (3D-like)
      const bgGrad1 = ctx.createRadialGradient(cx, cy, 5, cx, cy, Math.max(w, h) * 0.4);
      bgGrad1.addColorStop(0, 'rgba(20, 40, 70, 0.55)');
      bgGrad1.addColorStop(0.4, 'rgba(12, 25, 45, 0.3)');
      bgGrad1.addColorStop(1, 'rgba(3, 7, 18, 0.0)');
      ctx.fillStyle = bgGrad1;
      ctx.fillRect(0, 0, w, h);

      const bgGrad2 = ctx.createRadialGradient(cx, cy, Math.max(w, h) * 0.4, cx, cy, Math.max(w, h) * 0.8);
      bgGrad2.addColorStop(0, 'rgba(0, 0, 0, 0)');
      bgGrad2.addColorStop(0.7, 'rgba(5, 12, 25, 0.4)');
      bgGrad2.addColorStop(1, 'rgba(3, 7, 18, 0.8)');
      ctx.fillStyle = bgGrad2;
      ctx.fillRect(0, 0, w, h);

      // Dynamic aurora wave (animated)
      const auroraX = w * 0.3 + Math.sin(time * 0.5) * w * 0.1;
      const auroraY = h * 0.2 + Math.cos(time * 0.3) * h * 0.1;
      const aurora = ctx.createRadialGradient(auroraX, auroraY, 10, auroraX, auroraY, w * 0.6);
      aurora.addColorStop(0, `rgba(0, 245, 212, ${0.08 + Math.sin(time * 2) * 0.03})`);
      aurora.addColorStop(0.4, 'rgba(59, 130, 246, 0.04)');
      aurora.addColorStop(0.7, 'rgba(124, 58, 237, 0.02)');
      aurora.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = aurora;
      ctx.fillRect(0, 0, w, h);

      // ── 2. ENHANCED 3D-STYLE HEXAGONAL GRID ─────────────────────────────
      ctx.strokeStyle = 'rgba(0, 245, 212, 0.04)';
      ctx.lineWidth = 1;
      const step = 48;
      
      // Perspective-enhanced grid lines (vertical with depth fade)
      ctx.beginPath();
      for (let x = (w % step) * 0.5; x < w; x += step) {
        const fade = 1 - Math.abs(x - cx) / (w * 0.5);
        ctx.strokeStyle = `rgba(0, 245, 212, ${0.04 * fade})`;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x + (x - cx) * 0.05, h);
        ctx.stroke();
      }
      
      // Horizontal grid with perspective
      for (let y = (h % step) * 0.5; y < h; y += step) {
        const fade = 1 - Math.abs(y - cy) / (h * 0.5);
        ctx.strokeStyle = `rgba(0, 245, 212, ${0.04 * fade})`;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Enhanced matrix accent points with glow
      for (let x = (w % step) * 0.5; x < w; x += step * 1.5) {
        for (let y = (h % step) * 0.5; y < h; y += step * 1.5) {
          const distFromCenter = Math.hypot(x - cx, y - cy);
          const maxDist = Math.hypot(w * 0.5, h * 0.5);
          const alpha = 0.15 * (1 - distFromCenter / maxDist);
          
          ctx.fillStyle = `rgba(0, 245, 212, ${alpha})`;
          ctx.shadowColor = '#00f5d4';
          ctx.shadowBlur = 4;
          ctx.beginPath();
          ctx.arc(x, y, 1.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }

      // ── 3. ENHANCED AMBIENT PARTICLES WITH DEPTH ──────────────────────────
      const pts = simRef.current.particles;
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i];
        p.y += p.vy;
        p.x += p.vx;
        if (p.y < 0) p.y = 1;
        if (p.x < 0) p.x = 1;
        if (p.x > 1) p.x = 0;

        // Particle depth effect based on position
        const px = p.x * w;
        const py = p.y * h;
        const depth = Math.hypot(px - cx, py - cy) / Math.hypot(w * 0.5, h * 0.5);
        
        const alpha = p.baseAlpha * (0.6 + 0.4 * Math.sin(time * 2 + p.phase)) * (1.2 - depth * 0.5);
        const size = p.size * (1.5 - depth * 0.7); // Particles farther = smaller (depth illusion)
        
        // Particle glow trail
        ctx.fillStyle = `rgba(0, 245, 212, ${alpha * 0.3})`;
        ctx.beginPath();
        ctx.arc(px, py, size * 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Core particle
        ctx.fillStyle = `rgba(0, 245, 212, ${alpha})`;
        ctx.shadowColor = '#00f5d4';
        ctx.shadowBlur = size * 2;
        ctx.beginPath();
        ctx.arc(px, py, size, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // ── 4. NODE POSITIONS & SMOOTH INTERPOLATION ─────────────────────────
      const count = activeList.length;
      const rx = Math.min(w * 0.35, 220);
      const ry = Math.min(h * 0.31, 150);

      activeList.forEach((node, idx) => {
        const id = node.nodeId || node.id || (idx + 1);
        let targetX, targetY;

        if (count === 3) {
          const angles = [-Math.PI / 2, Math.PI / 6, (5 * Math.PI) / 6];
          targetX = cx + rx * Math.cos(angles[idx]);
          targetY = cy + ry * Math.sin(angles[idx]) * 0.95;
        } else {
          const angle = (idx / count) * Math.PI * 2 - Math.PI / 2;
          targetX = cx + rx * Math.cos(angle);
          targetY = cy + ry * Math.sin(angle);
        }

        if (!simRef.current.nodePositions[id]) {
          simRef.current.nodePositions[id] = {
            x: targetX,
            y: targetY,
            radius: 26,
            displayLatency: node.latency || 20,
            displayHealth: node.health || 100,
            displayTraffic: node.traffic || 33,
          };
        } else {
          const np = simRef.current.nodePositions[id];
          np.x += (targetX - np.x) * 0.12;
          np.y += (targetY - np.y) * 0.12;

          const isHov = simRef.current.hoveredNodeId === id;
          const tr = isHov ? 32 : 26;
          np.radius += (tr - np.radius) * 0.15;

          // Smooth number interpolation for live metrics
          np.displayLatency += ((node.latency || 20) - np.displayLatency) * 0.1;
          np.displayHealth += ((node.health ?? node.healthScore ?? 100) - np.displayHealth) * 0.1;
          np.displayTraffic += ((node.traffic ?? (100 / count)) - np.displayTraffic) * 0.1;
        }
      });

      // ── 5. PACKET SPAWNING (SMOOTH DATA STREAM) ───────────────────────────
      if (now - lastPacketTime > 380 && activeList.length >= 2) {
        lastPacketTime = now;
        const sIdx = Math.floor(Math.random() * activeList.length);
        let dIdx = Math.floor(Math.random() * activeList.length);
        while (dIdx === sIdx) {
          dIdx = Math.floor(Math.random() * activeList.length);
        }

        const sNode = activeList[sIdx];
        const dNode = activeList[dIdx];
        const sId = sNode.nodeId || sNode.id || (sIdx + 1);
        const dId = dNode.nodeId || dNode.id || (dIdx + 1);

        simRef.current.packets.push({
          srcId: sId,
          dstId: dId,
          progress: 0,
          speed: 0.009 + Math.random() * 0.007,
          color: (sNode.isUnderAttack || dNode.isUnderAttack) ? '#ef4444' : '#3b82f6',
          size: Math.random() * 1.5 + 2.5,
        });
      }

      // ── 6. DRAW NETWORK CONNECTIONS (FLOWING DASH CIRCUITS) ──────────────
      for (let i = 0; i < activeList.length; i++) {
        for (let j = i + 1; j < activeList.length; j++) {
          const n1 = activeList[i];
          const n2 = activeList[j];
          const id1 = n1.nodeId || n1.id || (i + 1);
          const id2 = n2.nodeId || n2.id || (j + 1);

          const p1 = simRef.current.nodePositions[id1];
          const p2 = simRef.current.nodePositions[id2];
          if (!p1 || !p2) continue;

          const isCritical = Boolean(n1.isUnderAttack || n2.isUnderAttack || n1.status === 'CRITICAL' || n2.status === 'CRITICAL');
          const isWarning = Boolean(n1.status === 'WARNING' || n2.status === 'WARNING');

          const avgTraffic = (p1.displayTraffic + p2.displayTraffic) * 0.5;
          const lineThickness = Math.max(1.8, Math.min(5, (avgTraffic / 100) * 6));

          // Base Glow Track
          ctx.save();
          if (isCritical) {
            ctx.strokeStyle = 'rgba(239, 68, 68, 0.35)';
            ctx.shadowColor = '#ef4444';
            ctx.shadowBlur = 8;
          } else if (isWarning) {
            ctx.strokeStyle = 'rgba(245, 158, 11, 0.3)';
            ctx.shadowColor = '#f59e0b';
            ctx.shadowBlur = 6;
          } else {
            ctx.strokeStyle = 'rgba(0, 245, 212, 0.18)';
            ctx.shadowColor = '#00f5d4';
            ctx.shadowBlur = 5;
          }
          ctx.lineWidth = lineThickness + 1.5;
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
          ctx.restore();

          // Animated Flowing Dash Line
          ctx.save();
          ctx.lineWidth = lineThickness;
          ctx.setLineDash([8, 6]);
          ctx.lineDashOffset = -time * 24;

          if (isCritical) {
            ctx.strokeStyle = Math.sin(time * 12) > 0 ? '#ef4444' : 'rgba(239, 68, 68, 0.6)';
          } else if (isWarning) {
            ctx.strokeStyle = '#f59e0b';
          } else {
            ctx.strokeStyle = '#00f5d4';
          }
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
          ctx.restore();
        }
      }

      // ── 7. DRAW DATA PACKETS WITH GLOW TRAILS ────────────────────────────
      const alivePackets = [];
      for (let k = 0; k < simRef.current.packets.length; k++) {
        const pkt = simRef.current.packets[k];
        pkt.progress += pkt.speed;

        if (pkt.progress <= 1) {
          alivePackets.push(pkt);
          const p1 = simRef.current.nodePositions[pkt.srcId];
          const p2 = simRef.current.nodePositions[pkt.dstId];

          if (p1 && p2) {
            const curX = p1.x + (p2.x - p1.x) * pkt.progress;
            const curY = p1.y + (p2.y - p1.y) * pkt.progress;

            let alpha = 1;
            if (pkt.progress < 0.15) alpha = pkt.progress / 0.15;
            else if (pkt.progress > 0.85) alpha = (1 - pkt.progress) / 0.15;

            ctx.save();
            ctx.shadowColor = pkt.color;
            ctx.shadowBlur = 10;
            ctx.fillStyle = pkt.color;
            ctx.globalAlpha = Math.max(0, Math.min(1, alpha));

            ctx.beginPath();
            ctx.arc(curX, curY, pkt.size, 0, Math.PI * 2);
            ctx.fill();

            // Smooth trailing tail
            const tX = p1.x + (p2.x - p1.x) * Math.max(0, pkt.progress - 0.04);
            const tY = p1.y + (p2.y - p1.y) * Math.max(0, pkt.progress - 0.04);
            ctx.strokeStyle = pkt.color;
            ctx.lineWidth = pkt.size * 0.7;
            ctx.beginPath();
            ctx.moveTo(curX, curY);
            ctx.lineTo(tX, tY);
            ctx.stroke();

            ctx.restore();
          }
        }
      }
      simRef.current.packets = alivePackets;

      // ── 8. AI REROUTE HIGH-ENERGY BEAM SWEEP ─────────────────────────────
      const beam = simRef.current.rerouteBeam;
      if (beam) {
        const elapsed = now - beam.startTime;
        const progress = Math.min(1, elapsed / beam.duration);

        const pFrom = simRef.current.nodePositions[beam.fromId];
        const pTo = simRef.current.nodePositions[beam.toId];

        if (pFrom && pTo) {
          const hX = pFrom.x + (pTo.x - pFrom.x) * progress;
          const hY = pFrom.y + (pTo.y - pFrom.y) * progress;

          ctx.save();
          const bGrad = ctx.createLinearGradient(pFrom.x, pFrom.y, hX, hY);
          bGrad.addColorStop(0, 'rgba(0, 245, 212, 0.0)');
          bGrad.addColorStop(0.7, 'rgba(0, 245, 212, 0.85)');
          bGrad.addColorStop(1, '#ffffff');

          ctx.strokeStyle = bGrad;
          ctx.lineWidth = 5;
          ctx.shadowColor = '#00f5d4';
          ctx.shadowBlur = 16;
          ctx.beginPath();
          ctx.moveTo(pFrom.x, pFrom.y);
          ctx.lineTo(hX, hY);
          ctx.stroke();

          // Energy Head
          ctx.fillStyle = '#ffffff';
          ctx.shadowColor = '#ffffff';
          ctx.shadowBlur = 12;
          ctx.beginPath();
          ctx.arc(hX, hY, 6, 0, Math.PI * 2);
          ctx.fill();

          // Animated "↗ REROUTED" Badge
          const bX = pFrom.x + (pTo.x - pFrom.x) * 0.5;
          const bY = pFrom.y + (pTo.y - pFrom.y) * 0.5 - 16;

          ctx.fillStyle = 'rgba(5, 15, 30, 0.92)';
          ctx.strokeStyle = '#00f5d4';
          ctx.lineWidth = 1;
          ctx.shadowColor = '#00f5d4';
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.roundRect(bX - 40, bY - 10, 80, 20, 4);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#00f5d4';
          ctx.font = 'bold 9.5px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('↗ REROUTED', bX, bY);
          ctx.restore();
        }

        if (progress >= 1) {
          simRef.current.rerouteBeam = null;
        }
      }

      // ── 9. DRAW NODES (SEGMENTED RINGS, RADAR, LABELS) ────────────────────
      activeList.forEach((node, idx) => {
        const id = node.nodeId || node.id || (idx + 1);
        const np = simRef.current.nodePositions[id];
        if (!np) return;

        // Check if node has active recovery animation
        const recoveryAnim = simRef.current.recoveryAnimations[id];
        const isRecovering = recoveryAnim && (now - recoveryAnim.startTime < recoveryAnim.duration);
        
        let recoveryProgress = 0;
        let recoveryPhase = 'none';
        if (isRecovering) {
          const elapsed = now - recoveryAnim.startTime;
          recoveryProgress = Math.min(elapsed / recoveryAnim.duration, 1);
          
          // Phase transitions: 0-0.3 = recovering (orange), 0.3-0.7 = success (green), 0.7-1.0 = fade
          if (recoveryProgress < 0.3) {
            recoveryPhase = 'recovering';
          } else if (recoveryProgress < 0.7) {
            recoveryPhase = 'success';
          } else {
            recoveryPhase = 'fade';
          }
          
          // Clean up after animation completes
          if (recoveryProgress >= 1) {
            delete simRef.current.recoveryAnimations[id];
          }
        }

        const isUnderAttack = Boolean(
          node.isUnderAttack ||
          node.status === 'CRITICAL' ||
          (currentIncident && currentIncident.nodeId === id &&
           ['DETECTED', 'PREDICTED', 'REROUTING', 'ACTION_PENDING', 'VERIFYING'].includes(currentIncident.state))
        ) && !isRecovering; // Don't show attack if recovering
        
        const isWarning = Boolean(node.status === 'WARNING' || (np.displayHealth <= 70 && !isUnderAttack)) && !isRecovering;
        const isHovered = simRef.current.hoveredNodeId === id;

        // Dynamic color based on recovery animation
        let themeColor = '#00f5d4'; // default green/cyan
        if (isRecovering) {
          if (recoveryPhase === 'recovering') {
            // Smooth RED -> ORANGE transition
            const t = (recoveryProgress / 0.3); // 0 to 1 in first 30%
            const r = Math.round(239 * (1 - t) + 245 * t);
            const g = Math.round(68 * (1 - t) + 158 * t);
            const b = Math.round(68 * (1 - t) + 11 * t);
            themeColor = `rgb(${r}, ${g}, ${b})`;
          } else if (recoveryPhase === 'success') {
            // Smooth ORANGE -> GREEN transition
            const t = ((recoveryProgress - 0.3) / 0.4); // 0 to 1 in 30-70%
            const r = Math.round(245 * (1 - t) + 0 * t);
            const g = Math.round(158 * (1 - t) + 245 * t);
            const b = Math.round(11 * (1 - t) + 212 * t);
            themeColor = `rgb(${r}, ${g}, ${b})`;
          } else { // fade
            themeColor = '#00f5d4'; // final green
          }
        } else if (isUnderAttack) {
          themeColor = '#ef4444'; // red
        } else if (isWarning) {
          themeColor = '#f59e0b'; // yellow
        }
        
        const phase = idx * ((Math.PI * 2) / 3);
        const pulse = 0.65 + 0.35 * Math.sin(time * 3 + phase);

        ctx.save();

        // ── 9A. ATTACK VISUALS: SONAR RIPPLES & LIGHTNING ──────────────────
        if (isUnderAttack) {
          // Sonar rings
          const rProg1 = (time * 1.6) % 1;
          ctx.strokeStyle = `rgba(239, 68, 68, ${(1 - rProg1) * 0.75})`;
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.arc(np.x, np.y, np.radius + rProg1 * 40, 0, Math.PI * 2);
          ctx.stroke();

          const rProg2 = (time * 1.6 + 0.5) % 1;
          ctx.strokeStyle = `rgba(239, 68, 68, ${(1 - rProg2) * 0.75})`;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.arc(np.x, np.y, np.radius + rProg2 * 40, 0, Math.PI * 2);
          ctx.stroke();

          // Electric Jitter Arcs
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 1.4;
          ctx.shadowColor = '#ef4444';
          ctx.shadowBlur = 8;
          for (let arc = 0; arc < 4; arc++) {
            const baseAng = arc * (Math.PI / 2) + time * 5;
            const r1 = np.radius + 5;
            const r2 = np.radius + 20 + Math.random() * 10;
            const midR = (r1 + r2) * 0.5;
            const jitterAng = baseAng + (Math.random() - 0.5) * 0.35;

            ctx.beginPath();
            ctx.moveTo(np.x + r1 * Math.cos(baseAng), np.y + r1 * Math.sin(baseAng));
            ctx.lineTo(np.x + midR * Math.cos(jitterAng), np.y + midR * Math.sin(jitterAng));
            ctx.lineTo(np.x + r2 * Math.cos(baseAng), np.y + r2 * Math.sin(baseAng));
            ctx.stroke();
          }

          // Blinking '⚠ ATTACK' badge
          if (Math.sin(time * 8) > 0) {
            const bY = np.y - np.radius - 20;
            ctx.fillStyle = 'rgba(239, 68, 68, 0.95)';
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1;
            ctx.shadowColor = '#ef4444';
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.roundRect(np.x - 34, bY - 9, 68, 18, 4);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 8.5px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('⚠ ATTACK', np.x, bY);
          }
        }

        // ── 9AA. RECOVERY SUCCESS ANIMATION ────────────────────────────────
        if (isRecovering) {
          const fadeAlpha = recoveryPhase === 'fade' ? 1 - ((recoveryProgress - 0.7) / 0.3) : 1;
          
          // Expanding success rings
          if (recoveryPhase === 'success' || recoveryPhase === 'fade') {
            const ringProgress = recoveryPhase === 'success' ? ((recoveryProgress - 0.3) / 0.4) : 0.8;
            const ring1 = ringProgress * 0.5;
            const ring2 = (ringProgress * 0.5) + 0.3;
            
            ctx.strokeStyle = `rgba(0, 245, 212, ${(1 - ring1) * 0.8 * fadeAlpha})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(np.x, np.y, np.radius + ring1 * 50, 0, Math.PI * 2);
            ctx.stroke();
            
            if (ring2 <= 1) {
              ctx.strokeStyle = `rgba(0, 245, 212, ${(1 - ring2) * 0.6 * fadeAlpha})`;
              ctx.lineWidth = 1.5;
              ctx.beginPath();
              ctx.arc(np.x, np.y, np.radius + ring2 * 50, 0, Math.PI * 2);
              ctx.stroke();
            }
          }
          
          // Success badge: "✓ AI RECOVERY SUCCESSFUL"
          if (recoveryPhase === 'success' || recoveryPhase === 'fade') {
            const bY = np.y - np.radius - 24;
            const badgeAlpha = fadeAlpha;
            
            // Pulsing glow behind badge
            const successPulse = 0.7 + 0.3 * Math.sin(time * 6);
            ctx.shadowColor = `rgba(0, 245, 212, ${successPulse * badgeAlpha})`;
            ctx.shadowBlur = 15;
            
            ctx.fillStyle = `rgba(0, 245, 212, ${0.95 * badgeAlpha})`;
            ctx.strokeStyle = `rgba(255, 255, 255, ${badgeAlpha})`;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.roundRect(np.x - 68, bY - 10, 136, 20, 5);
            ctx.fill();
            ctx.stroke();

            ctx.shadowBlur = 0;
            ctx.fillStyle = `rgba(3, 7, 18, ${badgeAlpha})`;
            ctx.font = 'bold 9px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('✓ AI RECOVERY SUCCESSFUL', np.x, bY);
          }
        }

        // ── 9B. MULTI-LAYER 3D-STYLE GLOW WITH DEPTH ───────────────────────
        // Outer atmospheric glow (depth layer 1)
        const glow1 = ctx.createRadialGradient(np.x, np.y, np.radius * 0.2, np.x, np.y, np.radius * 3.0);
        glow1.addColorStop(0, themeColor === '#00f5d4' ? 'rgba(0, 245, 212, 0.25)' : themeColor === '#f59e0b' ? 'rgba(245, 158, 11, 0.25)' : 'rgba(239, 68, 68, 0.35)');
        glow1.addColorStop(0.4, themeColor === '#00f5d4' ? 'rgba(0, 245, 212, 0.08)' : themeColor === '#f59e0b' ? 'rgba(245, 158, 11, 0.08)' : 'rgba(239, 68, 68, 0.12)');
        glow1.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = glow1;
        ctx.beginPath();
        ctx.arc(np.x, np.y, np.radius * 3.0, 0, Math.PI * 2);
        ctx.fill();

        // Mid-range glow (depth layer 2)
        const glow2 = ctx.createRadialGradient(np.x, np.y, np.radius * 0.5, np.x, np.y, np.radius * (isHovered ? 2.6 : 2.2));
        glow2.addColorStop(0, themeColor === '#00f5d4' ? 'rgba(0, 245, 212, 0.55)' : themeColor === '#f59e0b' ? 'rgba(245, 158, 11, 0.55)' : 'rgba(239, 68, 68, 0.65)');
        glow2.addColorStop(0.6, themeColor === '#00f5d4' ? 'rgba(0, 245, 212, 0.15)' : themeColor === '#f59e0b' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(239, 68, 68, 0.18)');
        glow2.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = glow2;
        ctx.beginPath();
        ctx.arc(np.x, np.y, np.radius * 2.6, 0, Math.PI * 2);
        ctx.fill();
        
        // Hover pulse ring
        if (isHovered) {
          const hoverPulse = 0.7 + 0.3 * Math.sin(time * 8);
          ctx.strokeStyle = themeColor;
          ctx.lineWidth = 2;
          ctx.globalAlpha = hoverPulse * 0.6;
          ctx.beginPath();
          ctx.arc(np.x, np.y, np.radius + 12 + Math.sin(time * 6) * 3, 0, Math.PI * 2);
          ctx.stroke();
          ctx.globalAlpha = 1;
        }

        // ── 9C. ROTATING SEGMENTED OUTER RING ───────────────────────────────
        const rSpeed = isUnderAttack ? 5.2 : 1.05;
        const curAng = time * rSpeed;

        ctx.strokeStyle = themeColor;
        ctx.lineWidth = 2.0;
        ctx.shadowColor = themeColor;
        ctx.shadowBlur = 8 * pulse;
        ctx.beginPath();
        for (let s = 0; s < 3; s++) {
          const sStart = curAng + s * ((Math.PI * 2) / 3);
          const sEnd = sStart + ((Math.PI * 2) / 3) * 0.65;
          ctx.arc(np.x, np.y, np.radius + 5, sStart, sEnd);
        }
        ctx.stroke();

        // ── 9D. RADAR SWEEP ARC ────────────────────────────────────────────
        if (!isUnderAttack) {
          const swAng = (time * (Math.PI * 2) / 3.0) % (Math.PI * 2);
          const swGrad = ctx.createRadialGradient(np.x, np.y, 2, np.x, np.y, np.radius + 4);
          swGrad.addColorStop(0, 'rgba(0, 245, 212, 0.35)');
          swGrad.addColorStop(1, 'rgba(0, 245, 212, 0.02)');

          ctx.fillStyle = swGrad;
          ctx.beginPath();
          ctx.moveTo(np.x, np.y);
          ctx.arc(np.x, np.y, np.radius + 4, swAng - 0.65, swAng);
          ctx.closePath();
          ctx.fill();
        }

        // ── 9E. 3D-STYLE METALLIC CORE WITH DEPTH ──────────────────────────
        // Outer shadow ring (3D depth effect)
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(np.x + 1, np.y + 1, np.radius, 0, Math.PI * 2);
        ctx.stroke();
        
        // Main core with gradient (metallic 3D look)
        const coreGrad = ctx.createRadialGradient(
          np.x - np.radius * 0.3, 
          np.y - np.radius * 0.3, 
          np.radius * 0.1,
          np.x, 
          np.y, 
          np.radius
        );
        coreGrad.addColorStop(0, '#1e293b'); // Lighter top-left (3D highlight)
        coreGrad.addColorStop(0.5, '#0f172a');
        coreGrad.addColorStop(1, '#020617'); // Darker bottom-right (3D shadow)
        ctx.fillStyle = coreGrad;
        ctx.beginPath();
        ctx.arc(np.x, np.y, np.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Metallic rim
        ctx.strokeStyle = themeColor;
        ctx.lineWidth = 2.2;
        ctx.shadowColor = themeColor;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(np.x, np.y, np.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Inner luminous center with 3D gradient
        const centerGrad = ctx.createRadialGradient(
          np.x - 2,
          np.y - 2,
          0,
          np.x,
          np.y,
          np.radius * 0.45
        );
        centerGrad.addColorStop(0, '#ffffff');
        centerGrad.addColorStop(0.6, themeColor);
        centerGrad.addColorStop(1, themeColor === '#00f5d4' ? '#0a7ea4' : themeColor === '#f59e0b' ? '#92400e' : '#7f1d1d');
        ctx.fillStyle = centerGrad;
        ctx.shadowColor = themeColor;
        ctx.shadowBlur = 16;
        ctx.beginPath();
        ctx.arc(np.x, np.y, np.radius * 0.45, 0, Math.PI * 2);
        ctx.fill();

        // Highlight reflection (3D glass effect)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.shadowBlur = 4;
        ctx.shadowColor = '#ffffff';
        ctx.beginPath();
        ctx.arc(np.x - np.radius * 0.25, np.y - np.radius * 0.25, np.radius * 0.18, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // ── 9F. LABELS & METRICS ───────────────────────────────────────────
        ctx.shadowBlur = 0;
        const lblY = np.y + np.radius + 16;

        ctx.fillStyle = '#f1f5f9';
        ctx.font = 'bold 11px "Inter", -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(`Node ${id} · ${node.name || `Server ${id}`}`, np.x, lblY);

        ctx.fillStyle = themeColor;
        ctx.font = '600 10.5px monospace';
        ctx.fillText(
          `${Math.round(np.displayLatency)}ms · ${Math.round(np.displayHealth)}% HLTH · ${Math.round(np.displayTraffic)}% TRF`,
          np.x,
          lblY + 15
        );

        ctx.restore();
      });

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      ro.unobserve(container);
    };
  }, []); // Mounts once, continuous 60fps loop

  // ── MOUSE INTERACTION (HOVER & TOOLTIP) ──────────────────────────────────
  const handleMouseMove = useCallback((e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    let found = null;
    const posMap = simRef.current.nodePositions;
    const { nodes: currentNodes } = propsRef.current;
    const activeList = currentNodes && currentNodes.length > 0 ? currentNodes : [];

    for (let i = 0; i < activeList.length; i++) {
      const node = activeList[i];
      const id = node.nodeId || node.id || (i + 1);
      const pos = posMap[id];
      if (pos) {
        const dist = Math.hypot(mx - pos.x, my - pos.y);
        if (dist <= pos.radius + 14) {
          found = node;
          setTooltipPos({ x: pos.x, y: pos.y });
          simRef.current.hoveredNodeId = id;
          break;
        }
      }
    }

    if (!found) {
      simRef.current.hoveredNodeId = null;
      setHoveredNode(null);
    } else {
      setHoveredNode(found);
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    simRef.current.hoveredNodeId = null;
    setHoveredNode(null);
  }, []);

  const handleClick = useCallback(() => {
    if (hoveredNode && onSelectNode) {
      onSelectNode(hoveredNode);
    }
  }, [hoveredNode, onSelectNode]);

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      className={`relative w-full h-full min-h-[290px] overflow-hidden bg-[#050a14] select-none ${className}`}
      style={style}
    >
      <canvas ref={canvasRef} className="block w-full h-full cursor-crosshair" />

      {/* Cyber HUD Corner Badges */}
      <div className="absolute top-2.5 left-3 pointer-events-none z-10 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-[#00f5d4] animate-pulse" />
        <span className="text-[10px] font-mono font-bold tracking-widest text-[#00f5d4]/85 uppercase">
          NeuralFlow · Topology Live
        </span>
      </div>

      <div className="absolute top-2.5 right-3 pointer-events-none z-10 text-[9px] font-mono text-slate-500 uppercase tracking-wider">
        60 FPS · Smooth 2D
      </div>

      {/* Interactive Tooltip Card */}
      {hoveredNode && (
        <div
          className="absolute pointer-events-none z-20 transform -translate-x-1/2 -translate-y-full mb-7 animate-in fade-in zoom-in-95 duration-100"
          style={{ left: tooltipPos.x, top: tooltipPos.y - 10 }}
        >
          <div className="bg-slate-950/92 backdrop-blur-md border border-[#00f5d4]/60 shadow-[0_0_20px_rgba(0,245,212,0.25)] rounded-lg p-3 w-56 text-xs font-sans text-slate-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-2">
              <span className="font-bold text-[#00f5d4] text-[13px]">
                {hoveredNode.name || `Node ${hoveredNode.nodeId || hoveredNode.id}`}
              </span>
              <span
                className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                  hoveredNode.isUnderAttack || hoveredNode.status === 'CRITICAL'
                    ? 'bg-red-950 text-red-400 border border-red-800'
                    : hoveredNode.status === 'WARNING'
                    ? 'bg-amber-950 text-amber-400 border border-amber-800'
                    : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                }`}
              >
                {hoveredNode.status || 'HEALTHY'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
              <div className="bg-slate-900/80 p-1.5 rounded border border-slate-800/80">
                <span className="text-slate-400 block text-[9px] uppercase">Latency</span>
                <span className="text-[#00f5d4] font-bold">
                  {Math.round(hoveredNode.latency ?? hoveredNode.metrics?.latency ?? 20)}ms
                </span>
              </div>

              <div className="bg-slate-900/80 p-1.5 rounded border border-slate-800/80">
                <span className="text-slate-400 block text-[9px] uppercase">Health</span>
                <span className="text-emerald-400 font-bold">
                  {Math.round(hoveredNode.health ?? hoveredNode.healthScore ?? 100)}/100
                </span>
              </div>

              <div className="bg-slate-900/80 p-1.5 rounded border border-slate-800/80">
                <span className="text-slate-400 block text-[9px] uppercase">CPU Load</span>
                <span className="text-indigo-300 font-bold">
                  {Math.round(hoveredNode.cpu ?? hoveredNode.metrics?.cpu ?? 15)}%
                </span>
              </div>

              <div className="bg-slate-900/80 p-1.5 rounded border border-slate-800/80">
                <span className="text-slate-400 block text-[9px] uppercase">Traffic</span>
                <span className="text-amber-400 font-bold">
                  {Math.round(hoveredNode.traffic ?? hoveredNode.trafficWeight ?? 33)}%
                </span>
              </div>
            </div>

            {hoveredNode.isUnderAttack && (
              <div className="mt-2 pt-1.5 border-t border-red-900/50 text-[10px] text-red-400 font-mono flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" />
                Target of active DDoS / Traffic Spike
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
