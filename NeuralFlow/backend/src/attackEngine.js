// attackEngine.js - Attack scenario manager with auto-trigger and recovery

class AttackEngine {
  constructor(eventStore) {
    this.eventStore = eventStore;
    this.activeAttacks = new Map(); // nodeId -> attack info
    this.attackHistory = [];
    this.autoAttackEnabled = true;
    this.nextAutoAttackTime = Date.now() + this.getRandomInterval();
    
    this.attackTypes = ['DDoS', 'SlowLoris', 'HTTPFlood', 'TrafficSpike', 'MemoryLeak'];
  }

  getRandomInterval() {
    // 25-40 seconds
    return (25 + Math.random() * 15) * 1000;
  }

  getRandomDuration() {
    // 10-20 seconds
    return (10 + Math.random() * 10) * 1000;
  }

  // Check if it's time for auto-attack
  shouldTriggerAutoAttack() {
    if (!this.autoAttackEnabled) return false;
    return Date.now() >= this.nextAutoAttackTime;
  }

  // Launch an attack on a node
  launchAttack(node, attackType = null, intensity = 70, duration = null) {
    // Random attack type if not specified
    if (!attackType) {
      attackType = this.attackTypes[Math.floor(Math.random() * this.attackTypes.length)];
    }

    // Random duration if not specified
    if (!duration) {
      duration = this.getRandomDuration();
    }

    // Start attack on node
    node.startAttack(attackType, intensity);

    const attackInfo = {
      nodeId: node.nodeId,
      attackType: attackType,
      intensity: intensity,
      startTime: Date.now(),
      endTime: Date.now() + duration,
      duration: duration,
      autoRecover: true
    };

    this.activeAttacks.set(node.nodeId, attackInfo);

    // Log event
    this.eventStore.addEvent(
      'ALERT',
      node.nodeId,
      `${attackType} attack detected on ${node.name} (${intensity}% intensity)`,
      'CRITICAL',
      { attackType, intensity, duration }
    );

    console.log(`🚨 ${attackType} attack launched on Node ${node.nodeId} (${intensity}% intensity, ${duration/1000}s duration)`);

    return attackInfo;
  }

  // Update all active attacks
  update(nodes) {
    const now = Date.now();

    // Check for auto-attack trigger
    if (this.shouldTriggerAutoAttack() && this.activeAttacks.size === 0) {
      // Pick a random healthy node
      const healthyNodes = nodes.filter(n => n.getState().health > 60);
      if (healthyNodes.length > 0) {
        const targetNode = healthyNodes[Math.floor(Math.random() * healthyNodes.length)];
        this.launchAttack(targetNode);
        this.nextAutoAttackTime = now + this.getRandomInterval();
      }
    }

    // Check for attacks that should end
    const attacksToEnd = [];
    
    this.activeAttacks.forEach((attack, nodeId) => {
      if (now >= attack.endTime && attack.autoRecover) {
        attacksToEnd.push(nodeId);
      }
    });

    // End attacks
    attacksToEnd.forEach(nodeId => {
      const node = nodes.find(n => n.nodeId === nodeId);
      if (node) {
        this.endAttack(node);
      }
    });
  }

  // Manually end an attack
  endAttack(node) {
    const attack = this.activeAttacks.get(node.nodeId);
    if (!attack) return;

    node.endAttack();
    this.activeAttacks.delete(node.nodeId);

    // Add to history
    this.attackHistory.unshift({
      ...attack,
      actualEndTime: Date.now(),
      actualDuration: Date.now() - attack.startTime
    });

    // Keep only last 50 attacks in history
    if (this.attackHistory.length > 50) {
      this.attackHistory = this.attackHistory.slice(0, 50);
    }

    // Log recovery event
    this.eventStore.addEvent(
      'RECOVERY',
      node.nodeId,
      `${attack.attackType} attack subsided on ${node.name}`,
      'MEDIUM',
      { 
        attackType: attack.attackType,
        duration: Date.now() - attack.startTime
      }
    );

    console.log(`✅ Attack on Node ${node.nodeId} ended - entering recovery phase`);
  }

  // Get attack description
  getAttackDescription(attackType) {
    const descriptions = {
      'DDoS': 'Distributed Denial of Service - flood of malicious requests overwhelming server capacity',
      'SlowLoris': 'Slow connection attack - keeps many connections open with slow headers, exhausting server resources',
      'HTTPFlood': 'HTTP Flood - high-volume legitimate-looking HTTP requests targeting application layer',
      'TrafficSpike': 'Sudden legitimate traffic surge - 10x normal request volume from real users',
      'MemoryLeak': 'Resource exhaustion - gradual memory consumption leading to performance degradation'
    };
    return descriptions[attackType] || 'Unknown attack type';
  }

  // Get attack statistics
  getStatistics() {
    const totalAttacks = this.attackHistory.length + this.activeAttacks.size;
    
    const attacksByType = {};
    this.attackTypes.forEach(type => attacksByType[type] = 0);
    
    this.attackHistory.forEach(attack => {
      attacksByType[attack.attackType]++;
    });
    
    this.activeAttacks.forEach(attack => {
      attacksByType[attack.attackType]++;
    });

    const avgDuration = this.attackHistory.length > 0
      ? this.attackHistory.reduce((sum, a) => sum + a.actualDuration, 0) / this.attackHistory.length
      : 0;

    return {
      totalAttacks,
      activeAttacks: this.activeAttacks.size,
      attacksByType,
      avgDuration: Math.round(avgDuration / 1000), // in seconds
      lastAttackTime: this.attackHistory.length > 0 ? this.attackHistory[0].startTime : null
    };
  }

  // Get active attack info for a node
  getActiveAttack(nodeId) {
    return this.activeAttacks.get(nodeId) || null;
  }

  // Check if node is under attack
  isUnderAttack(nodeId) {
    return this.activeAttacks.has(nodeId);
  }

  // Enable/disable auto-attacks
  setAutoAttackEnabled(enabled) {
    this.autoAttackEnabled = enabled;
    if (enabled) {
      this.nextAutoAttackTime = Date.now() + this.getRandomInterval();
    }
  }

  // Force trigger an auto-attack now (for demo purposes)
  triggerAutoAttackNow(nodes) {
    const healthyNodes = nodes.filter(n => n.getState().health > 60 && !this.isUnderAttack(n.nodeId));
    if (healthyNodes.length > 0) {
      const targetNode = healthyNodes[Math.floor(Math.random() * healthyNodes.length)];
      this.launchAttack(targetNode);
      this.nextAutoAttackTime = Date.now() + this.getRandomInterval();
      return targetNode.nodeId;
    }
    return null;
  }
}

export default AttackEngine;
