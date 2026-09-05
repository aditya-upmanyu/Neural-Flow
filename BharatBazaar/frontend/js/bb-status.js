/**
 * bb-status.js  — BharatBazaar Live Node Status Bar
 *
 * Polls /api/metrics every 800 ms and renders a sticky status bar that
 * shows real-time latency, RPS, health and stress state.
 *
 * When stress is ACTIVE (NFV3 attack in progress) the page enters
 * "attack mode": the bar turns red, a slow-pulse overlay appears, and
 * a visible DEGRADED banner lets anyone watching the site immediately
 * see the slowdown — and then see it disappear after NFV3 reroutes.
 */

(function () {
  'use strict';

  /* ── 1. INJECT CSS ──────────────────────────────────────────────────────── */
  const CSS = `
    /* ── Status bar ──────────────────────────────────────────────────── */
    #bb-status-bar {
      position: fixed;
      top: 0; left: 0; right: 0;
      z-index: 99999;
      height: 36px;
      display: flex;
      align-items: center;
      gap: 0;
      font-family: 'Segoe UI', system-ui, sans-serif;
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.3px;
      background: #0f1117;
      border-bottom: 2px solid #2a2a3e;
      transition: background 0.5s, border-color 0.5s;
      overflow: hidden;
    }
    #bb-status-bar.attack {
      background: #1a0505;
      border-bottom-color: #ff2244;
      animation: bb-bar-flash 1.8s ease-in-out infinite;
    }
    @keyframes bb-bar-flash {
      0%,100% { background: #1a0505; }
      50%      { background: #2d0808; }
    }

    /* left brand pill */
    #bb-status-brand {
      padding: 0 14px;
      height: 100%;
      display: flex;
      align-items: center;
      gap: 6px;
      background: rgba(255,107,53,.12);
      border-right: 1px solid rgba(255,107,53,.2);
      color: #ff6b35;
      white-space: nowrap;
      flex-shrink: 0;
    }
    #bb-status-brand .brand-dot-s {
      width: 7px; height: 7px;
      border-radius: 50%;
      background: #ff6b35;
      animation: bb-pulse 2s ease-in-out infinite;
      flex-shrink: 0;
    }
    @keyframes bb-pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(1.4)} }

    /* metrics strip */
    #bb-status-metrics {
      display: flex;
      align-items: center;
      gap: 0;
      flex: 1;
      height: 100%;
      overflow: hidden;
    }
    .bb-metric {
      display: flex;
      align-items: center;
      gap: 5px;
      padding: 0 14px;
      height: 100%;
      border-right: 1px solid rgba(255,255,255,.06);
      white-space: nowrap;
      flex-shrink: 0;
    }
    .bb-metric-label {
      color: #5a5a7a;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .bb-metric-value {
      color: #e0e0f0;
      transition: color 0.4s;
    }
    .bb-metric-value.warn  { color: #f7c94e; }
    .bb-metric-value.crit  { color: #ff4466; }
    .bb-metric-value.good  { color: #22dd88; }

    /* latency bar */
    #bb-latency-bar-wrap {
      padding: 0 14px;
      height: 100%;
      display: flex;
      align-items: center;
      gap: 8px;
      border-right: 1px solid rgba(255,255,255,.06);
      flex-shrink: 0;
      min-width: 180px;
    }
    #bb-latency-bar-wrap .bb-metric-label { flex-shrink: 0; }
    #bb-latency-track {
      width: 100px;
      height: 6px;
      background: rgba(255,255,255,.08);
      border-radius: 4px;
      overflow: hidden;
    }
    #bb-latency-fill {
      height: 100%;
      border-radius: 4px;
      background: #22dd88;
      transition: width 0.6s ease, background 0.4s;
    }
    #bb-latency-ms {
      color: #e0e0f0;
      font-size: 11px;
      font-weight: 700;
      min-width: 38px;
      text-align: right;
      transition: color 0.4s;
    }

    /* right status badge */
    #bb-status-badge {
      margin-left: auto;
      margin-right: 0;
      padding: 0 20px;
      height: 100%;
      display: flex;
      align-items: center;
      gap: 7px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.6px;
      text-transform: uppercase;
      flex-shrink: 0;
      transition: background 0.4s, color 0.4s;
      background: rgba(34,221,136,.1);
      color: #22dd88;
      border-left: 1px solid rgba(34,221,136,.2);
    }
    #bb-status-badge.warn {
      background: rgba(247,201,78,.1);
      color: #f7c94e;
      border-left-color: rgba(247,201,78,.25);
    }
    #bb-status-badge.crit {
      background: rgba(255,36,68,.15);
      color: #ff4466;
      border-left-color: rgba(255,36,68,.3);
      animation: bb-badge-flash 0.9s ease-in-out infinite;
    }
    @keyframes bb-badge-flash { 0%,100%{opacity:1} 50%{opacity:.55} }
    #bb-status-badge .status-dot {
      width: 6px; height: 6px;
      border-radius: 50%;
      background: currentColor;
      flex-shrink: 0;
    }

    /* instance selector tabs */
    #bb-node-tabs {
      display: flex;
      align-items: center;
      gap: 0;
      height: 100%;
      border-right: 1px solid rgba(255,255,255,.06);
      flex-shrink: 0;
    }
    .bb-node-tab {
      padding: 0 12px;
      height: 100%;
      display: flex;
      align-items: center;
      gap: 5px;
      cursor: pointer;
      color: #5a5a7a;
      transition: color 0.2s, background 0.2s;
      font-size: 11px;
      border-right: 1px solid rgba(255,255,255,.04);
      user-select: none;
    }
    .bb-node-tab:hover { color: #ccc; background: rgba(255,255,255,.04); }
    .bb-node-tab.active { color: #ff6b35; background: rgba(255,107,53,.08); }
    .bb-node-tab .node-dot {
      width: 6px; height: 6px;
      border-radius: 50%;
      background: #3a3a5a;
      transition: background 0.3s;
      flex-shrink: 0;
    }
    .bb-node-tab .tab-region {
      font-size: 10px;
      font-weight: 500;
      color: #4a4a6a;
      margin-left: 2px;
    }
    .bb-node-tab.active .tab-region { color: rgba(255,107,53,.7); }
    .bb-node-tab.healthy .node-dot  { background: #22dd88; }
    .bb-node-tab.warning .node-dot  { background: #f7c94e; }
    .bb-node-tab.critical .node-dot { background: #ff4466; animation: bb-badge-flash .7s ease-in-out infinite; }

    /* ── Attack overlay ──────────────────────────────────────────────── */
    #bb-attack-overlay {
      position: fixed;
      inset: 0;
      z-index: 99990;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.6s;
    }
    #bb-attack-overlay.active { opacity: 1; }

    /* red vignette */
    #bb-attack-overlay::before {
      content: '';
      position: absolute;
      inset: 0;
      background: radial-gradient(ellipse at center, transparent 40%, rgba(180,0,30,.18) 100%);
      animation: bb-vignette-pulse 2s ease-in-out infinite;
    }
    @keyframes bb-vignette-pulse { 0%,100%{opacity:.7} 50%{opacity:1} }

    /* ── Attack banner ───────────────────────────────────────────────── */
    #bb-attack-banner {
      position: fixed;
      top: 36px; /* sit right below the status bar */
      left: 0; right: 0;
      z-index: 99998;
      transform: translateY(-100%);
      transition: transform 0.45s cubic-bezier(.22,1,.36,1);
      background: linear-gradient(90deg, #1a0000, #2d0808 40%, #1a0000);
      border-bottom: 1px solid rgba(255,36,68,.4);
      padding: 0 24px;
      height: 44px;
      display: flex;
      align-items: center;
      gap: 12px;
      font-family: 'Segoe UI', system-ui, sans-serif;
      font-size: 13px;
      font-weight: 700;
      color: #ff4466;
      letter-spacing: 0.4px;
    }
    #bb-attack-banner.show { transform: translateY(0); }
    #bb-attack-banner .warn-icon {
      font-size: 16px;
      animation: bb-badge-flash .8s ease-in-out infinite;
    }
    #bb-attack-banner .bb-live-latency {
      margin-left: auto;
      font-size: 11px;
      font-weight: 800;
      color: #ff6644;
      background: rgba(255,100,68,.12);
      padding: 3px 10px;
      border-radius: 20px;
      border: 1px solid rgba(255,100,68,.25);
    }
    #bb-attack-banner .recovery-note {
      font-size: 11px;
      color: #ff8866;
      font-weight: 600;
    }

    /* ── Recovery banner ─────────────────────────────────────────────── */
    #bb-recovery-banner {
      position: fixed;
      top: 36px;
      left: 0; right: 0;
      z-index: 99998;
      transform: translateY(-100%);
      transition: transform 0.45s cubic-bezier(.22,1,.36,1);
      background: linear-gradient(90deg, #001a0a, #002d12 40%, #001a0a);
      border-bottom: 1px solid rgba(34,221,136,.3);
      padding: 0 24px;
      height: 44px;
      display: flex;
      align-items: center;
      gap: 12px;
      font-family: 'Segoe UI', system-ui, sans-serif;
      font-size: 13px;
      font-weight: 700;
      color: #22dd88;
      letter-spacing: 0.4px;
    }
    #bb-recovery-banner.show { transform: translateY(0); }

    /* ── Page body nudge (so content isn't hidden under the bar) ──────── */
    body.bb-status-active {
      padding-top: 36px !important;
    }
    body.bb-banner-active {
      padding-top: 80px !important;
    }

    /* ── Slow-loading shimmer (on stressed elements) ─────────────────── */
    body.bb-under-attack img,
    body.bb-under-attack .product-card,
    body.bb-under-attack .feature-card {
      filter: brightness(0.92) saturate(0.85);
      transition: filter 0.8s;
    }
    body.bb-under-attack .hero h1,
    body.bb-under-attack .brand {
      animation: bb-text-flicker 3s ease-in-out infinite;
    }
    @keyframes bb-text-flicker {
      0%,90%,100%{opacity:1} 92%{opacity:.7} 96%{opacity:.9} 98%{opacity:.65}
    }
  `;

  const styleEl = document.createElement('style');
  styleEl.textContent = CSS;
  document.head.appendChild(styleEl);

  /* ── 2. INJECT HTML ─────────────────────────────────────────────────────── */
  const BAR_HTML = `
    <div id="bb-status-bar">
      <div id="bb-status-brand">
        <div class="brand-dot-s"></div>
        <span>BB LIVE</span>
      </div>

      <div id="bb-node-tabs">
        <div class="bb-node-tab active" data-port="5001" data-name="BB-NODE-1 · Mumbai">
          <div class="node-dot"></div>NODE-1 <span class="tab-region">Mumbai</span>
        </div>
        <div class="bb-node-tab" data-port="5002" data-name="BB-NODE-2 · Delhi">
          <div class="node-dot"></div>NODE-2 <span class="tab-region">Delhi</span>
        </div>
        <div class="bb-node-tab" data-port="5003" data-name="BB-NODE-3 · Bangalore">
          <div class="node-dot"></div>NODE-3 <span class="tab-region">Bangalore</span>
        </div>
      </div>

      <div id="bb-latency-bar-wrap">
        <span class="bb-metric-label">LATENCY</span>
        <div id="bb-latency-track"><div id="bb-latency-fill"></div></div>
        <span id="bb-latency-ms">—</span>
      </div>

      <div id="bb-status-metrics">
        <div class="bb-metric">
          <span class="bb-metric-label">RPS</span>
          <span class="bb-metric-value" id="bb-rps">—</span>
        </div>
        <div class="bb-metric">
          <span class="bb-metric-label">ERRORS</span>
          <span class="bb-metric-value" id="bb-errors">—</span>
        </div>
        <div class="bb-metric">
          <span class="bb-metric-label">HEALTH</span>
          <span class="bb-metric-value" id="bb-health">—</span>
        </div>
        <div class="bb-metric">
          <span class="bb-metric-label">UPTIME</span>
          <span class="bb-metric-value" id="bb-uptime">—</span>
        </div>
      </div>

      <div id="bb-status-badge">
        <div class="status-dot"></div>
        <span id="bb-status-text">CONNECTING</span>
      </div>
    </div>

    <div id="bb-attack-banner">
      <span class="warn-icon">⚠</span>
      <span id="bb-attack-banner-text">Node under attack — high latency detected</span>
      <span class="recovery-note" id="bb-recovery-note"></span>
      <span class="bb-live-latency" id="bb-banner-latency"></span>
    </div>

    <div id="bb-recovery-banner">
      <span>✅</span>
      <span id="bb-recovery-text">NFV3 rerouted traffic — node recovering</span>
    </div>

    <div id="bb-attack-overlay"></div>
  `;

  document.body.insertAdjacentHTML('afterbegin', BAR_HTML);
  document.body.classList.add('bb-status-active');

  /* ── 3. STATE ───────────────────────────────────────────────────────────── */
  const NODES = [
    { port: 5001, name: 'BB-NODE-1', region: 'Mumbai'    },
    { port: 5002, name: 'BB-NODE-2', region: 'Delhi'     },
    { port: 5003, name: 'BB-NODE-3', region: 'Bangalore' },
  ];

  // Determine which node this page instance IS (based on window.location.port)
  // Falls back to letting the user click tabs to watch any node.
  const myPort = parseInt(window.location.port, 10) || 5001;
  let activePort = myPort;

  // cache last metrics per node
  const cache = {};
  NODES.forEach(n => { cache[n.port] = null; });

  let wasUnderAttack  = false;
  let recoveryTimeout = null;

  /* ── 4. DOM REFS ────────────────────────────────────────────────────────── */
  const bar            = document.getElementById('bb-status-bar');
  const badge          = document.getElementById('bb-status-badge');
  const statusText     = document.getElementById('bb-status-text');
  const latencyFill    = document.getElementById('bb-latency-fill');
  const latencyMs      = document.getElementById('bb-latency-ms');
  const rpsEl          = document.getElementById('bb-rps');
  const errorsEl       = document.getElementById('bb-errors');
  const healthEl       = document.getElementById('bb-health');
  const uptimeEl       = document.getElementById('bb-uptime');
  const overlay        = document.getElementById('bb-attack-overlay');
  const attackBanner   = document.getElementById('bb-attack-banner');
  const attackBannerTx = document.getElementById('bb-attack-banner-text');
  const recoveryNote   = document.getElementById('bb-recovery-note');
  const bannerLatency  = document.getElementById('bb-banner-latency');
  const recoveryBanner = document.getElementById('bb-recovery-banner');
  const recoveryText   = document.getElementById('bb-recovery-text');
  const tabs           = document.querySelectorAll('.bb-node-tab');

  /* ── 5. NODE TABS ───────────────────────────────────────────────────────── */
  // Highlight the tab matching the current server port
  tabs.forEach(tab => {
    const p = parseInt(tab.dataset.port, 10);
    if (p === myPort) tab.classList.add('active');
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      activePort = p;
      if (cache[p]) renderMetrics(cache[p]);
    });
  });

  /* ── 6. RENDER ──────────────────────────────────────────────────────────── */
  function latencyColor(ms) {
    if (ms >= 400) return 'crit';
    if (ms >= 150) return 'warn';
    return 'good';
  }
  function healthClass(h) {
    if (h < 40) return 'crit';
    if (h < 70) return 'warn';
    return 'good';
  }

  function renderMetrics(m) {
    // ── latency bar ──
    const lat     = m.latency || 0;
    const pct     = Math.min(100, (lat / 800) * 100); // 800ms = full bar
    const latCls  = latencyColor(lat);
    const barColor = latCls === 'good' ? '#22dd88' : latCls === 'warn' ? '#f7c94e' : '#ff4466';
    latencyFill.style.width     = pct + '%';
    latencyFill.style.background = barColor;
    latencyMs.textContent       = lat + 'ms';
    latencyMs.style.color       = barColor;

    // ── rps ──
    rpsEl.textContent = (m.requestsPerSecond || 0).toFixed(1);
    rpsEl.className   = 'bb-metric-value ' + (m.requestsPerSecond > 30 ? 'warn' : '');

    // ── errors ──
    const err = m.errorRate || 0;
    errorsEl.textContent = err.toFixed(1) + '%';
    errorsEl.className   = 'bb-metric-value ' + (err > 5 ? 'crit' : err > 1 ? 'warn' : 'good');

    // ── health ──
    const hc = healthClass(m.health || 0);
    healthEl.textContent = (m.health || 0) + '%';
    healthEl.className   = 'bb-metric-value ' + hc;

    // ── uptime ──
    uptimeEl.textContent = m.uptimeFormatted || '—';
    uptimeEl.className   = 'bb-metric-value';

    // ── badge ──
    const st = (m.status || 'UNKNOWN').toUpperCase();
    statusText.textContent = m.stressActive ? '⚡ UNDER ATTACK' : st;
    badge.className = st === 'HEALTHY' && !m.stressActive ? '' :
                      st === 'CRITICAL' || m.stressActive  ? 'crit' : 'warn';

    // ── tab dot colors ──
    tabs.forEach(tab => {
      const p  = parseInt(tab.dataset.port, 10);
      const nc = cache[p];
      tab.className = 'bb-node-tab' + (p === activePort ? ' active' : '');
      if (nc) {
        const s = (nc.status || '').toUpperCase();
        const cls = s === 'HEALTHY' ? 'healthy' : s === 'WARNING' ? 'warning' : nc.stressActive ? 'critical' : 'healthy';
        tab.classList.add(cls);
      }
    });

    // ── attack mode ──────────────────────────────────────────────────
    const isAttacked = !!(m.stressActive || lat >= 300 || (m.health || 0) < 50);

    if (isAttacked && !wasUnderAttack) {
      // attack STARTED
      wasUnderAttack = true;
      clearTimeout(recoveryTimeout);
      bar.classList.add('attack');
      overlay.classList.add('active');
      document.body.classList.add('bb-under-attack');
      recoveryBanner.classList.remove('show');
      const nodeLabel = (m.instanceId || m.name || 'BB-NODE') + (m.region ? ' · ' + m.region : '');
      attackBannerTx.textContent = `${nodeLabel} under attack — high latency detected`;
      attackBanner.classList.add('show');
      document.body.classList.add('bb-banner-active');
    }

    if (isAttacked) {
      bannerLatency.textContent = lat + 'ms ↑';
      const rpsNow = m.requestsPerSecond || 0;
      recoveryNote.textContent = rpsNow > 0 ? `${rpsNow.toFixed(0)} req/s hitting node` : '';
    }

    if (!isAttacked && wasUnderAttack) {
      // attack ENDED — show recovery
      wasUnderAttack = false;
      bar.classList.remove('attack');
      overlay.classList.remove('active');
      document.body.classList.remove('bb-under-attack');
      attackBanner.classList.remove('show');

      recoveryText.textContent = `NFV3 rerouted traffic — ${(m.instanceId || m.name || 'node')} · ${m.region || ''} recovered (${lat}ms)`;
      recoveryBanner.classList.add('show');

      recoveryTimeout = setTimeout(() => {
        recoveryBanner.classList.remove('show');
        document.body.classList.remove('bb-banner-active');
      }, 5000);
    }
  }

  /* ── 7. POLL ────────────────────────────────────────────────────────────── */
  let consecutiveFails = 0;

  async function poll() {
    // Always fetch the current node AND poll all nodes (for tab dots)
    await Promise.all(NODES.map(async ({ port }) => {
      try {
        const res  = await fetch(`http://localhost:${port}/api/metrics`, { cache: 'no-store' });
        if (!res.ok) throw new Error('non-200');
        const data = await res.json();
        cache[port] = data;

        // Update tab dot for this node
        const tab = document.querySelector(`.bb-node-tab[data-port="${port}"]`);
        if (tab) {
          const s = (data.status || '').toUpperCase();
          const cls = data.stressActive ? 'critical' :
                      s === 'CRITICAL'  ? 'critical' :
                      s === 'WARNING'   ? 'warning'  : 'healthy';
          tab.className = 'bb-node-tab' + (port === activePort ? ' active' : '') + ' ' + cls;
        }
      } catch (_) {
        // node offline
        const tab = document.querySelector(`.bb-node-tab[data-port="${port}"]`);
        if (tab) tab.className = 'bb-node-tab' + (port === activePort ? ' active' : '') + ' critical';
      }
    }));

    // Render the ACTIVE node
    const m = cache[activePort];
    if (m) {
      consecutiveFails = 0;
      renderMetrics(m);
    } else {
      consecutiveFails++;
      statusText.textContent = consecutiveFails > 3 ? 'OFFLINE' : 'CONNECTING…';
      badge.className = 'crit';
    }
  }

  // First paint immediately, then every 800 ms
  poll();
  setInterval(poll, 800);

})();
