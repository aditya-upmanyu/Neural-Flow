// NFV5 Sentinel - Telemetry Monitoring & Anomaly Detection
// Continuously monitors telemetry and identifies abnormal behavior

import { validateTelemetry } from '../contracts/index.js';
import { createEvent, EVENT_TYPES, SEVERITY } from '../core/index.js';

/**
 * Sentinel monitors telemetry and detects anomalies
 */
export class Sentinel {
  constructor(arg1, arg2) {
    // Flexible constructor: can take (neuralAgent, eventStore) or (eventStore, neuralAgent)
    if (arg1 && typeof arg1.isTrained !== 'undefined') {
      this.neuralAgent = arg1;
      this.eventStore = arg2;
    } else {
      this.eventStore = arg1;
      this.neuralAgent = arg2;
    }
    this.baselineWindow = 20; // Samples for baseline calculation
    this.baselineData = new Map(); // nodeId → samples[]
  }

  setNeuralAgent(agent) {
    this.neuralAgent = agent;
  }

  /**
   * Helper to detect anomaly from a node object
   * @param {object} node - Node simulator or node state
   * @param {object} [agentML] - Optional neural agent override
   * @returns {object} - Detection result
   */
  async detect(node, agentML = null) {
    const agent = agentML || this.neuralAgent;
    const st = typeof node.getState === 'function' ? node.getState() : node;
    const telemetry = {
      timestamp: Date.now(),
      nodeId: node.nodeId || st.nodeId || 1,
      latency: Math.max(0, st.latency || 0),
      errorRate: Math.max(0, st.errorRate || 0),
      requestsPerSecond: Math.max(0, st.requestsPerSecond || 0),
      cpu: Math.max(0, st.cpu || 0),
      memory: Math.max(0, st.memory || 0),
      health: Math.max(0, st.health || 0),
      status: (st.status || 'HEALTHY').toUpperCase(),
      connections: st.connections || 0,
      throughput: st.throughput || 0,
      source: 'INTERNAL',
    };

    if (telemetry.status === 'HEALTHY' && telemetry.health < 60) {
      telemetry.status = telemetry.health < 30 ? 'CRITICAL' : 'WARNING';
    }

    return this.processTelemetry(telemetry, agent);
  }

  /**
   * Process incoming telemetry from a node
   * @param {object} telemetry - Raw telemetry data
   * @param {object} [agent] - Neural agent override
   * @returns {object} - Detection result
   */
  processTelemetry(telemetry, agent = null) {
    try {
      // Validate telemetry shape
      const validated = validateTelemetry(telemetry);
      const { nodeId, timestamp } = validated;
      const mlAgent = agent || this.neuralAgent;

      // Update baseline for this node
      this._updateBaseline(nodeId, validated);

      // Calculate deviation from baseline
      const baseline = this._getBaseline(nodeId);
      const deviation = baseline ? this._calculateDeviation(validated, baseline) : null;

      // Run ML anomaly detection
      const mlResult = (mlAgent && mlAgent.isTrained)
        ? mlAgent.predict({
            latency: validated.latency,
            errorRate: validated.errorRate,
            queueSize: 0,
            cpuUsage: validated.cpu,
            memoryUsage: validated.memory,
            requestsPerSecond: validated.requestsPerSecond,
            latencyTrend: 0,
            errorTrend: 0,
          })
        : { classification: 'NORMAL', confidence: 0.5, attackProbability: 0 };

      // Determine if anomaly detected
      const isAnomaly = this._isAnomaly(validated, deviation, mlResult);

      // If anomaly detected, emit anomaly event
      if (isAnomaly && this.eventStore) {
        const anomalyEvent = createEvent(EVENT_TYPES.ANOMALY_DETECTED, {
          nodeId,
          message: `Anomaly detected on node ${nodeId}: ${validated.status} (latency: ${validated.latency}ms, health: ${validated.health}%)`,
          severity: this._mapStatusToSeverity(validated.status),
          data: {
            telemetry: validated,
            baseline,
            deviation,
            mlClassification: mlResult.classification,
            mlConfidence: mlResult.confidence,
            attackProbability: mlResult.attackProbability,
          },
        });

        this.eventStore.addEvent(
          anomalyEvent.type,
          anomalyEvent.nodeId,
          anomalyEvent.message,
          anomalyEvent.severity,
          anomalyEvent.data
        );
      }

      return {
        nodeId,
        timestamp,
        isAnomaly,
        isAnomalous: isAnomaly,
        telemetry: validated,
        baseline,
        deviation,
        mlResult,
      };

    } catch (error) {
      console.error('[Sentinel] Telemetry processing error:', error.message);
      return {
        error: error.message,
        isAnomaly: false,
        isAnomalous: false,
      };
    }
  }

