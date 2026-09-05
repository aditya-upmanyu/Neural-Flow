// NFV5 Canonical Event Model
// Standardized event types for the entire system
// Powers: WebSocket, timeline, audit, replay, receipts, benchmark, reports

/**
 * All canonical event types
 */
export const EVENT_TYPES = {
  // Telemetry & Monitoring
  TELEMETRY_RECEIVED: 'TELEMETRY_RECEIVED',
  TELEMETRY_STALE: 'TELEMETRY_STALE',
  NODE_HEALTH_CHANGED: 'NODE_HEALTH_CHANGED',

  // Detection & Investigation
  ANOMALY_DETECTED: 'ANOMALY_DETECTED',
  INVESTIGATION_STARTED: 'INVESTIGATION_STARTED',
  EVIDENCE_COLLECTED: 'EVIDENCE_COLLECTED',
  CORRELATION_STARTED: 'CORRELATION_STARTED',
  CORRELATION_COMPLETED: 'CORRELATION_COMPLETED',

  // Risk & Analysis
  RISK_CALCULATED: 'RISK_CALCULATED',
  CONFIDENCE_LOW: 'CONFIDENCE_LOW',
  GOAL_ESTABLISHED: 'GOAL_ESTABLISHED',

  // Planning
  PLANNING_STARTED: 'PLANNING_STARTED',
  PLAN_CREATED: 'PLAN_CREATED',
  PLAN_UPDATED: 'PLAN_UPDATED',
  PLANNING_FAILED: 'PLANNING_FAILED',
  ALTERNATIVES_EVALUATED: 'ALTERNATIVES_EVALUATED',
  TARGET_SELECTED: 'TARGET_SELECTED',
  TARGET_REJECTED: 'TARGET_REJECTED',
  NODE_MARKED_UNSUITABLE: 'NODE_MARKED_UNSUITABLE',

  // Policy & Safety
  POLICY_CHECK_STARTED: 'POLICY_CHECK_STARTED',
  POLICY_APPROVED: 'POLICY_APPROVED',
  POLICY_BLOCKED: 'POLICY_BLOCKED',
  POLICY_REQUIRES_APPROVAL: 'POLICY_REQUIRES_APPROVAL',
  POLICY_ABSTAINED: 'POLICY_ABSTAINED',

  // Action Execution
  ACTION_STARTED: 'ACTION_STARTED',
  ACTION_COMPLETED: 'ACTION_COMPLETED',
  ACTION_FAILED: 'ACTION_FAILED',

  // Verification
  VERIFICATION_STARTED: 'VERIFICATION_STARTED',
  VERIFICATION_SAMPLING: 'VERIFICATION_SAMPLING',
  VERIFICATION_PASSED: 'VERIFICATION_PASSED',
  VERIFICATION_PARTIAL: 'VERIFICATION_PARTIAL',
  VERIFICATION_FAILED: 'VERIFICATION_FAILED',

  // Adaptation & Replanning
  ADAPTATION_STARTED: 'ADAPTATION_STARTED',
  ADAPTATION_FAILED: 'ADAPTATION_FAILED',
  ADAPTATION_COMPLETED: 'ADAPTATION_COMPLETED',
  REPLAN_STARTED: 'REPLAN_STARTED',
  REPLAN_COMPLETED: 'REPLAN_COMPLETED',
  REPLAN_FAILED: 'REPLAN_FAILED',

  // Human Interaction
  OPERATOR_NOTIFIED: 'OPERATOR_NOTIFIED',
  OPERATOR_OVERRIDE: 'OPERATOR_OVERRIDE',
  OPERATOR_APPROVED: 'OPERATOR_APPROVED',
  OPERATOR_REJECTED: 'OPERATOR_REJECTED',
  MANUAL_ACTION_TAKEN: 'MANUAL_ACTION_TAKEN',

  // Incident Lifecycle
  INCIDENT_STARTED: 'INCIDENT_STARTED',
  INCIDENT_ESCALATED: 'INCIDENT_ESCALATED',
  RECOVERY_CONFIRMED: 'RECOVERY_CONFIRMED',
  INCIDENT_CLOSED: 'INCIDENT_CLOSED',

  // State Machine
  STATE_TRANSITION: 'STATE_TRANSITION',

  // System
  SYSTEM_STARTED: 'SYSTEM_STARTED',
  SYSTEM_STOPPED: 'SYSTEM_STOPPED',
  SYSTEM_ERROR: 'SYSTEM_ERROR',

  // Benchmark & Testing
  BENCHMARK_STARTED: 'BENCHMARK_STARTED',
  BENCHMARK_COMPLETED: 'BENCHMARK_COMPLETED',
  SCENARIO_STARTED: 'SCENARIO_STARTED',
  SCENARIO_COMPLETED: 'SCENARIO_COMPLETED',

  // Replay
  REPLAY_STARTED: 'REPLAY_STARTED',
  REPLAY_STEP: 'REPLAY_STEP',
  REPLAY_COMPLETED: 'REPLAY_COMPLETED',
};

