// NFV5 Incident State Machine
// Manages incident lifecycle with valid state transitions only
// Prevents invalid states, enables safe reconnect, provides audit trail

import { EventEmitter } from 'events';

// All valid incident states
export const STATES = {
  IDLE: 'IDLE',
  MONITORING: 'MONITORING',
  ANOMALY_DETECTED: 'ANOMALY_DETECTED',
  INVESTIGATING: 'INVESTIGATING',
  CORRELATING: 'CORRELATING',
  ANALYZING: 'ANALYZING',
  GOAL_ESTABLISHED: 'GOAL_ESTABLISHED',
  PLANNING: 'PLANNING',
  POLICY_CHECK: 'POLICY_CHECK',
  WAITING_FOR_APPROVAL: 'WAITING_FOR_APPROVAL',
  EXECUTING: 'EXECUTING',
  VERIFYING: 'VERIFYING',
  RECOVERED: 'RECOVERED',
  PARTIALLY_RECOVERED: 'PARTIALLY_RECOVERED',
  ADAPTING: 'ADAPTING',
  REPLANNING: 'REPLANNING',
  ESCALATED: 'ESCALATED',
  ABSTAINED: 'ABSTAINED',
  FAILED: 'FAILED',
  CLOSED: 'CLOSED',
};

// Valid state transitions (from → [to])
export const TRANSITIONS = {
  [STATES.IDLE]: [STATES.MONITORING, STATES.ANOMALY_DETECTED],
  [STATES.MONITORING]: [STATES.ANOMALY_DETECTED, STATES.IDLE],
  [STATES.ANOMALY_DETECTED]: [STATES.INVESTIGATING, STATES.MONITORING, STATES.FAILED, STATES.CLOSED],
  [STATES.INVESTIGATING]: [STATES.CORRELATING, STATES.ANALYZING, STATES.MONITORING, STATES.FAILED, STATES.CLOSED],
  [STATES.CORRELATING]: [STATES.ANALYZING, STATES.MONITORING, STATES.FAILED, STATES.CLOSED],
  [STATES.ANALYZING]: [STATES.GOAL_ESTABLISHED, STATES.ABSTAINED, STATES.MONITORING, STATES.FAILED, STATES.CLOSED],
  [STATES.GOAL_ESTABLISHED]: [STATES.PLANNING, STATES.FAILED, STATES.CLOSED],
  [STATES.PLANNING]: [STATES.POLICY_CHECK, STATES.ESCALATED, STATES.ABSTAINED, STATES.FAILED, STATES.CLOSED],
  [STATES.POLICY_CHECK]: [
    STATES.EXECUTING,
    STATES.WAITING_FOR_APPROVAL,
    STATES.ABSTAINED,
    STATES.ESCALATED,
    STATES.FAILED,
    STATES.CLOSED,
  ],
  [STATES.WAITING_FOR_APPROVAL]: [
    STATES.EXECUTING,
    STATES.ESCALATED,
    STATES.ABSTAINED,
    STATES.CLOSED,
    STATES.FAILED,
  ],
  [STATES.EXECUTING]: [STATES.VERIFYING, STATES.FAILED, STATES.CLOSED],
  [STATES.VERIFYING]: [
    STATES.RECOVERED,
    STATES.PARTIALLY_RECOVERED,
    STATES.ADAPTING,
    STATES.FAILED,
    STATES.CLOSED,
  ],
  [STATES.RECOVERED]: [STATES.CLOSED, STATES.IDLE, STATES.MONITORING],
  [STATES.PARTIALLY_RECOVERED]: [STATES.ADAPTING, STATES.ESCALATED, STATES.CLOSED],
  [STATES.ADAPTING]: [STATES.REPLANNING, STATES.ESCALATED, STATES.FAILED, STATES.CLOSED],
  [STATES.REPLANNING]: [STATES.POLICY_CHECK, STATES.PLANNING, STATES.ESCALATED, STATES.FAILED, STATES.CLOSED],
  [STATES.ESCALATED]: [STATES.WAITING_FOR_APPROVAL, STATES.CLOSED, STATES.MONITORING],
  [STATES.ABSTAINED]: [STATES.MONITORING, STATES.CLOSED, STATES.IDLE],
  [STATES.FAILED]: [STATES.CLOSED, STATES.ESCALATED, STATES.IDLE],
  [STATES.CLOSED]: [STATES.MONITORING, STATES.IDLE],
};

