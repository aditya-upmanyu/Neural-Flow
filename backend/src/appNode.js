import http from 'http';

const nodeId = parseInt(process.argv[2]) || 1;
const port = parseInt(process.argv[3]) || 4001;
const name = process.argv[4] || `Node ${nodeId}`;
const location = process.argv[5] || 'US Server';

// Base latency per node
const baseLatency = nodeId === 1 ? 50 : nodeId === 2 ? 80 : 110;

// ============================================================================
// METRICS SLIDING WINDOW (5-second window of 100ms buckets)
// ============================================================================
const BUCKET_COUNT = 50;       // 50 buckets × 100ms = 5 second window
const BUCKET_MS = 100;         // Each bucket = 100ms

let buckets = new Array(BUCKET_COUNT).fill(0);       // request counts per bucket
let errorBuckets = new Array(BUCKET_COUNT).fill(0);  // error counts per bucket
let currentBucketIndex = 0;

let totalProcessedRequests = 0;
let totalErrors = 0;

// Rotate buckets every 100ms
setInterval(() => {
  currentBucketIndex = (currentBucketIndex + 1) % BUCKET_COUNT;
  buckets[currentBucketIndex] = 0;  // clear the oldest request bucket
  errorBuckets[currentBucketIndex] = 0;  // clear the oldest error bucket
}, BUCKET_MS);

// Compute current RPS from all buckets (total requests in last 5 seconds divided by 5)
function getCurrentRPS() {
  const total = buckets.reduce((a, b) => a + b, 0);
  return Math.round((total / 5) * 10) / 10;
}

// Compute recent error rate (percentage of errors in the last 5 seconds)
function getRecentErrorRate() {
  const totalRequests = buckets.reduce((a, b) => a + b, 0);
  const totalErrorsInWindow = errorBuckets.reduce((a, b) => a + b, 0);
  if (totalRequests === 0) return 0;
  return Math.round((totalErrorsInWindow / totalRequests) * 100 * 10) / 10;
}

// ============================================================================
// CPU MEASUREMENT
// ============================================================================
let lastCpuUsage = process.cpuUsage();
let lastCpuTime = Date.now();
let cpuPercentage = 0;

setInterval(() => {
  const currentUsage = process.cpuUsage(lastCpuUsage);
  const currentTime = Date.now();
  const timeDiffMs = currentTime - lastCpuTime;
  if (timeDiffMs > 0) {
    const totalUsageMs = (currentUsage.user + currentUsage.system) / 1000;
    cpuPercentage = Math.min(100, Math.round((totalUsageMs / timeDiffMs) * 100 * 10) / 10);
  }
  lastCpuUsage = process.cpuUsage();
  lastCpuTime = currentTime;
}, 1000);

// ============================================================================
// HTTP SERVER
// ============================================================================
const server = http.createServer((req, res) => {
  // Exclude health check and metrics from counting in RPS and error rates
  const isInternal = req.url === '/health' || req.url === '/metrics';

  if (!isInternal) {
    buckets[currentBucketIndex]++;
    totalProcessedRequests++;
  }

  const currentRPS = getCurrentRPS();
  let latency = baseLatency;

  // Degradation model:
  // Safe threshold = 15 req/s. Above that, latency rises +8ms per extra RPS.
  // This creates fast, visible degradation for hackathon demo.
  // Capped at 2000ms so extreme RPS can never produce runaway values —
  // latency stays workload-driven (monotonic in RPS) but bounded.
  if (currentRPS > 15) {
    latency += Math.min(2000, (currentRPS - 15) * 8);
  }

  // Jitter ±8ms
  latency += Math.random() * 16 - 8;
  latency = Math.max(10, Math.round(latency));

  // Error rate: starts at latency > 250ms, reaches 50% at 600ms
  let shouldFail = false;
  let statusCode = 200;

  if (latency > 250 && !isInternal) {
    const failChance = Math.min(0.5, (latency - 250) / 700);
    if (Math.random() < failChance) {
      shouldFail = true;
      statusCode = 503;
      errorBuckets[currentBucketIndex]++;
      totalErrors++;
    }
  }

  const sendResponse = () => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');

    if (req.url === '/health') {
      res.writeHead(200);
      res.end(JSON.stringify({ status: 'healthy', nodeId }));
      return;
    }

    if (req.url === '/metrics') {
      const memory = process.memoryUsage();
      const memoryMB = Math.round(memory.rss / 1024 / 1024 * 10) / 10;

      const recentErrorRate = getRecentErrorRate();

      // Health score: latency-weighted (50%), CPU (30%), errors (20%)
      // Compare latency to node-specific baseLatency rather than a hardcoded 50ms
      const latencyScore = Math.max(0, 100 - (latency - baseLatency) / 3);
      const cpuScore = Math.max(0, 100 - cpuPercentage * 2.5);
      const errorScore = Math.max(0, 100 - recentErrorRate * 5);
      const health = Math.round(latencyScore * 0.5 + cpuScore * 0.3 + errorScore * 0.2);
      const healthClamped = Math.max(0, Math.min(100, health));

      let status = 'HEALTHY';
      if (healthClamped < 40) status = 'CRITICAL';
      else if (healthClamped < 70) status = 'WARNING';

      res.writeHead(200);
      res.end(JSON.stringify({
        nodeId,
        name,
        location,
        cpu: cpuPercentage,
        memory: memoryMB,
        latency,
        errorRate: recentErrorRate,
        requestsPerSecond: Math.round(currentRPS),
        health: healthClamped,
        status
      }));
      return;
    }

    // All other paths
    res.writeHead(statusCode);
    res.end(JSON.stringify({
      success: !shouldFail,
      nodeId,
      message: shouldFail ? 'Service Unavailable' : 'Response from node application.'
    }));
  };

  // Simulate actual processing delay = computed latency (internal telemetry endpoints are not delayed)
  if (latency > 10 && !isInternal) {
    setTimeout(sendResponse, latency);
  } else {
    sendResponse();
  }
});

// Graceful EADDRINUSE handling — never let a duplicate child crash the parent.
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Node ${nodeId} (${name}) — EADDRINUSE: port ${port} already in use. Exiting (code 2).`);
    process.exit(2);
  }
  console.error(`❌ Node ${nodeId} (${name}) — server error: ${err.message}`);
  process.exit(1);
});

server.listen(port, () => {
  console.log(`🟢 ${name} listening on port ${port}`);
});