/**
 * Event severity levels
 */
export const SEVERITY = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL',
};

/**
 * Create a standardized event object
 * @param {string} type - Event type from EVENT_TYPES
 * @param {object} options
 * @returns {object} - Standardized event
 */
export function createEvent(type, options = {}) {
  if (!Object.values(EVENT_TYPES).includes(type)) {
    throw new Error(`Invalid event type: ${type}`);
  }

  return {
    id: options.id || `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type,
    timestamp: options.timestamp || Date.now(),
    incidentId: options.incidentId || null,
    nodeId: options.nodeId || null,
    message: options.message || '',
    severity: options.severity || SEVERITY.LOW,
    data: options.data || {},
    source: options.source || 'system',
    phase: options.phase || null,
  };
}

/**
 * Map old event types to canonical types
 * For backward compatibility with existing EventStore
 */
export const LEGACY_TYPE_MAP = {
  'INFO': EVENT_TYPES.SYSTEM_STARTED,
  'ALERT': EVENT_TYPES.ANOMALY_DETECTED,
  'RECOVERY': EVENT_TYPES.RECOVERY_CONFIRMED,
  'AI_DECISION': EVENT_TYPES.POLICY_APPROVED,
  'REROUTE': EVENT_TYPES.ACTION_COMPLETED,
  'SAFETY_GATE': EVENT_TYPES.POLICY_CHECK_STARTED,
};

/**
 * Convert legacy event type to canonical type
 * @param {string} legacyType
 * @returns {string}
 */
export function mapLegacyType(legacyType) {
  return LEGACY_TYPE_MAP[legacyType] || legacyType;
}

/**
 * Get user-friendly event description
 * @param {string} eventType
 * @returns {string}
 */
export function getEventDescription(eventType) {
  const descriptions = {
    [EVENT_TYPES.TELEMETRY_RECEIVED]: 'Telemetry data received',
    [EVENT_TYPES.ANOMALY_DETECTED]: 'Anomaly detected in node metrics',
    [EVENT_TYPES.INVESTIGATION_STARTED]: 'Investigation started',
    [EVENT_TYPES.EVIDENCE_COLLECTED]: 'Evidence collected from affected node',
    [EVENT_TYPES.CORRELATION_COMPLETED]: 'Signal correlation completed',
    [EVENT_TYPES.RISK_CALCULATED]: 'Risk assessment calculated',
    [EVENT_TYPES.GOAL_ESTABLISHED]: 'Operational goal established',
    [EVENT_TYPES.PLAN_CREATED]: 'Action plan created',
    [EVENT_TYPES.POLICY_APPROVED]: 'Safety policy approved action',
    [EVENT_TYPES.POLICY_BLOCKED]: 'Safety policy blocked action',
    [EVENT_TYPES.ACTION_STARTED]: 'Action execution started',
    [EVENT_TYPES.ACTION_COMPLETED]: 'Action execution completed',
    [EVENT_TYPES.VERIFICATION_STARTED]: 'Verification started',
    [EVENT_TYPES.VERIFICATION_PASSED]: 'Verification passed - recovery confirmed',
    [EVENT_TYPES.VERIFICATION_FAILED]: 'Verification failed - action did not recover node',
    [EVENT_TYPES.ADAPTATION_STARTED]: 'Adaptation started after verification failure',
    [EVENT_TYPES.REPLAN_COMPLETED]: 'Replanning completed with new target',
    [EVENT_TYPES.RECOVERY_CONFIRMED]: 'Recovery confirmed',
    [EVENT_TYPES.INCIDENT_CLOSED]: 'Incident closed',
  };

  return descriptions[eventType] || eventType;
}

/**
 * Determine if event should trigger WebSocket broadcast
 * @param {string} eventType
 * @returns {boolean}
 */
export function shouldBroadcast(eventType) {
  const broadcast = [
    EVENT_TYPES.ANOMALY_DETECTED,
    EVENT_TYPES.EVIDENCE_COLLECTED,
    EVENT_TYPES.RISK_CALCULATED,
    EVENT_TYPES.GOAL_ESTABLISHED,
    EVENT_TYPES.PLAN_CREATED,
    EVENT_TYPES.POLICY_APPROVED,
    EVENT_TYPES.POLICY_BLOCKED,
    EVENT_TYPES.ACTION_STARTED,
    EVENT_TYPES.ACTION_COMPLETED,
    EVENT_TYPES.ACTION_FAILED,
    EVENT_TYPES.VERIFICATION_STARTED,
    EVENT_TYPES.VERIFICATION_PASSED,
    EVENT_TYPES.VERIFICATION_FAILED,
    EVENT_TYPES.ADAPTATION_STARTED,
    EVENT_TYPES.NODE_MARKED_UNSUITABLE,
    EVENT_TYPES.REPLAN_COMPLETED,
    EVENT_TYPES.RECOVERY_CONFIRMED,
    EVENT_TYPES.INCIDENT_CLOSED,
    EVENT_TYPES.STATE_TRANSITION,
  ];

  return broadcast.includes(eventType);
}
