// eventStore.js - In-memory event persistence (max 1000 events)

class EventStore {
  constructor(maxEvents = 1000) {
    this.events = [];
    this.maxEvents = maxEvents;
    this.eventIdCounter = 0;
    this.startTime = Date.now();
  }

  // Add a new event
  addEvent(type, nodeId, message, severity, data = {}) {
    const event = {
      id: ++this.eventIdCounter,
      timestamp: Date.now(),
      type: type, // ALERT, AI_DECISION, REROUTE, RECOVERY, INFO, METRIC_SPIKE
      nodeId: nodeId,
      message: message,
      severity: severity, // LOW, MEDIUM, HIGH, CRITICAL
      data: data
    };

    this.events.unshift(event); // Add to beginning

    // Keep only last maxEvents
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(0, this.maxEvents);
    }

    return event;
  }

  // Get all events
  getAllEvents() {
    return this.events;
  }

  // Get events by type
  getEventsByType(type) {
    return this.events.filter(event => event.type === type);
  }

  // Get events by node
  getEventsByNode(nodeId) {
    return this.events.filter(event => event.nodeId === nodeId);
  }

  // Get recent events (last N)
  getRecentEvents(count = 50) {
    return this.events.slice(0, count);
  }

  // Get events by time range
  getEventsByTimeRange(startTime, endTime) {
    return this.events.filter(event => 
      event.timestamp >= startTime && event.timestamp <= endTime
    );
  }

  // Search events by message content
  searchEvents(query) {
    const lowerQuery = query.toLowerCase();
    return this.events.filter(event => 
      event.message.toLowerCase().includes(lowerQuery)
    );
  }

  // Get event statistics
  getStatistics() {
    const now = Date.now();
    const last24h = now - (24 * 60 * 60 * 1000);
    const recentEvents = this.events.filter(e => e.timestamp >= last24h);

    const attacksBlocked = this.events.filter(e => 
      e.type === 'AI_DECISION' || e.type === 'REROUTE'
    ).length;

    const criticalEvents = this.events.filter(e => 
      e.severity === 'CRITICAL'
    ).length;

    const avgResponseTime = this.calculateAvgResponseTime();

    return {
      totalEvents: this.events.length,
      eventsLast24h: recentEvents.length,
      attacksBlocked: attacksBlocked,
      criticalEvents: criticalEvents,
      avgResponseTime: avgResponseTime,
      uptime: this.calculateUptime(),
      costSavings: attacksBlocked * 15 // $15 saved per attack vs manual
    };
  }

  calculateAvgResponseTime() {
    const decisions = this.events.filter(e => e.type === 'AI_DECISION');
    if (decisions.length === 0) return 0;

    const totalTime = decisions.reduce((sum, event) => {
      return sum + (event.data.responseTimeMs || 200);
    }, 0);

    return Math.round(totalTime / decisions.length);
  }

  calculateUptime() {
    const uptimeMs = Date.now() - this.startTime;
    const uptimeSec = Math.floor(uptimeMs / 1000);
    // Each CRITICAL ALERT event represents ~0.5s estimated downtime
    const downtime = this.events.filter(e => 
      e.severity === 'CRITICAL' && e.type === 'ALERT'
    ).length * 0.5;

    const totalSec = Math.max(uptimeSec, 1);
    const uptime = ((totalSec - downtime) / totalSec) * 100;
    return Math.round(Math.max(0, Math.min(100, uptime)) * 100) / 100;
  }

  // Clear all events (for testing)
  clear() {
    this.events = [];
    this.eventIdCounter = 0;
  }

  // Get event count by type
  getEventCountByType() {
    const counts = {};
    this.events.forEach(event => {
      counts[event.type] = (counts[event.type] || 0) + 1;
    });
    return counts;
  }

  // Get attack frequency heatmap data (7 days x 24 hours)
  getAttackHeatmap() {
    const heatmap = Array(7).fill(null).map(() => Array(24).fill(0));
    
    const attacks = this.events.filter(e => 
      e.type === 'ALERT' && e.severity === 'CRITICAL'
    );

    attacks.forEach(event => {
      const date = new Date(event.timestamp);
      const day = date.getDay(); // 0-6
      const hour = date.getHours(); // 0-23
      heatmap[day][hour]++;
    });

    return heatmap;
  }
}

export default EventStore;
