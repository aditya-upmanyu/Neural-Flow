// backend/src/monitor.js
// Pings real websites + updates node metrics

import axios from 'axios';
import { calculateHealthScore, getNodeStatus } from './aiEngine.js';
import { ATTACK_ENDPOINTS } from './data.js';

// Gaussian noise helper — makes metrics look realistic
const gauss = (mean, std) => {
  const u1 = Math.random(), u2 = Math.random();
  return mean + std * Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
};
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

// Ping a URL and return real latency
const pingUrl = async (url) => {
  const start = Date.now();
  try {
    await axios.get(url, {
      timeout: 8000,
      headers: { 'Cache-Control': 'no-cache' }
    });
    return { latency: Date.now() - start, error: false };
  } catch {
    return { latency: 9999, error: true };
  }
};

// Update a single node's metrics
const updateNode = async (node, attackState) => {
  const isAttacked = attackState.active && attackState.targetNodeId === node.id;
  // Use slow endpoint if attacked — gives REAL latency spike
  const urlToUse = isAttacked ? ATTACK_ENDPOINTS[node.id] : node.url;
  const { latency } = await pingUrl(urlToUse);
  node.latency = latency;

  const intensity = (attackState.intensity || 70) / 100;

  if (isAttacked) {
    node.cpu       = clamp(gauss(75 * intensity, 10), 60, 95);
    node.memory    = clamp(gauss(65 * intensity,  8), 50, 90);
    node.errorRate = clamp(gauss(15 * intensity,  5),  5, 40);
    node.queue     = clamp(Math.floor(gauss(200 * intensity, 50)), 50, 490);
  } else {
    // Normal operation — gentle gaussian fluctuation
    node.cpu       = clamp(gauss(20, 4),   8, 40);
    node.memory    = clamp(gauss(25, 5),  10, 45);
    node.errorRate = clamp(gauss(0.5, 0.5), 0,  3);
    node.queue     = clamp(Math.floor(gauss(5, 3)), 0, 25);
  }

  node.healthScore = calculateHealthScore(node);
  node.status      = getNodeStatus(node);

  // Track last 20 readings for graph + prediction
  node.latencyHistory.push({ time: Date.now(), value: node.latency });
  if (node.latencyHistory.length > 20) node.latencyHistory.shift();

  return node;
};

export { updateNode };
export default { updateNode };
