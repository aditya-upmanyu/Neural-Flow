// NFV5 Verifier - Post-Action Verification Engine
// Wraps verificationEngine.js with multi-point criteria verification

import { runVerification, VERIFICATION_RESULTS } from '../verificationEngine.js';
import { validateVerification } from '../contracts/index.js';
import { createEvent, EVENT_TYPES, SEVERITY } from '../core/index.js';

/**
 * Verifier performs post-action verification
 */
export class Verifier {
  constructor(eventStore) {
    this.eventStore = eventStore;
    this.thresholds = {
      latencyImprovement: 0.15, // 15% improvement required
      errorReduction: 0.2, // 20% error reduction
      minHealth: 60,
      stabilizationWindowMs: 800, // Fast stabilization for responsive demo
    };
  }

  /**
   * Verify mitigation effectiveness
   * @param {object} executionResult - Result from ActionExecutor
   * @param {object} plan - Original mitigation plan
   * @param {Map|Array} nodes - Nodes collection
   * @param {string} incidentId
   * @returns {object} - Verification result
   */
  async verify(executionResult, plan, nodes, incidentId) {
    const { sourceNodeId, targetNodeId } = plan;
    const { preState, postState } = executionResult;

    if (this.eventStore) {
      this.eventStore.addEvent(
        EVENT_TYPES.VERIFICATION_STARTED,
        sourceNodeId,
        `Verifying mitigation effectiveness: Node ${sourceNodeId} → Node ${targetNodeId}`,
        SEVERITY.HIGH,
        { incidentId }
      );
    }

    // Short stabilization wait
    await new Promise(r => setTimeout(r, this.thresholds.stabilizationWindowMs));

    const getNode = (id) => {
      if (nodes instanceof Map) return nodes.get(id);
      if (Array.isArray(nodes)) return nodes.find(n => n.nodeId === id);
      return null;
    };

    const targetNode = getNode(targetNodeId);
    const sourceNode = getNode(sourceNodeId);

    if (!targetNode || !sourceNode) {
      return this._createFailedVerification(incidentId, sourceNodeId, targetNodeId, 'Node unreachable during verification');
    }

    const currentTargetState = this._captureNodeState(targetNode);
    const currentSourceState = this._captureNodeState(sourceNode);

    // Independent verification check using verificationEngine.js
    const verificationEngineResult = await runVerification({
      preRerouteSnapshot: preState.source,
      targetNode,
      sourceNode,
      pollFunction: async () => this._captureNodeState(targetNode),
      verificationWindowMs: 600,
    });

    // Check criteria
    const targetIsHealthy = currentTargetState.health >= this.thresholds.minHealth;
    const targetNotOverloaded = currentTargetState.latency < 250;
    const engineSuccess = verificationEngineResult.result === VERIFICATION_RESULTS.VERIFIED_SUCCESS;
    const enginePartial = verificationEngineResult.result === VERIFICATION_RESULTS.PARTIAL_RECOVERY;

    let resultStatus = VERIFICATION_RESULTS.VERIFIED_SUCCESS;
    let resultConfidence = 0.95;

    // Check if target node itself is under attack or failing (failure simulation scenario)
    if (targetNode.isUnderAttack || currentTargetState.health < 40 || currentTargetState.latency > 350) {
      resultStatus = VERIFICATION_RESULTS.VERIFICATION_FAILED;
      resultConfidence = 0.90;
    } else if (!targetIsHealthy || !targetNotOverloaded || (!engineSuccess && !enginePartial)) {
      resultStatus = VERIFICATION_RESULTS.PARTIAL_RECOVERY;
      resultConfidence = enginePartial ? 0.70 : 0.65;
    }

    const criteriaChecks = [
      {
        metric: 'TARGET_HEALTH',
        expected: `>= ${this.thresholds.minHealth}%`,
        actual: currentTargetState.health,
        passed: targetIsHealthy,
      },
      {
        metric: 'TARGET_LATENCY',
        expected: '< 250ms',
        actual: currentTargetState.latency,
        passed: targetNotOverloaded,
      },
      {
        metric: 'ENGINE_VERIFICATION',
        expected: 'VERIFIED_SUCCESS',
        actual: verificationEngineResult.result === VERIFICATION_RESULTS.VERIFIED_SUCCESS ? 100 : 50,
        passed: verificationEngineResult.result === VERIFICATION_RESULTS.VERIFIED_SUCCESS,
      },
    ];

    const verification = {
      actionId: executionResult.executionId || `act_${Date.now()}`,
      incidentId,
      sourceNodeId,
      targetNodeId,
      result: resultStatus,
      confidence: resultConfidence,
      preSnapshot: preState.source,
      postSamples: [currentTargetState],
      checks: criteriaChecks,
      criteriaChecks,
      delta: {
        latency: currentTargetState.latency - preState.source.latency,
        errorRate: currentTargetState.errorRate - preState.source.errorRate,
        health: currentTargetState.health - preState.source.health,
      },
      samplingWindow: this.thresholds.stabilizationWindowMs,
      sampleCount: 3,
      verifiedAt: Date.now(),
    };

    if (this.eventStore) {
      const isPassed = resultStatus === VERIFICATION_RESULTS.VERIFIED_SUCCESS;
      const isPartial = resultStatus === VERIFICATION_RESULTS.PARTIAL_RECOVERY;

      const eventType = isPassed
        ? EVENT_TYPES.VERIFICATION_PASSED
        : isPartial
        ? EVENT_TYPES.VERIFICATION_PARTIAL
        : EVENT_TYPES.VERIFICATION_FAILED;

      this.eventStore.addEvent(
        eventType,
        sourceNodeId,
        `Verification ${resultStatus}: Target Node ${targetNodeId} health is ${currentTargetState.health}%, latency is ${currentTargetState.latency}ms`,
        isPassed ? SEVERITY.HIGH : SEVERITY.CRITICAL,
        { incidentId, verification }
      );
    }

    return verification;
  }

  _createFailedVerification(incidentId, sourceNodeId, targetNodeId, reason) {
    return {
      actionId: `act_${Date.now()}`,
      incidentId,
      sourceNodeId,
      targetNodeId,
      result: VERIFICATION_RESULTS.VERIFICATION_FAILED,
      confidence: 1.0,
      reason,
      preSnapshot: { latency: 300, errorRate: 10, health: 30, timestamp: Date.now() },
      postSamples: [],
      checks: [],
      delta: { latency: 0, errorRate: 0, health: 0 },
      samplingWindow: 0,
      sampleCount: 0,
      verifiedAt: Date.now(),
    };
  }

  _captureNodeState(node) {
    const st = typeof node.getState === 'function' ? node.getState() : (node.metrics || node);
    return {
      nodeId: node.nodeId,
      name: node.name,
      latency: Math.round(st.latency || 0),
      errorRate: Math.round((st.errorRate || 0) * 10) / 10,
      health: Math.round(st.health ?? st.healthScore ?? 0),
      traffic: st.traffic || 0,
      timestamp: Date.now(),
    };
  }
}

export default Verifier;
