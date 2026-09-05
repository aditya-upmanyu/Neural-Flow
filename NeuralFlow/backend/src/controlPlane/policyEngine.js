// NFV5 Policy Engine - Safety Gate Wrapper with Enhanced Checks
// Wraps safetyGate.js with freshness and cooldown enforcement

import { runSafetyGate, SAFETY_OUTCOMES } from '../safetyGate.js';
import { createEvent, EVENT_TYPES, SEVERITY } from '../core/index.js';

/**
 * Policy Engine enforces safety policies before action execution
 */
export class PolicyEngine {
  constructor(eventStore) {
    this.eventStore = eventStore;
    this.lastActionTime = new Map(); // nodeId → timestamp
    this.cooldownPeriod = 5000; // 5 seconds minimum between actions on same node
    this.maxTelemetryAge = 8000; // 8 seconds - telemetry must be fresh
    this.stats = {
      checksPerformed: 0,
      approved: 0,
      blocked: 0,
    };
  }

  getStatistics() {
    return { ...this.stats };
  }

  /**
   * Check if plan is allowed by policy
   * @param {object} plan - Mitigation plan
   * @param {object} evidence - Evidence bundle
   * @param {string} incidentId
   * @returns {object} - Policy decision
   */
  async checkPolicy(plan, evidence, incidentId, allNodes = []) {
    this.stats.checksPerformed++;
    const { sourceNodeId, targetNodeId, action } = plan;

    if (this.eventStore) {
      this.eventStore.addEvent(
        EVENT_TYPES.POLICY_CHECK_STARTED,
        sourceNodeId,
        `Policy check for ${action}: Node ${sourceNodeId} → Node ${targetNodeId}`,
        SEVERITY.MEDIUM,
        { incidentId }
      );
    }

    // Check 1: Telemetry freshness
    const telemetryAge = Date.now() - (evidence.capturedAt || Date.now());
    if (telemetryAge > this.maxTelemetryAge) {
      this.stats.blocked++;
      const decision = {
        approved: false,
        outcome: SAFETY_OUTCOMES.ABSTAIN,
        reason: 'STALE_TELEMETRY',
        message: `Telemetry is ${telemetryAge}ms old (max allowed: ${this.maxTelemetryAge}ms)`,
        checkedAt: Date.now(),
      };

      if (this.eventStore) {
        this.eventStore.addEvent(
          EVENT_TYPES.POLICY_BLOCKED,
          sourceNodeId,
          `Safety Block: ${decision.message}`,
          SEVERITY.HIGH,
          { incidentId, decision }
        );
      }

      return decision;
    }

    // Check 2: Cooldown enforcement (only for initial attempts of new incidents)
    const isAdaptationStep = plan.attemptNumber > 1 || (evidence && evidence.isAdaptation);
    const lastAction = this.lastActionTime.get(sourceNodeId);
    if (lastAction && !isAdaptationStep) {
      const timeSinceLastAction = Date.now() - lastAction;
      if (timeSinceLastAction < this.cooldownPeriod) {
        this.stats.blocked++;
        const decision = {
          approved: false,
          outcome: SAFETY_OUTCOMES.CONTINUE_MONITORING,
          reason: 'COOLDOWN_ACTIVE',
          message: `Cooldown active: ${Math.round((this.cooldownPeriod - timeSinceLastAction) / 1000)}s remaining`,
          checkedAt: Date.now(),
        };

        if (this.eventStore) {
          this.eventStore.addEvent(
            EVENT_TYPES.POLICY_BLOCKED,
            sourceNodeId,
            `Safety Block: ${decision.message}`,
            SEVERITY.MEDIUM,
            { incidentId, decision }
          );
        }

        return decision;
      }
    }

    // Resolve targetNode from allNodes
    const nodesList = allNodes instanceof Map ? Array.from(allNodes.values()) : (Array.isArray(allNodes) ? allNodes : []);
    const targetNode = nodesList.find(n => n.nodeId === targetNodeId) || {
      nodeId: targetNodeId,
      healthScore: 90,
      cpu: 30,
      metrics: { health: 90, cpu: 30, status: 'HEALTHY' }
    };
    const sourceNode = nodesList.find(n => n.nodeId === sourceNodeId) || {
      nodeId: sourceNodeId,
      status: evidence.signals?.status || 'CRITICAL',
      metrics: evidence.signals || { status: 'CRITICAL', health: 30 }
    };

    // Check 3: Safety Gate Evaluation
    const safetyResult = runSafetyGate({
      confidence: evidence.mlConfidence || 0.85,
      sourceNode,
      targetNode,
      allNodes: nodesList.length > 0 ? nodesList : [sourceNode, targetNode],
      lastRerouteTime: isAdaptationStep ? 0 : (lastAction || 0),
      lastTelemetryTime: evidence.capturedAt || Date.now(),
      actionType: action,
    });

    const isAllowed = safetyResult.outcome === SAFETY_OUTCOMES.ALLOW_AUTONOMOUS_ACTION;

    if (!isAllowed) {
      this.stats.blocked++;
      const decision = {
        approved: false,
        outcome: safetyResult.outcome,
        reason: safetyResult.blockedReason || 'SAFETY_GATE_RESTRICTION',
        message: safetyResult.blockedReason || 'Action rejected by safety gate',
        checks: safetyResult.checks,
        checkedAt: Date.now(),
      };

      if (this.eventStore) {
        this.eventStore.addEvent(
          EVENT_TYPES.POLICY_BLOCKED,
          sourceNodeId,
          `Safety Gate Blocked: ${decision.message}`,
          SEVERITY.HIGH,
          { incidentId, decision }
        );
      }

      return decision;
    }

    // Approved!
    this.stats.approved++;
    this.lastActionTime.set(sourceNodeId, Date.now());

    const decision = {
      approved: true,
      outcome: SAFETY_OUTCOMES.ALLOW_AUTONOMOUS_ACTION,
      reason: 'ALL_SAFETY_CHECKS_PASSED',
      message: 'All deterministic policy and safety checks passed',
      checks: safetyResult.checks,
      checkedAt: Date.now(),
    };

    if (this.eventStore) {
      this.eventStore.addEvent(
        EVENT_TYPES.POLICY_APPROVED,
        sourceNodeId,
        `Policy Approved: Verified safe to execute ${action} to Node ${targetNodeId}`,
        SEVERITY.HIGH,
        { incidentId, decision }
      );
    }

    return decision;
  }
}

export default PolicyEngine;