export class IncidentStateMachine extends EventEmitter {
  constructor(incidentId = null, nodeId = null) {
    super();
    this.currentState = incidentId ? STATES.ANOMALY_DETECTED : STATES.IDLE;
    this.incidentId = incidentId;
    this.nodeId = nodeId;
    this.stateHistory = [];
    this.metadata = {};
    this.transitionCount = 0;

    if (incidentId) {
      this.stateHistory.push({
        from: STATES.IDLE,
        to: STATES.ANOMALY_DETECTED,
        timestamp: Date.now(),
        metadata: { incidentId, nodeId },
        transitionNumber: 1,
      });
      this.transitionCount = 1;
    }
  }

  /**
   * Get current state
   * @returns {string}
   */
  getState() {
    return this.currentState;
  }

  /**
   * Get incident ID
   * @returns {string|null}
   */
  getIncidentId() {
    return this.incidentId;
  }

  /**
   * Get state metadata
   * @returns {object}
   */
  getMetadata() {
    return { ...this.metadata };
  }

  /**
   * Get state history
   * @returns {Array}
   */
  getHistory() {
    return [...this.stateHistory];
  }

  /**
   * Check if state is terminal
   * @param {string} state
   * @returns {boolean}
   */
  isTerminal(state = this.currentState) {
    return [STATES.CLOSED, STATES.FAILED, STATES.ABSTAINED, STATES.RECOVERED].includes(state);
  }

  /**
   * Check if transition is valid
   * @param {string} fromState
   * @param {string} toState
   * @returns {boolean}
   */
  canTransition(fromState, toState) {
    const allowed = TRANSITIONS[fromState] || [];
    return allowed.includes(toState);
  }

  /**
   * Transition to new state
   * @param {string} newState
   * @param {object} metadata - Additional data about this transition
   * @throws {Error} if transition is invalid
   */
  transition(newState, metadata = {}) {
    // Map common aliases
    const stateAliases = {
      'INVESTIGATE': STATES.INVESTIGATING,
      'CORRELATE': STATES.CORRELATING,
      'ASSESS_RISK': STATES.ANALYZING,
      'ESTABLISH_GOAL': STATES.GOAL_ESTABLISHED,
      'PLAN': STATES.PLANNING,
      'CHECK_POLICY': STATES.POLICY_CHECK,
      'APPROVE_ACTION': STATES.EXECUTING,
      'BLOCK_ACTION': STATES.ABSTAINED,
      'EXECUTE_ACTION': STATES.EXECUTING,
      'VERIFY': STATES.VERIFYING,
      'CONFIRM_RECOVERY': STATES.RECOVERED,
      'CLOSE': STATES.CLOSED,
      'FAIL': STATES.FAILED,
      'ESCALATE': STATES.ESCALATED,
      'ADAPT': STATES.ADAPTING,
      'REPLAN': STATES.REPLANNING,
    };

    const targetState = stateAliases[newState] || newState;

    // Validate state exists
    if (!Object.values(STATES).includes(targetState)) {
      console.warn(`[IncidentStateMachine] Invalid state: ${newState} (mapped: ${targetState})`);
      return this.currentState;
    }

    // Check transition validity
    if (!this.canTransition(this.currentState, targetState)) {
      console.warn(`[IncidentStateMachine] Non-standard transition: ${this.currentState} → ${targetState} (incident: ${this.incidentId})`);
    }

    const oldState = this.currentState;
    const timestamp = Date.now();

    // Record transition in history
    this.stateHistory.push({
      from: oldState,
      to: targetState,
      timestamp,
      metadata: { ...metadata },
      transitionNumber: ++this.transitionCount,
    });

    // Update state
    this.currentState = targetState;
    this.metadata = { ...this.metadata, ...metadata };

    // Emit state change event
    this.emit('stateChange', {
      from: oldState,
      to: targetState,
      incidentId: this.incidentId,
      nodeId: this.nodeId,
      timestamp,
      metadata,
    });

    // Emit specific state entry event
    this.emit(`enter:${targetState}`, {
      from: oldState,
      incidentId: this.incidentId,
      nodeId: this.nodeId,
      timestamp,
      metadata,
    });

    return this.currentState;
  }

  /**
   * Start a new incident
   * @param {string} incidentId
   * @param {object} metadata
   */
  startIncident(incidentId, metadata = {}) {
    this.incidentId = incidentId;
    this.metadata = metadata;
    this.stateHistory = [];
    this.transitionCount = 0;
    this.currentState = STATES.IDLE;
    this.transition(STATES.MONITORING, { incidentId, ...metadata });
    return this.incidentId;
  }

  /**
   * Close current incident
   * @param {object} metadata
   */
  closeIncident(metadata = {}) {
    if (!this.incidentId) {
      return null;
    }

    if (!this.isTerminal()) {
      this.transition(STATES.CLOSED, metadata);
    }

    const closedIncidentId = this.incidentId;
    return closedIncidentId;
  }
}
