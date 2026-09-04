// NFV5 Core Systems - Central Export

export { IncidentStateMachine, STATES, TRANSITIONS } from './incidentStateMachine.js';
export {
  EVENT_TYPES,
  SEVERITY,
  createEvent,
  mapLegacyType,
  getEventDescription,
  shouldBroadcast,
} from './eventTypes.js';
