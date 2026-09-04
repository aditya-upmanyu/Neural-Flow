// ExternalNodeAdapter.js
// Wraps an external HTTP application instance (BharatBazaar) into the same
// interface as NodeSimulator so the NeuralFlow AI engine drives it unchanged.
//
// Key additions vs original:
//   - _poll() normalises BOTH the legacy bbNode shape AND the real BB shape
//   - startAttack() calls /api/demo/stress on the real instance (controlled, local only)
//   - endAttack()   calls /api/demo/stress {active:false} to remove stress

import http from 'http';

// Controlled stress parameters for the demo — bounded, safe values
const DEMO_STRESS = {
  addedLatencyMs:  450,   // adds 450ms to every non-telemetry response
  errorRateTarget: 0.05,  // 5% of requests will receive HTTP 503
};

class ExternalNodeAdapter {
  constructor(nodeId, name, location, baseTraffic, baseUrl) {
    this.nodeId      = nodeId;
    this.name        = name;
    this.location    = location;
    this.baseTraffic = baseTraffic;
    this.url         = typeof baseUrl === 'number' ? `http://localhost:${baseUrl}` : baseUrl;

    try {
      const u = new URL(this.url);
      this.hostname = u.hostname;
      this.port     = u.port || (u.protocol === 'https:' ? 443 : 80);
      this.protocol = u.protocol;
    } catch (_) {
      this.hostname = 'localhost';
      this.port     = baseUrl;
      this.protocol = 'http:';
    }

    // Base latency per node (used when offline or before first poll)
    this._baseLatency = nodeId === 1 ? 45 : nodeId === 2 ? 65 : 85;

    this.metrics = {
      latency:           this._baseLatency,
      cpu:               1.0,
      memory:            30.0,
      errorRate:         0.0,
      requestsPerSecond: 0,
      health:            100,
      status:            'HEALTHY',
      traffic:           baseTraffic,
    };

    this.isUnderAttack   = false;
    this.attackType      = null;
    this.attackIntensity = 0;
    this.latencyHistory  = [];
    this.predictedBreach = null;
    this._online         = false;
    this._resettingUntil = 0; // timestamp until which _poll() skips metric overwrite

    // Poll /api/metrics every 1 s
    this._pollInterval = setInterval(() => this._poll(), 1000);
    this._poll();
  }

  // ── Telemetry polling ──────────────────────────────────────────────────────
  _poll() {
    const req = http.get(
      { hostname: this.hostname, port: this.port, path: '/api/metrics', timeout: 2000 },
      (res) => {
        let raw = '';
        res.on('data', chunk => { raw += chunk; });
        res.on('end', () => {
          try {
            if (res.statusCode !== 200) return;
            const d = JSON.parse(raw);
            this._online = true;

            // ── Field normalisation ────────────────────────────────────────
            // Real BharatBazaar returns `latency`, `health`, `status`, `errorRate`, `requestsPerSecond`
            this.metrics.latency = (
              d.latency                              // primary
              ?? d.averageResponseTime               // older BB fallback
              ?? this.metrics.latency                // keep last known
            );

            this.metrics.requestsPerSecond = (
              d.requestsPerSecond ?? this.metrics.requestsPerSecond
            );

            if (d.errorRate !== undefined) {
              this.metrics.errorRate = d.errorRate;
            } else if (d.errorCount !== undefined && d.totalRequests > 0) {
              this.metrics.errorRate = Math.round((d.errorCount / d.totalRequests) * 100 * 10) / 10;
            }

            if (d.health !== undefined) {
              this.metrics.health = d.health;
              this.metrics.status = d.status || (d.health < 40 ? 'CRITICAL' : d.health < 70 ? 'WARNING' : 'HEALTHY');
            } else {
              const lat    = this.metrics.latency;
              const err    = this.metrics.errorRate;
              const latSc  = Math.max(0, 100 - (lat - this._baseLatency) / 3);
              const errSc  = Math.max(0, 100 - err * 5);
              const health = Math.max(0, Math.min(100, Math.round(latSc * 0.7 + errSc * 0.3)));
              this.metrics.health = health;
              this.metrics.status = health < 40 ? 'CRITICAL' : health < 70 ? 'WARNING' : 'HEALTHY';
            }

            this.metrics.cpu    = d.cpu    ?? this.metrics.cpu;
            this.metrics.memory = d.memory ?? this.metrics.memory;

            // Maintain latency history for the prediction engine
            this.latencyHistory.push(Math.round(this.metrics.latency));
            if (this.latencyHistory.length > 8) this.latencyHistory.shift();
            this._calculatePrediction();
          } catch (_) { /* parse error — keep last values */ }
        });
      }
    );

    req.on('error',   () => this._markOffline());
    req.on('timeout', () => { req.destroy(); this._markOffline(); });
  }

