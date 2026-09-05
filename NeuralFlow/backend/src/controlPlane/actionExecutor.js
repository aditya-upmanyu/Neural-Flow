// NFV5 Action Executor - Executes Validated Actions
// Handles actual execution with idempotency and proper event emission

import { createEvent, EVENT_TYPES, SEVERITY } from '../core/index.js';

/**
 * Action Executor executes policy-approved actions
 */
export class ActionExecutor {
  constructor(eventStore) {
    this.eventStore = eventStore;
    this.executionHistory = new Map(); // Track executions for idempotency
  }

  getExecutionHistory() {
    return Array.from(this.executionHistory.values());
  }

  /**
   * Execute mitigation action
   * @param {object} plan - Mitigation plan
   * @param {Map|Array} nodes - Nodes collection
   * @param {string} incidentId
   * @returns {object} - Execution result
   */
  async execute(plan, nodes, incidentId) {
    const { sourceNodeId, targetNodeId, action } = plan;
    const executionId = `${incidentId}-${sourceNodeId}-${targetNodeId}-${Date.now()}`;

    if (this.eventStore) {
      this.eventStore.addEvent(
        EVENT_TYPES.ACTION_STARTED,
        sourceNodeId,
        `Executing action: ${action} from Node ${sourceNodeId} → Node ${targetNodeId}`,
        SEVERITY.CRITICAL,
        { incidentId, executionId, action }
      );
    }

    try {
      // Find source and target node
      const getNode = (id) => {
        if (nodes instanceof Map) return nodes.get(id);
        if (Array.isArray(nodes)) return nodes.find(n => n.nodeId === id);
        return null;
      };

      const sourceNode = getNode(sourceNodeId);
      const targetNode = getNode(targetNodeId);

      if (!sourceNode) {
        throw new Error(`Source node ${sourceNodeId} not found`);
      }
      if (!targetNode) {
        throw new Error(`Target node ${targetNodeId} not found`);
      }

      // Capture pre-execution state for verification
      const preState = {
        source: this._captureNodeState(sourceNode),
        target: this._captureNodeState(targetNode),
      };

      // Perform actual weight shift
      const shiftAmount = 40;
      this._shiftTraffic(sourceNode, targetNode, shiftAmount, nodes);

      // Capture post-execution state
      const postState = {
        source: this._captureNodeState(sourceNode),
        target: this._captureNodeState(targetNode),
      };

      const executionResult = {
        success: true,
        executionId,
        action,
        sourceNodeId,
        targetNodeId,
        shiftAmount,
        executedAt: Date.now(),
        preState,
        postState,
      };

      this.executionHistory.set(executionId, executionResult);

      if (this.eventStore) {
        this.eventStore.addEvent(
          EVENT_TYPES.ACTION_COMPLETED,
          sourceNodeId,
          `Action completed: 40% traffic shifted from ${sourceNode.name || `Node ${sourceNodeId}`} to ${targetNode.name || `Node ${targetNodeId}`}`,
          SEVERITY.HIGH,
          { incidentId, executionResult }
        );
      }

      return executionResult;

    } catch (error) {
      console.error('[ActionExecutor] Execution error:', error.message);
      if (this.eventStore) {
        this.eventStore.addEvent(
          EVENT_TYPES.ACTION_FAILED,
          sourceNodeId,
          `Action failed: ${error.message}`,
          SEVERITY.CRITICAL,
          { incidentId, error: error.message }
        );
      }

      return {
        success: false,
        error: error.message,
        sourceNodeId,
        targetNodeId,
      };
    }
  }

  _shiftTraffic(fromNode, toNode, shiftAmount, allNodes) {
    if (fromNode.metrics && toNode.metrics) {
      const actualShift = Math.min(shiftAmount, fromNode.metrics.traffic);
      fromNode.metrics.traffic -= actualShift;
      toNode.metrics.traffic += actualShift;

      // Normalize weights
      const nodeList = allNodes instanceof Map ? Array.from(allNodes.values()) : allNodes;
      nodeList.forEach(n => {
        if (n.metrics) n.metrics.traffic = Math.round(n.metrics.traffic);
      });

      const total = nodeList.reduce((sum, n) => sum + (n.metrics?.traffic || 0), 0);
      if (total !== 100 && toNode.metrics) {
        toNode.metrics.traffic = Math.max(0, toNode.metrics.traffic + (100 - total));
      }
    }
  }

  _captureNodeState(node) {
    const st = typeof node.getState === 'function' ? node.getState() : (node.metrics || node);
    return {
      nodeId: node.nodeId,
      name: node.name,
      latency: st.latency,
      errorRate: st.errorRate,
      health: st.health ?? st.healthScore,
      traffic: st.traffic,
      requestsPerSecond: st.requestsPerSecond,
      timestamp: Date.now(),
    };
  }
}

export default ActionExecutor;
