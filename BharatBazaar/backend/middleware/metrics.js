/* ===================================
   METRICS MIDDLEWARE
   Sliding-window RPS + latency + NeuralFlow-compatible output
   + Demo-only controlled degradation (this local instance only)
   =================================== */

// ── Sliding-window RPS (50 buckets × 100ms = 5-second window) ────────────────
const BUCKET_COUNT = 50;
const BUCKET_MS    = 100;
let buckets        = new Array(BUCKET_COUNT).fill(0);
let errorBuckets   = new Array(BUCKET_COUNT).fill(0);
let latencyBuckets = []; // Array of { timestamp: number, latency: number }
let currentBucketIdx = 0;
const delayedRequestTimers = new Set();

function clearRecentMetricsWindow() {
  currentBucketIdx = 0;
  buckets.fill(0);
  errorBuckets.fill(0);
  latencyBuckets = [];
}

setInterval(() => {
  currentBucketIdx = (currentBucketIdx + 1) % BUCKET_COUNT;
  buckets[currentBucketIdx]      = 0;
  errorBuckets[currentBucketIdx] = 0;
}, BUCKET_MS);

function getCurrentRPS() {
  return Math.round((buckets.reduce((a, b) => a + b, 0) / 5) * 10) / 10;
}

function getRecentErrorRate() {
  const totalReqs   = buckets.reduce((a, b) => a + b, 0);
  const totalErrors = errorBuckets.reduce((a, b) => a + b, 0);
  return totalReqs === 0 ? 0 : Math.round((totalErrors / totalReqs) * 100 * 10) / 10;
}

function getRecentLatency() {
  const now = Date.now();
  // Filter to keep only the last 5 seconds (5000ms) of latency measurements
  latencyBuckets = latencyBuckets.filter(item => now - item.timestamp < 5000);
  
  if (latencyBuckets.length === 0) return 0;
  return Math.round(latencyBuckets.reduce((sum, item) => sum + item.latency, 0) / latencyBuckets.length);
}
// ── Demo-only controlled degradation ─────────────────────────────────────────
// Only affects THIS process. Cannot be pointed at external systems.
const stressState = {
  active:          false,
  addedLatencyMs:  0,
  errorRateTarget: 0,
};
function setStress({ active, addedLatencyMs = 0, errorRateTarget = 0 }) {
  stressState.active          = !!active;
  stressState.addedLatencyMs  = active ? Math.min(Number(addedLatencyMs)  || 0, 2000) : 0;
  stressState.errorRateTarget = active ? Math.min(Number(errorRateTarget) || 0, 0.5)  : 0;

  if (!stressState.active) {
    delayedRequestTimers.forEach((timer) => clearTimeout(timer));
    delayedRequestTimers.clear();
    clearRecentMetricsWindow();
  }
}
function getStressState() { return { ...stressState }; }

// ── Lifetime counters ─────────────────────────────────────────────────────────
const lifetime = {
  totalRequests: 0,
  requestsPerEndpoint: {},
  responseTimes: [],
  errorCount: 0,
  startTime: Date.now(),
};

// ── Middleware ────────────────────────────────────────────────────────────────
function trackMetrics(req, res, next) {
  const startTime = Date.now();
  const endpoint  = req.path;

  const isInternal = endpoint === '/api/health'
    || endpoint === '/api/metrics'
    || endpoint === '/api/config'
    || endpoint === '/api/demo/stress';

  if (!isInternal) {
    buckets[currentBucketIdx]++;
    lifetime.totalRequests++;
    lifetime.requestsPerEndpoint[endpoint] = (lifetime.requestsPerEndpoint[endpoint] || 0) + 1;
  }

  req.stressWasActive = stressState.active;

  // Hook res.end — fires for ALL responses (res.json, res.send, res.sendFile, etc.)
  const origEnd = res.end.bind(res);
  res.end = function (...args) {
    if (!isInternal) {
      const rt = Date.now() - startTime;
      latencyBuckets.push({ timestamp: Date.now(), latency: rt });
      if (latencyBuckets.length > 500) latencyBuckets.shift();
      lifetime.responseTimes.push(rt);
      if (lifetime.responseTimes.length > 1000) lifetime.responseTimes.shift();
      if (res.statusCode >= 400) {
        lifetime.errorCount++;
        errorBuckets[currentBucketIdx]++;
      }
    }
    return origEnd(...args);
  };

  // ── WORKLOAD-DRIVEN DEGRADATION (truthful telemetry) ─────────────────────
  // When stress is enabled on this node, the node behaves like a real server
  // whose response time scales with ACTUAL incoming load:
  //
  //   SAFE_RPS = 12 req/s  → below this, delay = 0 → responses at native speed
  //   Above SAFE_RPS       → delay grows +perRpsMs per extra RPS, bounded
  //
  // The stress flag only ARM's the degradation model. It does NOT inject a
  // fixed artificial delay on every request. Therefore:
  //   MORE TRAFFIC  →  higher measured latency  (real workload)
  //   LESS TRAFFIC  →  lower measured latency   (natural recovery)
  //
  // After an AI reroute shifts traffic away, incoming RPS drops below the safe
  // threshold and the node naturally recovers — WITHOUT resetting anything.
  // The metrics endpoint therefore always reflects real current behavior.
  if (!isInternal && stressState.active) {
    const currentRPS = getCurrentRPS();
    const SAFE_RPS   = 12;

    let delay = 0;
    if (currentRPS > SAFE_RPS) {
      // addedLatencyMs = delay at ~35 RPS above safe capacity (bounded reference)
      const perRpsMs = (stressState.addedLatencyMs || 450) / 35;
      delay = Math.round((currentRPS - SAFE_RPS) * perRpsMs + (Math.random() * 10 - 5));
      delay = Math.max(0, Math.min(delay, 2000)); // safe upper bound
    }

    if (delay > 0) {
      if (stressState.errorRateTarget > 0 && delay > 250 && Math.random() < stressState.errorRateTarget) {
        // Return a real 503 for a portion of overloaded responses.
        // Error counting is handled exactly once by the res.end hook below.
        res.status(503).json({
          error: 'Service temporarily overloaded (high request load)',
          instanceId: process.env.INSTANCE_ID,
        });
        return;
      }
      const timer = setTimeout(() => {
        delayedRequestTimers.delete(timer);
        next();
      }, delay);
      delayedRequestTimers.add(timer);
      return;
    }
  }

  next();
}

