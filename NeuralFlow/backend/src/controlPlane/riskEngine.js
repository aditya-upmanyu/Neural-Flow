// NFV5 Risk Engine - Operational Danger Assessment (Separate from ML Confidence)
// Risk = how dangerous the situation is
// Confidence = how certain the model is

import { validateRisk, determineSeverity } from '../contracts/index.js';
import { createEvent, EVENT_TYPES, SEVERITY } from '../core/index.js';

/**
 * Risk Engine calculates operational danger score (0-100)
 * This is SEPARATE from ML confidence (which is model certainty)
 */
export class RiskEngine {
  constructor(eventStore) {
    this.eventStore = eventStore;
  }

  /**
   * Calculate risk score for incident
   * @param {object} evidence - Evidence bundle
   * @param {object} mlResult - ML prediction result
   * @param {string} incidentId
   * @returns {object} - Risk assessment
   */
  calculateRisk(evidence, mlResult, incidentId) {
    const { signals, delta, trend } = evidence;

    // Risk contributors with weights
    const contributors = [];
    let totalScore = 0;

    // Factor 1: Latency degradation (weight: 0.25)
    const latencyFactor = this._calculateLatencyRisk(signals.latency, delta);
    contributors.push({
      factor: 'latency',
      weight: 0.25,
      value: signals.latency,
      contribution: Math.round(latencyFactor * 0.25 * 10) / 10,
    });
    totalScore += latencyFactor * 0.25;

    // Factor 2: Error rate (weight: 0.20)
    const errorFactor = this._calculateErrorRisk(signals.errorRate, delta);
    contributors.push({
      factor: 'errorRate',
      weight: 0.20,
      value: signals.errorRate,
      contribution: Math.round(errorFactor * 0.20 * 10) / 10,
    });
    totalScore += errorFactor * 0.20;

    // Factor 3: Health degradation (weight: 0.20)
    const healthFactor = this._calculateHealthRisk(signals.health, delta);
    contributors.push({
      factor: 'health',
      weight: 0.20,
      value: signals.health,
      contribution: Math.round(healthFactor * 0.20 * 10) / 10,
    });
    totalScore += healthFactor * 0.20;

    // Factor 4: Resource saturation (weight: 0.15)
    const resourceFactor = this._calculateResourceRisk(signals.cpu, signals.memory);
    contributors.push({
      factor: 'resources',
      weight: 0.15,
      value: Math.max(signals.cpu, signals.memory),
      contribution: Math.round(resourceFactor * 0.15 * 10) / 10,
    });
    totalScore += resourceFactor * 0.15;

    // Factor 5: Trend direction (weight: 0.10)
    const trendFactor = this._calculateTrendRisk(trend);
    contributors.push({
      factor: 'trend',
      weight: 0.10,
      value: trend?.latencySlope || 0,
      contribution: Math.round(trendFactor * 0.10 * 10) / 10,
    });
    totalScore += trendFactor * 0.10;

    // Factor 6: ML anomaly probability (weight: 0.10)
    const mlFactor = (mlResult?.attackProbability || 0) * 100;
    contributors.push({
      factor: 'mlAnomaly',
      weight: 0.10,
      value: mlResult?.attackProbability || 0,
      contribution: Math.round(mlFactor * 0.10 * 10) / 10,
    });
    totalScore += mlFactor * 0.10;

    // Normalize score to 0-100
    const score = Math.min(Math.max(totalScore, 0), 100);
    const severity = determineSeverity(score);

    const risk = {
      incidentId,
      score: Math.round(score),
      severity,
      contributors,
      confidence: mlResult?.confidence || 0.8, // ML confidence is separate!
      calculatedAt: Date.now(),
    };

    try {
      validateRisk(risk);
    } catch (e) {
      console.warn('[RiskEngine] Risk validation notice:', e.message);
    }

    if (this.eventStore) {
      this.eventStore.addEvent(
        EVENT_TYPES.RISK_CALCULATED,
        evidence.nodeId,
        `Risk: ${risk.score}/100 (${risk.severity}) [ML Confidence: ${(risk.confidence * 100).toFixed(1)}%]`,
        this._mapSeverityToEventSeverity(severity),
        { incidentId, risk }
      );
    }

    return risk;
  }

  _calculateLatencyRisk(latency, delta) {
    if (latency > 500) return 100;
    if (latency > 300) return 80;
    if (latency > 150) return 50;
    if (latency > 80) return 25;
    return 10;
  }

  _calculateErrorRisk(errorRate, delta) {
    if (errorRate > 20) return 100;
    if (errorRate > 10) return 80;
    if (errorRate > 5) return 50;
    if (errorRate > 1) return 25;
    return 0;
  }

  _calculateHealthRisk(health, delta) {
    if (health < 20) return 100;
    if (health < 50) return 80;
    if (health < 75) return 50;
    if (health < 90) return 20;
    return 0;
  }

  _calculateResourceRisk(cpu, memory) {
    const maxResource = Math.max(cpu, memory);
    if (maxResource > 90) return 100;
    if (maxResource > 80) return 75;
    if (maxResource > 65) return 40;
    return 10;
  }

  _calculateTrendRisk(trend) {
    if (!trend) return 20;
    if (trend.direction === 'RISING' && trend.latencySlope > 10) return 100;
    if (trend.direction === 'RISING') return 60;
    if (trend.direction === 'FALLING') return 10;
    return 20;
  }

  _mapSeverityToEventSeverity(severity) {
    const map = {
      'LOW': SEVERITY.LOW,
      'MEDIUM': SEVERITY.MEDIUM,
      'HIGH': SEVERITY.HIGH,
      'CRITICAL': SEVERITY.CRITICAL,
    };
    return map[severity] || SEVERITY.MEDIUM;
  }
}

export default RiskEngine;
