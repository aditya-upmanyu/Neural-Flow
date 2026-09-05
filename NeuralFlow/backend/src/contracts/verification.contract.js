// Verification result data contract
// Validates post-action verification outcomes

import { validate } from './validator.js';

export const VERIFICATION_SCHEMA = {
  incidentId: {
    type: 'string',
    required: true,
  },
  sourceNodeId: {
    type: 'number',
    required: true,
  },
  targetNodeId: {
    type: 'number',
    required: true,
  },
  result: {
    type: 'string',
    required: true,
    enum: ['VERIFIED_SUCCESS', 'PARTIAL_RECOVERY', 'VERIFICATION_FAILED', 'UNKNOWN'],
  },
  confidence: {
    type: 'number',
    required: false,
    min: 0,
    max: 1,
  },
  preState: {
    type: 'object',
    required: false,
  },
  postState: {
    type: 'object',
    required: false,
  },
  comparison: {
    type: 'object',
    required: false,
  },
  criteriaChecks: {
    type: 'array',
    required: false,
  },
};

/**
 * Validate verification result
 * @param {object} verification - Verification data
 * @returns {object} - Validated verification
 * @throws {ValidationError}
 */
export function validateVerification(verification) {
  return validate(verification, VERIFICATION_SCHEMA, 'verification');
}
