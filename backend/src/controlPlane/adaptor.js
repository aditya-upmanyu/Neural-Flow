// NFV5 Adaptor - CRITICAL Adaptation After Verification Failure
// Detects VERIFICATION_FAILED → marks target unsuitable → triggers replan
// This is the KEY MODULE that proves agentic behavior

import { createEvent, EVENT_TYPES, SEVERITY } from '../core/index.js';

/**
 * Adaptor handles adaptation after verification failures
 * This is CRITICAL for agentic behavior demonstration
 */
export class Adaptor {
  constructor(eventStore) {
    this.eventStore = eventStore;
    this.adaptationHistory = [];
    this.MAX_ADAPTATION_STEPS = 3; // Prevent infinite loops
  }

  /**
   * Decide if adaptation is needed based on verification result
   * @param {object} verification - Verification result from Verifier
   * @param {number} attemptNumber - Current attempt number
   * @returns {object} - Adaptation decision
   */
  shouldAdapt(verification, attemptNumber = 1) {
    const { result, sourceNodeId, targetNodeId, incidentId } = verification;

    // Adaptation criteria
    const needsAdaptation = (
      result === 'VERIFICATION_FAILED' ||
      result === 'UNKNOWN' ||
      (result === 'PARTIAL_RECOVERY' && (verification.confidence || 0) < 0.6)
    );

    const exceedsMaxAttempts = attemptNumber >= this.MAX_ADAPTATION_STEPS;

    if (needsAdaptation && !exceedsMaxAttempts) {
      if (this.eventStore) {
        this.eventStore.addEvent(
          EVENT_TYPES.ADAPTATION_STARTED,
          sourceNodeId,
          `Adaptation triggered: Verification ${result} for Node ${sourceNodeId} → Node ${targetNodeId} (Attempt ${attemptNumber}/${this.MAX_ADAPTATION_STEPS})`,
          SEVERITY.CRITICAL,
          { incidentId, verification, attemptNumber }
        );
      }

      return {
        shouldAdapt: true,
        reason: `Verification ${result} - Target Node ${targetNodeId} did not yield recovery. Excluding node and adapting plan.`,
        targetToExclude: targetNodeId,
        attemptNumber,
      };
    }

    if (needsAdaptation && exceedsMaxAttempts) {
      if (this.eventStore) {
        this.eventStore.addEvent(
          EVENT_TYPES.ADAPTATION_FAILED,
          sourceNodeId,
          `Max adaptation attempts (${this.MAX_ADAPTATION_STEPS}) reached — escalating to Human Operator`,
          SEVERITY.CRITICAL,
          { incidentId, attemptNumber }
        );
      }

      return {
        shouldAdapt: false,
        reason: 'MAX_ATTEMPTS_EXCEEDED',
        escalate: true,
      };
    }

    return {
      shouldAdapt: false,
      reason: 'VERIFICATION_SUCCEEDED',
    };
  }

  /**
   * Execute adaptation - mark failed target as unsuitable and trigger replan
   * @param {object} adaptationDecision
   * @param {object} planner - Planner instance
   * @param {object} goalSupervisor - GoalSupervisor instance
   * @param {object} evidence - Original evidence
   * @param {Array} nodes - Available nodes
   * @param {string} incidentId
   * @returns {object} - New plan or null
   */
  adapt(adaptationDecision, planner, goalSupervisor, evidence, nodes, incidentId) {
    const { targetToExclude, attemptNumber } = adaptationDecision;

    // CRITICAL: Mark failed target as unsuitable
    planner.markNodeUnsuitable(targetToExclude);

    if (this.eventStore) {
      this.eventStore.addEvent(
        EVENT_TYPES.NODE_MARKED_UNSUITABLE,
        evidence.nodeId,
        `Agentic Learning: Node ${targetToExclude} marked UNSUITABLE (Failed verification). Excluded from candidate pool.`,
        SEVERITY.HIGH,
        { incidentId, unsuitableNode: targetToExclude, attemptNumber }
      );

      this.eventStore.addEvent(
        EVENT_TYPES.REPLAN_STARTED,
        evidence.nodeId,
        `Replanning mitigation (Attempt ${attemptNumber + 1}) — selecting alternative healthy candidate`,
        SEVERITY.CRITICAL,
        { incidentId, excludedNodes: planner.getUnsuitableNodes() }
      );
    }

    // Re-establish goal
    const adjustedRisk = {
      ...evidence,
      score: Math.min((evidence.anomalyProbability || 0.8) * 100 + 10, 100),
      severity: 'CRITICAL',
    };

    const goal = goalSupervisor.establishGoal(adjustedRisk, evidence, incidentId);

    // Create new plan excluding unsuitable node(s)
    const newPlan = planner.createPlan(goal, evidence, nodes, incidentId);

    if (!newPlan || newPlan.status === 'FAILED') {
      if (this.eventStore) {
        this.eventStore.addEvent(
          EVENT_TYPES.REPLAN_FAILED,
          evidence.nodeId,
          'Replan failed: No alternative healthy nodes available in topology',
          SEVERITY.CRITICAL,
          { incidentId, attemptNumber }
        );
      }
      return null;
    }

    if (this.eventStore) {
      this.eventStore.addEvent(
        EVENT_TYPES.REPLAN_COMPLETED,
        evidence.nodeId,
        `Replan Succeeded: Adapted strategy to route to alternative Node ${newPlan.targetNodeId}`,
        SEVERITY.HIGH,
        { incidentId, newPlan, attemptNumber }
      );
    }

    this.adaptationHistory.push({
      incidentId,
      attemptNumber,
      excludedNode: targetToExclude,
      newTargetNode: newPlan.targetNodeId,
      timestamp: Date.now(),
    });

    return newPlan;
  }

  getAdaptationHistory(incidentId = null) {
    if (incidentId) {
      return this.adaptationHistory.filter(a => a.incidentId === incidentId);
    }
    return this.adaptationHistory;
  }

  clearHistory() {
    this.adaptationHistory = [];
  }

  getMaxAdaptationSteps() {
    return this.MAX_ADAPTATION_STEPS;
  }
}

export default Adaptor;
