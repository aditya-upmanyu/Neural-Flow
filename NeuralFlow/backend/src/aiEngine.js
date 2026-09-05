// backend/src/aiEngine.js
// AI decision logic + health scoring + playbook definitions

const THRESHOLD = 300; // ms — above this = action needed

const calculateHealthScore = (node) => {
  const latencyScore = Math.max(0, (1 - Math.min(node.latency, 1000) / 1000)) * 30;
  const cpuScore     = (1 - node.cpu / 100) * 25;
  const memoryScore  = (1 - node.memory / 100) * 20;
  const errorScore   = (1 - Math.min(node.errorRate, 100) / 100) * 15;
  const queueScore   = (1 - Math.min(node.queue, 500) / 500) * 10;
  return Math.round(latencyScore + cpuScore + memoryScore + errorScore + queueScore);
};

const getNodeStatus = (node) => {
  if (node.latency > 800 || node.healthScore < 40) return 'critical';
  if (node.latency > THRESHOLD || node.healthScore < 65) return 'warning';
  return 'healthy';
};

const makeDecision = (nodes) => {
  const startTime = Date.now(); // Measure actual decision time
  
  // Find the node that needs help
  const problemNode = nodes.find(n =>
    n.status === 'critical' || (n.status === 'warning' && n.latency > THRESHOLD)
  );
  if (!problemNode) return null;

  // Find best healthy node to shift traffic to
  const candidates = nodes
    .filter(n => n.id !== problemNode.id && n.healthScore > 60)
    .sort((a, b) => b.healthScore - a.healthScore);

  if (!candidates.length) return null;
  const best = candidates[0];

  // Build reasoning dynamically based on what triggered this
  const reasons = [];
  if (problemNode.latency > THRESHOLD)
    reasons.push(`Latency threshold breached: ${problemNode.latency}ms > ${THRESHOLD}ms`);
  if (problemNode.cpu > 70)
    reasons.push(`CPU critical zone: ${Math.round(problemNode.cpu)}% utilization`);
  if (problemNode.errorRate > 5)
    reasons.push(`Error rate elevated: ${Math.round(problemNode.errorRate)}%`);
  reasons.push(`Node ${best.id} has ${Math.round(100 - best.traffic)}% spare capacity available`);
  reasons.push(`Node ${best.id} health score: ${best.healthScore}/100 — optimal condition`);

  // Select playbook based on attack pattern
  let playbook = 'traffic_shift';
  if (problemNode.latency > 1000) playbook = 'ddos_shield';
  else if (problemNode.cpu > 75)  playbook = 'flash_crowd';

  const decisionTimeMs = Date.now() - startTime; // Actual elapsed time

  return {
    fromNodeId: problemNode.id,
    toNodeId: best.id,
    confidence: Math.min(99, Math.round(best.healthScore * 0.96)),
    reasons,
    alternatives: candidates.slice(1).map(n =>
      `Node ${n.id} (${n.location}) — Health: ${n.healthScore}/100 — not selected (lower score)`
    ),
    playbook,
    decisionTimeMs,
    estimatedSavings: 20 + Math.floor(Math.random() * 40)
  };
};

// Linear regression to predict when a node will breach threshold
const predictBreach = (history, threshold) => {
  if (history.length < 4) return null;
  const recent = history.slice(-6).map(h => h.value);
  const slope = (recent[recent.length - 1] - recent[0]) / recent.length;
  if (slope <= 0) return null;
  const secs = Math.round(((threshold - recent[recent.length - 1]) / slope) * 2);
  return (secs > 5 && secs < 300) ? secs : null;
};

const PLAYBOOKS = {
  ddos_shield: {
    name: '🛡️ DDoS Shield Protocol',
    steps: [
      { action: 'Rate limiting suspicious source IPs',       duration: 800  },
      { action: 'Activating traffic scrubbing layer',         duration: 1200 },
      { action: 'Rerouting clean traffic to healthy node',    duration: 600  },
      { action: 'Updating firewall blacklist rules',          duration: 400  },
      { action: 'Alerting security operations team',          duration: 300  }
    ]
  },
  flash_crowd: {
    name: '⚡ Flash Crowd Handler',
    steps: [
      { action: 'Detecting peak traffic burst pattern',       duration: 600  },
      { action: 'Activating CDN cache warm-up',              duration: 900  },
      { action: 'Distributing load across available nodes',   duration: 700  },
      { action: 'Stabilizing request queue depth',            duration: 500  },
      { action: 'Scaling notifications dispatched',           duration: 300  }
    ]
  },
  traffic_shift: {
    name: '🔄 Traffic Rerouting Protocol',
    steps: [
      { action: 'Identifying optimal target node',            duration: 400  },
      { action: 'Initiating graceful traffic drain',          duration: 600  },
      { action: 'Redirecting live connections',               duration: 500  },
      { action: 'Verifying target node stability',            duration: 700  },
      { action: 'Confirming successful handover',             duration: 300  }
    ]
  }
};

export {
  makeDecision, calculateHealthScore, getNodeStatus,
  predictBreach, PLAYBOOKS, THRESHOLD
};

export default {
  makeDecision, calculateHealthScore, getNodeStatus,
  predictBreach, PLAYBOOKS, THRESHOLD
};
