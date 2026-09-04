import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOGS_DIR = path.join(__dirname, '../logs');
const LOGS_FILE = path.join(LOGS_DIR, 'reroute_events.json');

// Ensure logs directory exists
if (!fs.existsSync(LOGS_DIR)) {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
}

export class InfrastructureAgent {
  constructor(onStateUpdateCallback) {
    this.onStateUpdate = onStateUpdateCallback || (() => {});
    
    // Initial states of 5 nodes
    this.nodes = [
      { id: 'n1', name: 'Aether-01', region: 'us-east-1', ip: '10.0.1.12', latency: 45, baseLatency: 45, load: 12, status: 'OPTIMAL' },
      { id: 'n2', name: 'Helios-02', region: 'eu-west-1', ip: '10.0.2.45', latency: 82, baseLatency: 82, load: 25, status: 'OPTIMAL' },
      { id: 'n3', name: 'Zephyr-03', region: 'ap-southeast-1', ip: '10.0.3.78', latency: 112, baseLatency: 112, load: 18, status: 'OPTIMAL' },
      { id: 'n4', name: 'Chronos-04', region: 'us-west-2', ip: '10.0.4.99', latency: 65, baseLatency: 65, load: 30, status: 'OPTIMAL' },
      { id: 'n5', name: 'Titan-05', region: 'sa-east-1', ip: '10.0.5.15', latency: 145, baseLatency: 145, load: 42, status: 'OPTIMAL' }
    ];

    this.events = [];
    this.loadLogs();
    
    this.intervalId = null;
    this.spikeChance = 0.08; // 8% chance per tick to trigger a spike on a node
  }

