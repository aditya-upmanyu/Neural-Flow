// backend/src/data.js
// Node definitions + URL mappings for real security testing websites

const REAL_ENDPOINTS = {
  1: 'http://demo.testfire.net',
  2: 'http://zero.webappsecurity.com',
  3: 'http://testphp.vulnweb.com'
};

// When under attack, backend pings SLOW endpoints — giving REAL latency spikes
const ATTACK_ENDPOINTS = {
  1: 'https://httpbin.org/delay/2',
  2: 'https://httpbin.org/delay/3',
  3: 'https://httpbin.org/delay/1'
};

const createInitialNodes = () => ([
  {
    id: 1,
    name: 'Testfire Bank',
    location: 'US Server (Primary)',
    url: REAL_ENDPOINTS[1],
    status: 'healthy',
    latency: 0,
    cpu: 22,
    memory: 28,
    errorRate: 0,
    queue: 5,
    healthScore: 94,
    traffic: 60,
    latencyHistory: [],
    isUnderAttack: false
  },
  {
    id: 2,
    name: 'Zero Bank',
    location: 'EU Server (Secondary)',
    url: REAL_ENDPOINTS[2],
    status: 'healthy',
    latency: 0,
    cpu: 18,
    memory: 22,
    errorRate: 0,
    queue: 3,
    healthScore: 97,
    traffic: 25,
    latencyHistory: [],
    isUnderAttack: false
  },
  {
    id: 3,
    name: 'VulnWeb PHP',
    location: 'Asia Server (Backup)',
    url: REAL_ENDPOINTS[3],
    status: 'healthy',
    latency: 0,
    cpu: 12,
    memory: 18,
    errorRate: 0,
    queue: 1,
    healthScore: 98,
    traffic: 15,
    latencyHistory: [],
    isUnderAttack: false
  }
]);

export { createInitialNodes, REAL_ENDPOINTS, ATTACK_ENDPOINTS };
export default { createInitialNodes, REAL_ENDPOINTS, ATTACK_ENDPOINTS };