  /**
   * Update baseline window for node
   * @private
   */
  _updateBaseline(nodeId, telemetry) {
    if (!this.baselineData.has(nodeId)) {
      this.baselineData.set(nodeId, []);
    }

    const samples = this.baselineData.get(nodeId);
    samples.push({
      timestamp: telemetry.timestamp,
      latency: telemetry.latency,
      errorRate: telemetry.errorRate,
      cpu: telemetry.cpu,
      memory: telemetry.memory,
      health: telemetry.health,
    });

    // Keep only recent window
    if (samples.length > this.baselineWindow) {
      samples.shift();
    }
  }

  /**
   * Get baseline metrics for node
   * @private
   */
  _getBaseline(nodeId) {
    const samples = this.baselineData.get(nodeId);
    if (!samples || samples.length < 3) {
      return null;
    }

    const sum = samples.reduce((acc, s) => ({
      latency: acc.latency + s.latency,
      errorRate: acc.errorRate + s.errorRate,
      cpu: acc.cpu + s.cpu,
      memory: acc.memory + s.memory,
      health: acc.health + s.health,
    }), { latency: 0, errorRate: 0, cpu: 0, memory: 0, health: 0 });

    const count = samples.length;

    return {
      latency: sum.latency / count,
      errorRate: sum.errorRate / count,
      cpu: sum.cpu / count,
      memory: sum.memory / count,
      health: sum.health / count,
    };
  }

  /**
   * Calculate deviation from baseline
   * @private
   */
  _calculateDeviation(current, baseline) {
    return {
      latency: current.latency - baseline.latency,
      errorRate: current.errorRate - baseline.errorRate,
      cpu: current.cpu - baseline.cpu,
      memory: current.memory - baseline.memory,
      health: current.health - baseline.health,
      latencyPercent: baseline.latency > 0 ? ((current.latency - baseline.latency) / baseline.latency) * 100 : 0,
      errorRatePercent: baseline.errorRate > 0
        ? ((current.errorRate - baseline.errorRate) / baseline.errorRate) * 100
        : 0,
      healthPercent: baseline.health > 0 ? ((current.health - baseline.health) / baseline.health) * 100 : 0,
    };
  }

  /**
   * Determine if telemetry represents an anomaly
   * @private
   */
  _isAnomaly(telemetry, deviation, mlResult) {
    // Fast-path: node is offline or critical
    if (telemetry.status === 'CRITICAL' || telemetry.status === 'OFFLINE' || telemetry.health < 40 || telemetry.latency >= 300) {
      return true;
    }

    // ML classification
    if (mlResult && (mlResult.classification === 'CRITICAL' || mlResult.classification === 'WARNING' || mlResult.attackProbability > 0.5)) {
      return true;
    }

    // Deviation-based detection
    if (deviation) {
      if (deviation.latencyPercent > 50 || deviation.latency > 150) return true;
      if (deviation.errorRatePercent > 100 || deviation.errorRate > 5) return true;
      if (deviation.healthPercent < -20 || telemetry.health < 70) return true;
    }

    return false;
  }

  /**
   * Map node status to event severity
   * @private
   */
  _mapStatusToSeverity(status) {
    const map = {
      'HEALTHY': SEVERITY.LOW,
      'WARNING': SEVERITY.MEDIUM,
      'DEGRADED': SEVERITY.HIGH,
      'CRITICAL': SEVERITY.CRITICAL,
      'OFFLINE': SEVERITY.CRITICAL,
    };
    return map[status] || SEVERITY.MEDIUM;
  }

  resetBaseline(nodeId) {
    this.baselineData.delete(nodeId);
  }

  getStats() {
    return {
      nodesMonitored: this.baselineData.size,
      baselineWindow: this.baselineWindow,
      baselines: Array.from(this.baselineData.entries()).map(([nodeId, samples]) => ({
        nodeId,
        sampleCount: samples.length,
        baseline: this._getBaseline(nodeId),
      })),
    };
  }
}

export default Sentinel;
