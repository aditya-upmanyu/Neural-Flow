// NFV5 Correlator - Signal Correlation Engine
// Groups related signals/events into single incident to avoid duplicate incidents

import { createEvent, EVENT_TYPES, SEVERITY } from '../core/index.js';

/**
 * Correlator groups related signals into single incident
 */
export class Correlator {
  constructor(eventStore) {
    this.eventStore = eventStore;
    this.correlationWindow = 30000; // 30 seconds
    this.activeIncidents = new Map(); // nodeId → incident info
  }

  /**
   * Correlate signals - determine if this is part of existing incident or new
   * @param {object} evidence - Evidence bundle from investigator
   * @param {string} incidentId - Potential incident ID
   * @returns {object} - Correlation result
   */
  correlate(evidence, incidentId) {
    const { nodeId, capturedAt } = evidence;

    if (this.eventStore) {
      this.eventStore.addEvent(
        EVENT_TYPES.CORRELATION_STARTED,
        nodeId,
        `Correlating signals for node ${nodeId}`,
        SEVERITY.LOW,
        { incidentId }
      );
    }

    // Check if this node has an active incident
    const existingIncident = this.activeIncidents.get(nodeId);

    let isNewIncident = true;
    let correlatedWith = null;

    if (existingIncident) {
      const timeSinceLastSignal = capturedAt - existingIncident.lastSignalAt;

      // If within correlation window, treat as same incident
      if (timeSinceLastSignal < this.correlationWindow) {
        isNewIncident = false;
        correlatedWith = existingIncident.incidentId;
        existingIncident.signalCount++;
        existingIncident.lastSignalAt = capturedAt;
      } else {
        this.activeIncidents.delete(nodeId);
      }
    }

    // If new incident, register it
    if (isNewIncident) {
      this.activeIncidents.set(nodeId, {
        incidentId,
        nodeId,
        startedAt: capturedAt,
        lastSignalAt: capturedAt,
        signalCount: 1,
      });
    }

    const result = {
      incidentId: isNewIncident ? incidentId : correlatedWith,
      isNewIncident,
      correlatedWith,
      signalCount: isNewIncident ? 1 : existingIncident.signalCount,
    };

    if (this.eventStore) {
      this.eventStore.addEvent(
        EVENT_TYPES.CORRELATION_COMPLETED,
        nodeId,
        isNewIncident
          ? `New incident ${incidentId} started for node ${nodeId}`
          : `Signals correlated with existing incident ${correlatedWith}`,
        isNewIncident ? SEVERITY.HIGH : SEVERITY.MEDIUM,
        { incidentId: result.incidentId, result }
      );
    }

    return result;
  }

  /**
   * Close incident correlation for node
   */
  closeIncident(nodeId) {
    this.activeIncidents.delete(nodeId);
  }

  /**
   * Get active incidents
   */
  getActiveIncidents() {
    return Array.from(this.activeIncidents.values());
  }

  /**
   * Check if node has active incident
   */
  hasActiveIncident(nodeId) {
    return this.activeIncidents.has(nodeId);
  }
}

export default Correlator;
