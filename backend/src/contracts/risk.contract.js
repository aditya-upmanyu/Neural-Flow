// Risk assessment data contract
// Validates risk calculations (operational danger, separate from ML confidence)

import { validate } from './validator.js';

export const RISK_SCHEMA = {
  incidentId: {
    type: 'string',
    required: true,
  },
  score: {
    type: 'number',
    required: true,
    min: 0,
    max: 100, // Risk score 0-100
  },
  severity: {
    type: 'string',
    required: true,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
  },
  contributors: {
    type: 'array',
    required: true,
    items: {
      factor: { type: 'string', required: true },
      weight: { type: 'number', required: true, min: 0, max: 1 },
      value: { type: 'number', required: true },
      contribution: { type: 'number', required: true },
    },
  },
  confidence: {
    type: 'number',
    required: true,
    min: 0,
    max: 1, // Model confidence 0-1
  },
  calculatedAt: {
    type: 'number',
    required: true,
  },
};

/**
 * Validate risk assessment
 * @param {object} risk - Risk data
 * @returns {object} - Validated risk
 * @throws {ValidationError}
 */
export function validateRisk(risk) {
  return validate(risk, RISK_SCHEMA, 'risk');
}

/**
 * Helper: Determine severity from score
 * @param {number} score - Risk score 0-100
 * @returns {string} - Severity level
 */
export function determineSeverity(score) {
  if (score >= 80) return 'CRITICAL';
  if (score >= 60) return 'HIGH';
  if (score >= 30) return 'MEDIUM';
  return 'LOW';
}
