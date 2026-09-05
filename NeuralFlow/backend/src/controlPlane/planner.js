// NFV5 Planner - Context-Aware Planning with Explainability
// Creates actionable plans with multiple candidates and scoring

import { validatePlan } from '../contracts/index.js';
import { createEvent, EVENT_TYPES, SEVERITY } from '../core/index.js';

/**
 * Planner generates context-aware mitigation plans
 */
export class Planner {
  constructor(eventStore) {
    this.eventStore = eventStore;
    this.unsuitableNodes = new Set(); // Nodes marked as unsuitable after failure
  }

  markNodeUnsuitable(nodeId) {
    this.unsuitableNodes.add(Number(nodeId));
  }

  getUnsuitableNodes() {
    return Array.from(this.unsuitableNodes);
  }

  clearUnsuitableNodes() {
    this.unsuitableNodes.clear();
  }

  /**
   * Create mitigation plan
   * @param {object} goal - Operational goal from GoalSupervisor
   * @param {object} evidence - Evidence bundle
   * @param {Array} nodes - All available nodes
   * @param {string} incidentId
   * @returns {object} - Mitigation plan
   */
  createPlan(goal, evidence, nodes, incidentId) {
    const { nodeId } = evidence;
    const { primaryGoal, successCriteria } = goal;

    if (this.eventStore) {
      this.eventStore.addEvent(
        EVENT_TYPES.PLANNING_STARTED,
        nodeId,
        `Planning mitigation for goal: ${primaryGoal}`,
        SEVERITY.HIGH,
        { incidentId }
      );
    }

    // Find candidate target nodes (exclude problem node and unsuitable nodes)
    const candidates = this._findCandidates(nodeId, nodes, successCriteria);

    if (candidates.length === 0) {
      if (this.eventStore) {
        this.eventStore.addEvent(
          EVENT_TYPES.PLANNING_FAILED,
          nodeId,
          'No suitable target nodes available',
          SEVERITY.CRITICAL,
          { incidentId, reason: 'NO_CANDIDATES' }
        );
      }

      return {
        planId: `plan_${Date.now()}`,
        incidentId,
        sourceNodeId: nodeId,
        targetNodeId: null,
        goal: primaryGoal,
        action: 'NONE',
        candidates: [],
        reason: 'No healthy nodes available for reroute',
        expectedOutcome: 'Human escalation required',
        createdAt: Date.now(),
        status: 'FAILED',
      };
    }

    // Score and rank candidates
    const scoredCandidates = this._scoreCandidates(candidates, evidence, successCriteria);
    const bestCandidate = scoredCandidates[0];

    let action = 'REROUTE_TRAFFIC';
    if (primaryGoal === 'IMMEDIATE_FAILOVER') {
      action = 'IMMEDIATE_REROUTE';
    } else if (primaryGoal === 'MONITOR_AND_OPTIMIZE') {
      action = 'GRADUAL_SHIFT';
    }

    const plan = {
      planId: `plan_${Date.now()}`,
      incidentId,
      sourceNodeId: nodeId,
      targetNodeId: bestCandidate.nodeId,
      goal: primaryGoal,
      action,
      candidates: scoredCandidates.map(c => ({
        nodeId: c.nodeId,
        nodeName: c.name,
        score: c.score,
        rationale: c.rationale,
        metrics: {
          health: c.health,
          latency: c.latency,
          errorRate: c.errorRate,
          cpu: c.cpu,
        },
      })),
      expectedOutcome: {
        targetLatency: bestCandidate.latency,
        targetErrorRate: bestCandidate.errorRate,
        targetHealth: bestCandidate.health,
        confidenceLevel: bestCandidate.score / 100,
      },
      reason: `Selected ${bestCandidate.name} (score: ${bestCandidate.score.toFixed(1)}) — ${bestCandidate.rationale}`,
      risk: evidence.signals ? Math.round((evidence.signals.latency / 500) * 100) : 50,
      confidence: bestCandidate.score / 100,
      createdAt: Date.now(),
      status: 'READY',
    };

    try {
      validatePlan(plan);
    } catch (e) {
      console.warn('[Planner] Plan validation notice:', e.message);
    }

    if (this.eventStore) {
      this.eventStore.addEvent(
        EVENT_TYPES.PLAN_CREATED,
        nodeId,
        `Plan: Reroute traffic from Node ${nodeId} → Node ${bestCandidate.nodeId} (${bestCandidate.name})`,
        SEVERITY.HIGH,
        { incidentId, plan }
      );
    }

    return plan;
  }

  _findCandidates(sourceNodeId, nodes, successCriteria) {
    return nodes.filter(n => {
      const id = n.nodeId;
      if (id === sourceNodeId) return false;
      if (this.unsuitableNodes.has(Number(id))) return false;

      const st = typeof n.getState === 'function' ? n.getState() : (n.metrics || n);
      const health = st.health ?? st.healthScore ?? 0;
      const status = (st.status || 'healthy').toLowerCase();

      return health >= 40 && status !== 'critical';
    });
  }

  _scoreCandidates(candidates, evidence, successCriteria) {
    const scored = candidates.map(node => {
      const st = typeof node.getState === 'function' ? node.getState() : (node.metrics || node);
      const health = st.health ?? st.healthScore ?? 50;
      const latency = st.latency ?? 50;
      const errorRate = st.errorRate ?? 0;
      const cpu = st.cpu ?? 30;
      const rps = st.requestsPerSecond ?? 10;

      // Score formula: Health (40%) + Latency headroom (30%) + CPU headroom (20%) + RPS capacity (10%)
      const healthScore = health;
      const latencyScore = Math.max(0, Math.min(100, (300 - latency) / 2.5));
      const cpuScore = Math.max(0, 100 - cpu);
      const capacityScore = Math.max(0, 100 - rps);

      const totalScore = (healthScore * 0.40) + (latencyScore * 0.30) + (cpuScore * 0.20) + (capacityScore * 0.10);

      const rationaleParts = [];
      if (health >= 85) rationaleParts.push('Excellent health');
      if (latency < 80) rationaleParts.push('Low latency');
      if (cpu < 50) rationaleParts.push('Ample CPU headroom');

      return {
        nodeId: node.nodeId,
        name: node.name || `Node ${node.nodeId}`,
        score: Math.round(totalScore * 10) / 10,
        health,
        latency,
        errorRate,
        cpu,
        rationale: rationaleParts.join(', ') || 'Acceptable operational parameters',
      };
    });

    return scored.sort((a, b) => b.score - a.score);
  }
}

export default Planner;
