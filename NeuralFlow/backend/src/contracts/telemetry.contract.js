// Telemetry data contract
// Validates incoming telemetry from nodes

import { validate } from './validator.js';

export const TELEMETRY_SCHEMA = {
  timestamp: {
    type: 'number',
    required: true,
    validator: (val) => val > 0 && val <= Date.now() + 5000, // Allow 5s clock skew
  },
  nodeId: {
    type: 'number',
    required: true,
    validator: (val) => Number.isInteger(val) && val > 0,
  },
  latency: {
    type: 'number',
    required: true,
    min: 0,
    max: 10000, // Max 10s latency
  },
  errorRate: {
    type: 'number',
    required: true,
    min: 0,
    max: 100, // Percentage
  },
  requestsPerSecond: {
    type: 'number',
    required: true,
    min: 0,
    max: 100000, // Reasonable upper bound
  },
  cpu: {
    type: 'number',
    required: true,
    min: 0,
    max: 100, // Percentage
  },
  memory: {
    type: 'number',
    required: true,
    min: 0,
    max: 100, // Percentage
  },
  health: {
    type: 'number',
    required: true,
    min: 0,
    max: 100, // Health score percentage
  },
  status: {
    type: 'string',
    required: true,
    enum: ['HEALTHY', 'WARNING', 'DEGRADED', 'CRITICAL', 'OFFLINE'],
  },
  connections: {
    type: 'number',
    required: false,
    min: 0,
  },
  throughput: {
    type: 'number',
    required: false,
    min: 0,
  },
  source: {
    type: 'string',
    required: false,
    enum: ['INTERNAL', 'EXTERNAL', 'SIMULATED'],
    default: 'INTERNAL',
  },
};

/**
 * Validate telemetry data
 * @param {object} telemetry - Telemetry data
 * @returns {object} - Validated telemetry
 * @throws {ValidationError}
 */
export function validateTelemetry(telemetry) {
  return validate(telemetry, TELEMETRY_SCHEMA, 'telemetry');
}
