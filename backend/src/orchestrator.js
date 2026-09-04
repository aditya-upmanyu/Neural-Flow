// NFV5 Orchestrator - Master Autonomous Control Loop
// Coordinates: DETECT → INVESTIGATE → CORRELATE → ASSESS_RISK → ESTABLISH_GOAL → PLAN → CHECK_POLICY → EXECUTE → VERIFY → ADAPT

import {
  Sentinel,
  Investigator,
  Correlator,
  RiskEngine,
  GoalSupervisor,
  Planner,
  PolicyEngine,
  ActionExecutor,
  Verifier,
  Adaptor,
} from './controlPlane/index.js';

import { IncidentStateMachine, STATES } from './core/index.js';
import { createEvent, EVENT_TYPES, SEVERITY } from './core/index.js';
import { createReceipt } from './decisionReceipt.js';

/**
 * Orchestrator coordinates the complete autonomous incident lifecycle
 */
export class Orchestrator {
  constructor(eventStore, agentML) {
    this.eventStore = eventStore;
    this.agentML = agentML;

    // Initialize modular control plane
    this.sentinel = new Sentinel(eventStore, agentML);
    this.investigator = new Investigator(eventStore);
    this.correlator = new Correlator(eventStore);
    this.riskEngine = new RiskEngine(eventStore);
    this.goalSupervisor = new GoalSupervisor(eventStore);
    this.planner = new Planner(eventStore);
    this.policyEngine = new PolicyEngine(eventStore);
    this.actionExecutor = new ActionExecutor(eventStore);
    this.verifier = new Verifier(eventStore);
    this.adaptor = new Adaptor(eventStore);

    // Active incidents and state machines
    this.activeIncidents = new Map(); // incidentId → IncidentStateMachine
    this.activeIncidentData = new Map(); // incidentId → full incident telemetry bundle
    this.latestIncident = null;
    this.isProcessing = false;
  }

  setAgentML(agent) {
    this.agentML = agent;
    this.sentinel.setNeuralAgent(agent);
  }

