// NodeSimulator.js - Wrapper to manage actual node child process and collect telemetry
import { fork } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class NodeSimulator {
  constructor(nodeId, name, location, baseTraffic) {
    this.nodeId = nodeId;
    this.name = name;
    this.location = location;
    this.baseTraffic = baseTraffic;
    this.port = 4000 + nodeId;

    // Metrics state
    this.metrics = {
      latency: nodeId === 1 ? 50 : nodeId === 2 ? 80 : 110,
      cpu: 1.0,
      memory: 30.0,
      errorRate: 0.0,
      requestsPerSecond: 0,
      health: 100,
      status: 'HEALTHY',
      traffic: baseTraffic
    };

    this.isUnderAttack = false;
    this.attackType = null;
    this.attackIntensity = 0;

    // Latency history for trend prediction (linear regression)
    this.latencyHistory = [];
    this.predictedBreach = null; // Countdown in seconds
    
    // Spawn actual child process
    const scriptPath = path.join(__dirname, 'appNode.js');
    console.log(`🤖 Spawning actual HTTP Node ${nodeId} (${name}) on port ${this.port}...`);
    this._spawnChild();

    // Start background telemetry polling
    this.pollInterval = setInterval(() => {
      this.pollMetrics();
    }, 1000);
  }

  _spawnChild() {
    const scriptPath = path.join(__dirname, 'appNode.js');
    if (this.child) return;
    this.child = fork(scriptPath, [this.nodeId, this.port, this.name, this.location]);

    this.child.on('error', (err) => {
      console.error(`❌ Node ${this.nodeId} process error:`, err);
    });

    this.child.on('exit', (code, signal) => {
      const wasChild = this.child;
      this.child = null;

      if (code === 2) {
        // EADDRINUSE — another process already owns this port. Mark node
        // unavailable, do NOT crash the backend, and retry in case the port frees.
        console.error(`❌ Node ${this.nodeId} (${this.name}) — port ${this.port} already in use. Node marked unavailable.`);
        this.metrics.health = 0;
        this.metrics.status = 'CRITICAL';
        this.metrics.latency = 9999;
        this.metrics.errorRate = 100;
        this.predictedBreach = null;
        if (this._retryTimer) clearTimeout(this._retryTimer);
        this._retryTimer = setTimeout(() => {
          if (!this.child) {
            console.log(`🔁 Retrying Node ${this.nodeId} (${this.name}) on port ${this.port}...`);
            this._spawnChild();
          }
        }, 5000);
      } else {
        console.log(`🔌 Node ${this.nodeId} process exited with code ${code}${signal ? ` signal ${signal}` : ''}`);
        if (wasChild && code !== 0) {
          // Unexpected death — try to restore the node after a short backoff.
          if (this._retryTimer) clearTimeout(this._retryTimer);
          this._retryTimer = setTimeout(() => {
            if (!this.child) {
              console.log(`🔁 Restarting Node ${this.nodeId} (${this.name}) on port ${this.port}...`);
              this._spawnChild();
            }
          }, 3000);
        }
      }
    });
  }

  // Poll metrics from the actual HTTP server process
  pollMetrics() {
    const url = `http://localhost:${this.port}/metrics`;
    
    http.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          if (res.statusCode === 200) {
            const parsed = JSON.parse(data);
            
            // Update node metrics
            this.metrics.cpu = parsed.cpu;
            this.metrics.memory = parsed.memory;
            this.metrics.latency = parsed.latency;
            this.metrics.errorRate = parsed.errorRate;
            this.metrics.requestsPerSecond = parsed.requestsPerSecond;
            this.metrics.health = parsed.health;
            this.metrics.status = parsed.status;
            
            // V4: Track last metrics update time for safety gate
            this.lastMetricsUpdate = Date.now();

            // Maintain latency history
            this.latencyHistory.push(parsed.latency);
            if (this.latencyHistory.length > 8) {
              this.latencyHistory.shift();
            }

            // Calculate prediction
            this.calculatePrediction();
          }
        } catch (err) {
          // Parse error
        }
      });
    }).on('error', (err) => {
      // Node is offline/unreachable
      this.metrics.health = 0;
      this.metrics.status = 'CRITICAL';
      this.metrics.latency = 9999;
      this.metrics.errorRate = 100;
      this.metrics.requestsPerSecond = 0;
      this.predictedBreach = null;
    });
  }

  // Linear regression trend prediction
  calculatePrediction() {
    const history = this.latencyHistory;
    const N = history.length;
    const CRITICAL_THRESHOLD = 300;

    if (N < 1) {
      this.predictedBreach = null;
      return;
    }

    const currentLatency = history[N - 1];

    // FAST PATH: latency already above critical threshold — breach is NOW
    if (currentLatency >= CRITICAL_THRESHOLD) {
      this.predictedBreach = 0;
      return;
    }

    // Need at least 3 points for trend prediction
    if (N < 3) {
      this.predictedBreach = null;
      return;
    }

    // Compute linear regression slope: y = mx + c
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    for (let i = 0; i < N; i++) {
      sumX += i;
      sumY += history[i];
      sumXY += i * history[i];
      sumXX += i * i;
    }
    const denom = (N * sumXX - sumX * sumX);
    const slope = denom !== 0 ? (N * sumXY - sumX * sumY) / denom : 0;

    // Predict breach if latency is elevated and rising
    if (currentLatency > 100 && slope > 5) {
      const secondsToBreach = (CRITICAL_THRESHOLD - currentLatency) / slope;
      if (secondsToBreach > 0 && secondsToBreach <= 30) {
        this.predictedBreach = Math.round(secondsToBreach);
        return;
      }
    }

    this.predictedBreach = null;
  }

  // Update loop called by server.js (10x per second)
  update() {
    // telemetries are fetched in pollInterval
  }

  // Adjust routing weight traffic
  adjustTraffic(delta) {
    this.metrics.traffic += delta;
    this.metrics.traffic = Math.max(0, Math.min(100, Math.round(this.metrics.traffic)));
  }

  startAttack(attackType, intensity = 75) {
    this.isUnderAttack = true;
    this.attackType = attackType;
    this.attackIntensity = intensity;
  }

  endAttack() {
    this.isUnderAttack = false;
    this.attackType = null;
    this.attackIntensity = 0;
    this.latencyHistory = [];
    this.predictedBreach = null;
  }

  getState() {
    return {
      nodeId: this.nodeId,
      name: this.name,
      location: this.location,
      latency: Math.round(this.metrics.latency),
      cpu: this.metrics.cpu,
      memory: this.metrics.memory,
      errorRate: this.metrics.errorRate,
      requestsPerSecond: this.metrics.requestsPerSecond,
      health: this.metrics.health,
      healthScore: this.metrics.health,       // alias for frontend
      status: this.metrics.status,
      traffic: this.metrics.traffic,
      trafficPercent: this.metrics.traffic,   // alias for frontend
      isUnderAttack: this.isUnderAttack,
      attackType: this.attackType,
      latencyTrend: this.latencyHistory.length >= 2 
        ? Math.round((this.metrics.latency - this.latencyHistory[this.latencyHistory.length - 2]) * 10) / 10 
        : 0,
      errorTrend: 0,
      predictedBreach: this.predictedBreach
    };
  }

  // Kill child process on shutdown
  destroy() {
    if (this._retryTimer) { clearTimeout(this._retryTimer); this._retryTimer = null; }
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }
    if (this.child) {
      const c = this.child;
      this.child = null;
      c.kill();
    }
  }
}

export default NodeSimulator;