  _markOffline() {
    this._online                   = false;
    this.metrics.health            = 0;
    this.metrics.status            = 'CRITICAL';
    this.metrics.latency           = 9999;
    this.metrics.errorRate         = 100;
    this.metrics.requestsPerSecond = 0;
    this.predictedBreach           = null;
  }

  // ── Prediction (identical to NodeSimulator.calculatePrediction) ────────────
  _calculatePrediction() {
    const history = this.latencyHistory;
    const N = history.length;
    const THRESHOLD = 300;

    if (N < 1) { this.predictedBreach = null; return; }
    if (history[N - 1] >= THRESHOLD) { this.predictedBreach = 0; return; }
    if (N < 3)  { this.predictedBreach = null; return; }

    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    for (let i = 0; i < N; i++) {
      sumX += i; sumY += history[i]; sumXY += i * history[i]; sumXX += i * i;
    }
    const denom = N * sumXX - sumX * sumX;
    const slope = denom !== 0 ? (N * sumXY - sumX * sumY) / denom : 0;

    if (history[N - 1] > 100 && slope > 5) {
      const secs = (THRESHOLD - history[N - 1]) / slope;
      if (secs > 0 && secs <= 30) { this.predictedBreach = Math.round(secs); return; }
    }
    this.predictedBreach = null;
  }

  // ── Controlled stress: calls /api/demo/stress on THIS local instance only ──
  _callDemoStress(active, resetMetrics = false) {
    const body = JSON.stringify({
      active,
      addedLatencyMs:  DEMO_STRESS.addedLatencyMs,
      errorRateTarget: DEMO_STRESS.errorRateTarget,
      resetMetrics, // BB clears its sliding window when an attack is explicitly ended
    });

    const req = http.request(
      {
        hostname: this.hostname, port: this.port, path: '/api/demo/stress',
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
        timeout: 2000,
      },
      (res) => { res.resume(); }
    );
    req.on('error',   () => {});
    req.timeout = 2000;
    req.on('timeout', () => req.destroy());
    req.write(body);
    req.end();
  }

  // ── NodeSimulator-compatible API ───────────────────────────────────────────
  update() { /* polling handled by setInterval */ }

  startAttack(attackType, intensity) {
    this.isUnderAttack   = true;
    this.attackType      = attackType;
    this.attackIntensity = intensity;
    this._callDemoStress(true);
  }

  endAttack() {
    this.isUnderAttack   = false;
    this.attackType      = null;
    this.attackIntensity = 0;
    this.latencyHistory  = [];
    this.predictedBreach = null;
    this._callDemoStress(false, true);
  }

  getState() {
    return {
      nodeId:            this.nodeId,
      name:              this.name,
      location:          this.location,
      latency:           Math.round(this.metrics.latency),
      cpu:               this.metrics.cpu,
      memory:            this.metrics.memory,
      errorRate:         this.metrics.errorRate,
      requestsPerSecond: this.metrics.requestsPerSecond,
      health:            this.metrics.health,
      healthScore:       this.metrics.health,
      status:            this.metrics.status,
      traffic:           this.metrics.traffic,
      trafficPercent:    this.metrics.traffic,
      isUnderAttack:     this.isUnderAttack,
      attackType:        this.attackType,
      latencyTrend:      this.latencyHistory.length >= 2
        ? Math.round((this.metrics.latency - this.latencyHistory[this.latencyHistory.length - 2]) * 10) / 10
        : 0,
      errorTrend:        0,
      predictedBreach:   this.predictedBreach,
      online:            this._online,
      externalPort:      this.port,
      baseUrl:           this.url,
    };
  }

  destroy() {
    if (this._pollInterval) { clearInterval(this._pollInterval); this._pollInterval = null; }
    // Ensure stress is cleared when NeuralFlow shuts down
    this._callDemoStress(false);
  }
}

export default ExternalNodeAdapter;