  /**
   * Main orchestration entry point for a node
   * @param {object} node - Node simulator or state object
   * @param {Array|Map} allNodes - Collection of all active nodes
   * @returns {object} - Execution summary
   */
  async processNode(node, allNodes) {
    try {
      // Phase 1: DETECT (Sentinel)
      const detectionResult = await this.sentinel.detect(node, this.agentML);

      if (!detectionResult.isAnomaly && !detectionResult.isAnomalous) {
        return {
          nodeId: node.nodeId,
          status: 'HEALTHY',
          timestamp: Date.now(),
        };
      }

      // Anomaly detected! Start or correlate incident
      const incidentId = `INC-${Math.floor(100000 + Math.random() * 900000)}`;
      const nodesArray = allNodes instanceof Map ? Array.from(allNodes.values()) : allNodes;

      // Phase 2: INVESTIGATE (EvidenceBuilder)
      const evidence = this.investigator.investigate(node, detectionResult, incidentId);

      // Phase 3: CORRELATE (Correlator)
      const correlation = this.correlator.correlate(evidence, incidentId);

      if (!correlation.isNewIncident && this.activeIncidents.has(correlation.correlatedWith)) {
        return {
          nodeId: node.nodeId,
          status: 'CORRELATED_WITH_EXISTING',
          incidentId: correlation.correlatedWith,
          timestamp: Date.now(),
        };
      }

      // Create authoritative state machine for this incident
      const stateMachine = new IncidentStateMachine(incidentId, node.nodeId);
      this.activeIncidents.set(incidentId, stateMachine);

      stateMachine.transition(STATES.INVESTIGATING, { evidence });
      stateMachine.transition(STATES.CORRELATING, { correlation });

      // Phase 4: ASSESS RISK (RiskEngine)
      const risk = this.riskEngine.calculateRisk(evidence, detectionResult.mlResult, incidentId);
      stateMachine.transition(STATES.ANALYZING, { risk });

      // Phase 5: ESTABLISH GOAL (GoalSupervisor)
      const goal = this.goalSupervisor.establishGoal(risk, evidence, incidentId);
      stateMachine.transition(STATES.GOAL_ESTABLISHED, { goal });

      // Check if healthy nodes exist
      if (!this.goalSupervisor.isGoalAchievable(goal, nodesArray)) {
        stateMachine.transition(STATES.FAILED, {
          reason: 'NO_HEALTHY_NODES',
          message: 'No healthy alternative nodes available to satisfy mission goal',
        });
        return {
          nodeId: node.nodeId,
          status: 'FAILED',
          reason: 'NO_HEALTHY_NODES',
          incidentId,
        };
      }

      // Phase 6: PLAN (Planner)
      let plan = this.planner.createPlan(goal, evidence, nodesArray, incidentId);
      stateMachine.transition(STATES.PLANNING, { plan });

      if (plan.status === 'FAILED') {
        stateMachine.transition(STATES.FAILED, {
          reason: 'PLANNING_FAILED',
          message: plan.reason,
        });
        return {
          nodeId: node.nodeId,
          status: 'FAILED',
          reason: 'PLANNING_FAILED',
          incidentId,
        };
      }

      // Store in-flight incident bundle for dashboard & mission panel
      const incidentBundle = {
        incidentId,
        nodeId: node.nodeId,
        nodeName: node.name || `Node ${node.nodeId}`,
        state: stateMachine.getState(),
        evidence,
        risk,
        goal,
        plan,
        candidates: plan.candidates || [],
        policyDecision: null,
        executionResult: null,
        verificationResult: null,
        adaptations: [],
        startedAt: Date.now(),
        updatedAt: Date.now(),
      };
      this.activeIncidentData.set(incidentId, incidentBundle);
      this.latestIncident = incidentBundle;

      // ADAPTATION LOOP (Bounded retries: up to MAX_ADAPTATION_STEPS = 3)
      let attemptNumber = 1;
      let verificationResult = null;
      let executionResult = null;

      while (attemptNumber <= this.adaptor.getMaxAdaptationSteps()) {
        plan.attemptNumber = attemptNumber;
        // Phase 7: CHECK POLICY (PolicyEngine)
        stateMachine.transition(STATES.POLICY_CHECK, { plan, attemptNumber });
        const policyDecision = await this.policyEngine.checkPolicy(plan, evidence, incidentId, allNodes);
        incidentBundle.policyDecision = policyDecision;

        if (!policyDecision.approved) {
          stateMachine.transition(STATES.ABSTAINED, { policyDecision });
          incidentBundle.state = STATES.ABSTAINED;
          return {
            nodeId: node.nodeId,
            status: 'BLOCKED_BY_POLICY',
            reason: policyDecision.reason,
            incidentId,
          };
        }

        // Phase 8: EXECUTE ACTION (ActionExecutor)
        stateMachine.transition(STATES.EXECUTING, { plan, policyDecision, attemptNumber });
        incidentBundle.state = STATES.EXECUTING;
        executionResult = await this.actionExecutor.execute(plan, allNodes, incidentId);
        incidentBundle.executionResult = executionResult;

        if (!executionResult.success) {
          stateMachine.transition(STATES.FAILED, {
            reason: 'EXECUTION_FAILED',
            error: executionResult.error,
          });
          incidentBundle.state = STATES.FAILED;
          return {
            nodeId: node.nodeId,
            status: 'EXECUTION_FAILED',
            incidentId,
          };
        }

        // Phase 9: INDEPENDENT VERIFICATION (Verifier)
        stateMachine.transition(STATES.VERIFYING, { executionResult, attemptNumber });
        incidentBundle.state = STATES.VERIFYING;
        verificationResult = await this.verifier.verify(executionResult, plan, allNodes, incidentId);
        incidentBundle.verificationResult = verificationResult;

        // Phase 10: ADAPT IF VERIFICATION FAILED (Adaptor)
        const adaptationDecision = this.adaptor.shouldAdapt(verificationResult, attemptNumber);

        if (!adaptationDecision.shouldAdapt) {
          if (adaptationDecision.escalate) {
            stateMachine.transition(STATES.ESCALATED, { reason: 'MAX_ADAPTATION_ATTEMPTS_EXCEEDED' });
            incidentBundle.state = STATES.ESCALATED;
            return {
              nodeId: node.nodeId,
              status: 'ESCALATED',
              incidentId,
              attempts: attemptNumber,
            };
          }

          // Verification Succeeded! RECOVERY CONFIRMED
          stateMachine.transition(STATES.RECOVERED, { verificationResult });
          incidentBundle.state = STATES.RECOVERED;
          incidentBundle.recoveredAt = Date.now();
          incidentBundle.recoveryTimeMs = Date.now() - incidentBundle.startedAt;

          // Create auditable Decision Receipt
          try {
            createReceipt({
              incidentId,
              nodeId: node.nodeId,
              goal: goal.primaryGoal,
              action: plan.action,
              targetNodeId: plan.targetNodeId,
              risk: risk.score,
              confidence: risk.confidence,
              verificationOutcome: verificationResult.result,
              adaptations: incidentBundle.adaptations,
              durationMs: incidentBundle.recoveryTimeMs,
            });
          } catch (err) {
            console.warn('[Orchestrator] Receipt generation notice:', err.message);
          }

          // Clean up correlation tracking
          this.correlator.closeIncident(node.nodeId);

          return {
            nodeId: node.nodeId,
            status: 'RECOVERED',
            incidentId,
            attempts: attemptNumber,
            verificationResult,
            recoveryTimeMs: incidentBundle.recoveryTimeMs,
          };
        }

        // ADAPTATION REQUIRED: Mark target unsuitable and replan
        stateMachine.transition(STATES.ADAPTING, { adaptationDecision });
        incidentBundle.state = STATES.ADAPTING;
        incidentBundle.adaptations.push({
          attempt: attemptNumber,
          excludedNode: adaptationDecision.targetToExclude,
          reason: adaptationDecision.reason,
          timestamp: Date.now(),
        });

        const newPlan = this.adaptor.adapt(
          adaptationDecision,
          this.planner,
          this.goalSupervisor,
          evidence,
          nodesArray,
          incidentId
        );

        if (!newPlan) {
          stateMachine.transition(STATES.FAILED, {
            reason: 'REPLAN_FAILED',
            message: 'No alternative healthy nodes left in topology',
          });
          incidentBundle.state = STATES.FAILED;
          return {
            nodeId: node.nodeId,
            status: 'FAILED',
            reason: 'REPLAN_FAILED',
            incidentId,
          };
        }

        // Plan updated! Move to next attempt
        plan = newPlan;
        incidentBundle.plan = newPlan;
        stateMachine.transition(STATES.REPLANNING, { newPlan, attemptNumber: attemptNumber + 1 });
        attemptNumber++;
      }

      return {
        nodeId: node.nodeId,
        status: 'FAILED',
        reason: 'BOUNDED_LOOP_EXHAUSTED',
        incidentId,
      };

    } catch (error) {
      console.error('[Orchestrator] Fatal error:', error);
      if (this.eventStore) {
        this.eventStore.addEvent(
          EVENT_TYPES.SYSTEM_ERROR,
          node.nodeId,
          `Orchestrator processing error: ${error.message}`,
          SEVERITY.CRITICAL,
          { error: error.message }
        );
      }

      return {
        nodeId: node.nodeId,
        status: 'ERROR',
        error: error.message,
      };
    }
  }

