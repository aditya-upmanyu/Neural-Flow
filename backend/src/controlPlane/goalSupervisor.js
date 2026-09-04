// NFV5 Goal Supervisor - Establishes Operational Mission
// Defines what the system is trying to achieve during incident response

import { createEvent, EVENT_TYPES, SEVERITY } from '../core/index.js';

/**
 * Goal Supervisor establishes operational goals for incident response
 * Goals guide the planner toward appropriate solutions
 */
export class GoalSupervisor {
  constructor(eventStore) {
    this.eventStore = eventStore;
  }

  /**
   * Establish operational goal based on risk assessment
   * @param {object} risk - Risk assessment from RiskEngine
   * @param {object} evidence - Evidence bundle
   * @param {string} incidentId
   * @returns {object} - Operational goal
   */
  establishGoal(risk, evidence, incidentId) {
    const { score, severity } = risk;
    const { nodeId, signals } = evidence;

    let primaryGoal;
    let constraints = [];
    let successCriteria = {};

    if (severity === 'CRITICAL' || score >= 80) {
      primaryGoal = 'IMMEDIATE_FAILOVER';
      constraints.push('ZERO_TRAFFIC_LOSS');
      constraints.push('SUB_SECOND_SWITCHOVER');
      successCriteria = {
        targetLatency: 120, // ms
        maxErrorRate: 1, // %
        minHealth: 75,
        verificationRequired: true,
      };
    } else if (severity === 'HIGH' || score >= 60) {
      primaryGoal = 'MINIMIZE_IMPACT';
      constraints.push('GRACEFUL_DEGRADATION');
      constraints.push('PRESERVE_AVAILABILITY');
      successCriteria = {
        targetLatency: 150,
        maxErrorRate: 2,
        minHealth: 70,
        verificationRequired: true,
      };
    } else if (severity === 'MEDIUM' || score >= 40) {
      primaryGoal = 'RESTORE_PERFORMANCE';
      constraints.push('MAINTAIN_SLA');
      successCriteria = {
        targetLatency: 180,
        maxErrorRate: 3,
        minHealth: 65,
        verificationRequired: true,
      };
    } else {
      primaryGoal = 'MONITOR_AND_OPTIMIZE';
      constraints.push('NO_DISRUPTION');
      successCriteria = {
        targetLatency: 200,
        maxErrorRate: 5,
        minHealth: 60,
        verificationRequired: false,
      };
    }

    if (signals && (signals.cpu > 85 || signals.memory > 85)) {
      constraints.push('REDUCE_RESOURCE_LOAD');
    }

    if (signals && signals.errorRate > 10) {
      constraints.push('ELIMINATE_ERROR_SOURCE');
    }

    const goal = {
      incidentId,
      nodeId,
      primaryGoal,
      constraints,
      successCriteria,
      establishedAt: Date.now(),
      riskScore: score,
      severity,
    };

    if (this.eventStore) {
      this.eventStore.addEvent(
        EVENT_TYPES.GOAL_ESTABLISHED,
        nodeId,
        `Mission Goal: ${primaryGoal} (${constraints.join(', ')})`,
        this._mapSeverity(severity),
        { incidentId, goal }
      );
    }

    return goal;
  }

  _mapSeverity(severity) {
    const map = {
      'LOW': SEVERITY.LOW,
      'MEDIUM': SEVERITY.MEDIUM,
      'HIGH': SEVERITY.HIGH,
      'CRITICAL': SEVERITY.CRITICAL,
    };
    return map[severity] || SEVERITY.MEDIUM;
  }

  /**
   * Check if goal is achievable given current state
   * @param {object} goal
   * @param {Array} availableNodes
   * @returns {boolean}
   */
  isGoalAchievable(goal, availableNodes) {
    const healthyNodes = availableNodes.filter(n => {
      const st = typeof n.getState === 'function' ? n.getState() : (n.metrics || n);
      return (st.health >= (goal.successCriteria.minHealth - 15) && st.health > 40 && (st.status || 'healthy').toLowerCase() !== 'critical');
    });

    return healthyNodes.length > 0;
  }
}

export default GoalSupervisor;
