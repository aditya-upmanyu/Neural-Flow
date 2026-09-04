// NFV5 Investigator - Evidence Collection After Detection
// Collects structured evidence comparing baseline vs current vs trend

import { validateEvidence } from '../contracts/index.js';
import { createEvent, EVENT_TYPES, SEVERITY } from '../core/index.js';

/**
 * Investigator collects evidence after anomaly detection
 */
export class Investigator {
  constructor(eventStore) {
    this.eventStore = eventStore;
  }

  /**
   * Investigate node and collect evidence
   * @param {object} node - Node object with metrics
   * @param {object} detectionResult - Result from Sentinel
   * @param {string} incidentId - Current incident ID
   * @returns {object} - Evidence bundle
   */
  investigate(node, detectionResult, incidentId) {
    const { telemetry, baseline, deviation, mlResult } = detectionResult;
    const nodeId = node.nodeId || (telemetry && telemetry.nodeId) || 1;
    const nodeName = node.name || `Node ${nodeId}`;

    // Emit investigation started event
    if (this.eventStore) {
      this.eventStore.addEvent(
        EVENT_TYPES.INVESTIGATION_STARTED,
        nodeId,
        `Investigation started for node ${nodeId} (${nodeName})`,
        SEVERITY.MEDIUM,
        { incidentId }
      );
    }

    // Build evidence bundle
    const evidence = {
      incidentId,
      nodeId,
      capturedAt: Date.now(),

      // Current signals
      signals: {
        latency: telemetry.latency,
        errorRate: telemetry.errorRate,
        requestsPerSecond: telemetry.requestsPerSecond,
        cpu: telemetry.cpu,
        memory: telemetry.memory,
        health: telemetry.health,
        status: telemetry.status,
        connections: telemetry.connections || 0,
        throughput: telemetry.throughput || 0,
      },

      // Baseline comparison
      baseline: baseline || {
        latency: 45,
        errorRate: 0.5,
        health: 98,
      },

      // Delta from baseline
      delta: deviation || {
        latency: telemetry.latency - 45,
        errorRate: telemetry.errorRate - 0.5,
        health: telemetry.health - 98,
      },

      // Trend analysis
      trend: this._analyzeTrend(node),

      // ML assessment
      anomalyProbability: Math.max(0, Math.min(1, mlResult?.attackProbability || 0)),
      mlClassification: mlResult?.classification || 'WARNING',
      mlConfidence: mlResult?.confidence || 0.8,

      // Feature attribution
      featureAttribution: this._getFeatureAttribution(node, mlResult),
    };

    // Validate evidence structure
    try {
      validateEvidence(evidence);
    } catch (validationError) {
      console.warn('[Investigator] Evidence validation notice:', validationError.message);
    }

    // Emit evidence collected event
    if (this.eventStore) {
      this.eventStore.addEvent(
        EVENT_TYPES.EVIDENCE_COLLECTED,
        nodeId,
        `Evidence collected for node ${nodeId}: ${this._summarizeEvidence(evidence)}`,
        SEVERITY.HIGH,
        { incidentId, evidence }
      );
    }

    return evidence;
  }

  /**
   * Analyze trend (rising, falling, stable)
   * @private
   */
  _analyzeTrend(node) {
    const history = node.latencyHistory || [];

    if (history.length < 3) {
      return {
        latencySlope: 0,
        direction: 'STABLE',
      };
    }

    const n = history.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    for (let i = 0; i < n; i++) {
      sumX += i;
      sumY += history[i];
      sumXY += i * history[i];
      sumXX += i * i;
    }

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    let direction = 'STABLE';
    if (slope > 2) direction = 'RISING';
    else if (slope < -2) direction = 'FALLING';

    return {
      latencySlope: Math.round(slope * 10) / 10,
      direction,
    };
  }

  /**
   * Calculate feature attribution (which metrics drove the detection)
   * @private
   */
  _getFeatureAttribution(node, mlResult) {
    const st = typeof node.getState === 'function' ? node.getState() : node;
    const attributions = {};

    if (st.latency > 100) {
      attributions.latency = {
        weight: 0.35,
        contribution: Math.min((st.latency - 50) / 300, 1),
        description: `Elevated latency (${Math.round(st.latency)}ms)`,
      };
    }

    if (st.errorRate > 2) {
      attributions.errorRate = {
        weight: 0.25,
        contribution: Math.min(st.errorRate / 20, 1),
        description: `High error rate (${st.errorRate.toFixed(1)}%)`,
      };
    }

    if (st.cpu > 70) {
      attributions.cpu = {
        weight: 0.20,
        contribution: Math.min((st.cpu - 50) / 50, 1),
        description: `CPU saturation (${Math.round(st.cpu)}%)`,
      };
    }

    if (st.health < 80) {
      attributions.health = {
        weight: 0.20,
        contribution: Math.min((100 - st.health) / 100, 1),
        description: `Degraded health score (${Math.round(st.health)}%)`,
      };
    }

    return attributions;
  }

  /**
   * Create readable summary of evidence
   * @private
   */
  _summarizeEvidence(evidence) {
    const parts = [];
    if (evidence.signals.latency > 100) parts.push(`Latency ${Math.round(evidence.signals.latency)}ms`);
    if (evidence.signals.errorRate > 2) parts.push(`Errors ${evidence.signals.errorRate.toFixed(1)}%`);
    if (evidence.signals.health < 80) parts.push(`Health ${Math.round(evidence.signals.health)}%`);
    if (evidence.trend?.direction === 'RISING') parts.push(`Rising trend (+${evidence.trend.latencySlope}ms/s)`);
    return parts.length > 0 ? parts.join(', ') : 'Minor baseline variance';
  }
}

export default Investigator;
