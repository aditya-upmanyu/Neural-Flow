// Evidence data contract
// Validates evidence bundles captured during investigation

import { validate } from './validator.js';

export const EVIDENCE_SCHEMA = {
  incidentId: {
    type: 'string',
    required: true,
  },
  nodeId: {
    type: 'number',
    required: true,
  },
  capturedAt: {
    type: 'number',
    required: true,
  },
  signals: {
    type: 'object',
    required: true,
    schema: {
      latency: { type: 'number', required: true },
      errorRate: { type: 'number', required: true },
      requestsPerSecond: { type: 'number', required: true },
      cpu: { type: 'number', required: true },
      memory: { type: 'number', required: true },
      health: { type: 'number', required: true },
    },
  },
  baseline: {
    type: 'object',
    required: false,
    schema: {
      latency: { type: 'number', required: true },
      errorRate: { type: 'number', required: true },
      health: { type: 'number', required: true },
    },
  },
  delta: {
    type: 'object',
    required: false,
    schema: {
      latency: { type: 'number', required: true },
      errorRate: { type: 'number', required: true },
      health: { type: 'number', required: true },
    },
  },
  trend: {
    type: 'object',
    required: false,
    schema: {
      latencySlope: { type: 'number', required: true },
      direction: { type: 'string', enum: ['RISING', 'FALLING', 'STABLE'], required: true },
    },
  },
  anomalyProbability: {
    type: 'number',
    required: false,
    min: 0,
    max: 1,
  },
  featureAttribution: {
    type: 'object',
    required: false,
  },
};

/**
 * Validate evidence bundle
 * @param {object} evidence - Evidence data
 * @returns {object} - Validated evidence
 * @throws {ValidationError}
 */
export function validateEvidence(evidence) {
  return validate(evidence, EVIDENCE_SCHEMA, 'evidence');
}