// getMetrics — NeuralFlow-compatible output + full node identity
function getMetrics() {
  const INSTANCE_ID  = process.env.INSTANCE_ID || 'BB-NODE-1';
  const nodeIdNum    = parseInt(INSTANCE_ID.replace(/\D/g, '')) || 1;
  const REGION_MAP   = { 1: 'Mumbai', 2: 'Delhi', 3: 'Bangalore' };
  const BASE_LAT_MAP = { 1: 45,       2: 65,      3: 85 };
  const BASE_LATENCY = BASE_LAT_MAP[nodeIdNum] || 45;
  const REGION       = process.env.REGION || REGION_MAP[nodeIdNum] || 'Mumbai';

  const rps           = getCurrentRPS();
  const recentLatency = getRecentLatency() || BASE_LATENCY;
  const errRate       = getRecentErrorRate();
  const uptime        = Date.now() - lifetime.startTime;

  // Health score (same formula as appNode.js) — based on RECENT real latency
  const latScore = Math.max(0, 100 - (recentLatency - BASE_LATENCY) / 3);
  const errScore = Math.max(0, 100 - errRate * 5);
  const health   = Math.max(0, Math.min(100, Math.round(latScore * 0.7 + errScore * 0.3)));
  let   status   = health < 40 ? 'CRITICAL' : health < 70 ? 'WARNING' : 'HEALTHY';

  // Recent-window (5s) averages — these represent CURRENT behavior, not lifetime.
  // A previous stress burst must NOT keep these stale/contaminated forever.
  const recentErrorCount = errorBuckets.reduce((a, b) => a + b, 0);
  const recentTotalReq   = buckets.reduce((a, b) => a + b, 0);
  const recentAvg        = recentLatency;

  return {
    // ── NeuralFlow-required fields (all recent-window, truthful) ──────────
    nodeId:             nodeIdNum,
    name:               INSTANCE_ID,
    instanceId:         INSTANCE_ID,   // duplicate for compat
    location:           REGION,
    region:             REGION,
    version:            '1.0.0',
    service:            'BharatBazaar',
    latency:            recentLatency,
    requestsPerSecond:  rps,
    errorRate:          errRate,
    health,
    status,
    // ── Original fields kept for backwards compat ─────────────────────────
    timestamp:          new Date().toISOString(),
    totalRequests:      lifetime.totalRequests,
    requestsPerEndpoint: lifetime.requestsPerEndpoint,
    averageResponseTime: recentAvg,
    errorCount:         recentErrorCount,
    recentRequests:     recentTotalReq,
    uptime,
    uptimeFormatted:    formatUptime(uptime),
    stressActive:       stressState.active,
    stressLatencyMs:    stressState.addedLatencyMs,
  };
}

function resetMetrics() {
  lifetime.totalRequests = 0;
  lifetime.requestsPerEndpoint = {};
  lifetime.responseTimes = [];
  lifetime.errorCount    = 0;
  lifetime.startTime     = Date.now();
  delayedRequestTimers.forEach((timer) => clearTimeout(timer));
  delayedRequestTimers.clear();
  clearRecentMetricsWindow();
  setStress({ active: false });
}

function formatUptime(ms) {
  const s = Math.floor(ms / 1000), m = Math.floor(s / 60),
        h = Math.floor(m / 60),   d = Math.floor(h / 24);
  if (d > 0) return `${d}d ${h % 24}h`;
  if (h > 0) return `${h}h ${m % 60}m`;
  if (m > 0) return `${m}m ${s % 60}s`;
  return `${s}s`;
}

module.exports = { trackMetrics, getMetrics, resetMetrics, setStress, getStressState };