  start() {
    console.log('⚡ InfrastructureAgent: Starting autonomous orchestration loop...');
    // Run the monitor loop every 1.5 seconds
    this.intervalId = setInterval(() => {
      this.monitorAndOrchestrate();
    }, 1500);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      console.log('🔌 InfrastructureAgent: Orchestration loop stopped.');
    }
  }

  loadLogs() {
    try {
      if (fs.existsSync(LOGS_FILE)) {
        const fileContent = fs.readFileSync(LOGS_FILE, 'utf-8');
        this.events = JSON.parse(fileContent);
      } else {
        this.events = [];
        this.saveLogs();
      }
    } catch (error) {
      console.error('Failed to load logs, starting fresh:', error);
      this.events = [];
    }
  }

  saveLogs() {
    try {
      fs.writeFileSync(LOGS_FILE, JSON.stringify(this.events, null, 2), 'utf-8');
    } catch (error) {
      console.error('Failed to write logs to file:', error);
    }
  }

  logEvent(type, nodeId, nodeName, message, details = {}) {
    const event = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      timestamp: new Date().toISOString(),
      type, // 'ALERT' | 'REROUTE' | 'RECOVERY' | 'MANUAL'
      nodeId,
      nodeName,
      message,
      details
    };
    this.events.unshift(event); // Add to beginning of array
    // Cap at 100 events to prevent massive files
    if (this.events.length > 100) {
      this.events = this.events.slice(0, 100);
    }
    this.saveLogs();
    return event;
  }

  monitorAndOrchestrate() {
    let stateChanged = false;
    let latestEvent = null;

    // Check if any node is currently reconfiguring
    const reconfiguringNode = this.nodes.find(n => n.status === 'RECONFIGURING');

    // 1. Simulate Latency & Load Fluctuations
    this.nodes.forEach(node => {
      if (node.status === 'RECONFIGURING') {
        // Latency decays during reconfiguration
        const targetLatency = Math.max(node.baseLatency, Math.round(node.latency * 0.6));
        if (node.latency !== targetLatency) {
          node.latency = targetLatency;
          node.load = Math.max(10, Math.round(node.load * 0.9));
          stateChanged = true;
        }
        return;
      }

      // Fluctuating normal node latency
      let diff = Math.floor(Math.random() * 11) - 5; // -5ms to +5ms
      let newLatency = Math.max(15, node.latency + diff);
      
      // Limit normal drift from base latency
      const maxNormalDrift = 20;
      if (Math.abs(newLatency - node.baseLatency) > maxNormalDrift) {
        newLatency = node.baseLatency + (newLatency > node.baseLatency ? maxNormalDrift : -maxNormalDrift);
      }
      
      // Load fluctuations
      let loadDiff = Math.floor(Math.random() * 5) - 2; // -2% to +2%
      let newLoad = Math.max(5, Math.min(95, node.load + loadDiff));

      if (node.latency !== newLatency || node.load !== newLoad) {
        node.latency = newLatency;
        node.load = newLoad;
        stateChanged = true;
      }
    });

    // 2. Trigger random latency spikes (if no node is already reconfiguring or degraded)
    const activeAnomaly = this.nodes.some(n => n.status === 'DEGRADED' || n.status === 'RECONFIGURING');
    if (!activeAnomaly && Math.random() < this.spikeChance) {
      // Pick a random node to spike
      const targetIndex = Math.floor(Math.random() * this.nodes.length);
      const node = this.nodes[targetIndex];
      
      node.latency = Math.floor(Math.random() * 200) + 320; // 320ms - 520ms
      node.load = Math.floor(Math.random() * 20) + 75; // 75% - 95%
      node.status = 'DEGRADED';
      
      stateChanged = true;
      
      latestEvent = this.logEvent(
        'ALERT',
        node.id,
        node.name,
        `High latency anomaly detected on node ${node.name}: ${node.latency}ms`,
        { latency: node.latency, load: node.load }
      );
      console.warn(`⚠️ Anomaly: Node ${node.name} latency spiked to ${node.latency}ms!`);
    }

    // 3. Agentic Decision Engine: Check and auto-reroute
    this.nodes.forEach(node => {
      if (node.latency > 300 && node.status === 'DEGRADED') {
        node.status = 'RECONFIGURING';
        stateChanged = true;

        latestEvent = this.logEvent(
          'REROUTE',
          node.id,
          node.name,
          `Autonomous Orchestrator: Re-routing network paths for ${node.name} to bypass congested node.`,
          { oldLatency: node.latency }
        );
        console.log(`🤖 Agentic Action: Reconfiguring node ${node.name} paths to self-heal...`);

        // Schedule auto-recovery / self-healing after 3 seconds
        setTimeout(() => {
          this.recoverNode(node.id);
        }, 3000);
      }
    });

    if (stateChanged) {
      this.onStateUpdate(this.nodes, latestEvent);
    }
  }

  // Force a manual spike from frontend (for demo purposes)
  triggerManualSpike(nodeId) {
    const node = this.nodes.find(n => n.id === nodeId);
    if (!node) return;

    if (node.status === 'RECONFIGURING') {
      console.log(`Node ${node.name} is already reconfiguring. Cannot spike.`);
      return;
    }

    node.latency = Math.floor(Math.random() * 150) + 350; // 350ms - 500ms
    node.load = Math.floor(Math.random() * 15) + 80;
    node.status = 'DEGRADED';
    
    const event = this.logEvent(
      'ALERT',
      node.id,
      node.name,
      `Manual latency spike injected on node ${node.name}: ${node.latency}ms`,
      { latency: node.latency, load: node.load }
    );

    console.warn(`🚨 Manual Anomaly Injected: Node ${node.name} spiked to ${node.latency}ms`);
    this.onStateUpdate(this.nodes, event);
  }

  // Self-heal and recover node
  recoverNode(nodeId) {
    const node = this.nodes.find(n => n.id === nodeId);
    if (!node) return;

    node.status = 'OPTIMAL';
    node.latency = node.baseLatency + Math.floor(Math.random() * 10) - 5;
    node.load = Math.max(10, Math.round(node.load * 0.4)); // Reduce load to baseline range

    const event = this.logEvent(
      'RECOVERY',
      node.id,
      node.name,
      `Network health restored for ${node.name}. Path rerouting completed.`,
      { latency: node.latency, load: node.load }
    );

    console.log(`✅ Recovery: Node ${node.name} restored to optimal state.`);
    this.onStateUpdate(this.nodes, event);
  }

  getLogs() {
    return this.events;
  }
}