  /**
   * Get active incidents summary
   */
  getActiveIncidents() {
    return Array.from(this.activeIncidents.entries()).map(([id, sm]) => {
      const data = this.activeIncidentData.get(id) || {};
      return {
        incidentId: id,
        currentState: sm.getState(),
        state: sm.getState(),
        nodeId: sm.nodeId,
        history: sm.getHistory(),
        risk: data.risk || null,
        goal: data.goal || null,
        plan: data.plan || null,
        verification: data.verificationResult || null,
        adaptations: data.adaptations || [],
        candidates: data.candidates || [],
      };
    });
  }

  /**
   * Get latest active or resolved incident for dashboard projection
   */
  getLatestIncident() {
    return this.latestIncident;
  }

  /**
   * Prune resolved/terminal incidents from active maps (prevent memory leak)
   */
  _pruneTerminalIncidents() {
    const TERMINAL_STATES = ['RECOVERED', 'FAILED', 'CLOSED', 'ABSTAINED', 'ESCALATED'];
    const MAX_RESOLVED_AGE_MS = 60000; // keep for 60s for dashboard reads, then prune
    const now = Date.now();
    for (const [id, sm] of this.activeIncidents) {
      if (TERMINAL_STATES.includes(sm.getState())) {
        const data = this.activeIncidentData.get(id);
        const closedAt = data?.recoveredAt || data?.startedAt || 0;
        if (now - closedAt > MAX_RESOLVED_AGE_MS) {
          this.activeIncidents.delete(id);
          this.activeIncidentData.delete(id);
        }
      }
    }
  }

  /**
   * Get full orchestrator status and stats
   */
  getStatus() {
    this._pruneTerminalIncidents();
    return {
      activeIncidentsCount: this.activeIncidents.size,
      unsuitableNodes: this.planner.getUnsuitableNodes(),
      adaptationHistory: this.adaptor.getAdaptationHistory(),
      executionHistory: this.actionExecutor.getExecutionHistory(),
      policyStats: this.policyEngine.getStatistics(),
      latestIncident: this.latestIncident,
    };
  }

  /**
   * Reset state for clean demo restarts
   */
  reset() {
    this.activeIncidents.clear();
    this.activeIncidentData.clear();
    this.latestIncident = null;
    this.planner.clearUnsuitableNodes();
    this.adaptor.clearHistory();
    this.correlator.activeIncidents.clear();
  }
}

export default Orchestrator;
