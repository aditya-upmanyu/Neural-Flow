// systemTest.js - Comprehensive Automated Test Suite for NFV5 Control Plane & AI Engine
import assert from 'assert';
import brain from 'brain.js';
import { runSafetyGate, SAFETY_OUTCOMES } from '../safetyGate.js';
import { runVerification, VERIFICATION_RESULTS } from '../verificationEngine.js';
import { createReceipt, getAllReceipts, getReceipt } from '../decisionReceipt.js';
import { STATES, IncidentStateMachine } from '../core/incidentStateMachine.js';

let passed = 0;
let failed = 0;

function it(desc, fn) {
  try {
    fn();
    console.log(`  ✓ ${desc}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ ${desc}`);
    console.error(`    ${err.message}`);
    failed++;
  }
}

async function runAsyncTest(desc, fn) {
  try {
    await fn();
    console.log(`  ✓ ${desc}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ ${desc}`);
    console.error(`    ${err.message}`);
    failed++;
  }
}

console.log('\n🧪 Running NeuralFlow V5 Comprehensive System Tests...\n');

// ── TEST 1: Brain.js ML Training & Anomaly Inference ──
console.log('📦 1. Machine Learning Anomaly Detection:');
it('should train a neural network and detect anomalous traffic patterns', () => {
  const net = new brain.NeuralNetwork({ hiddenLayers: [5, 5] });
  const trainingData = [
    { input: [0.05, 0.0, 0.1], output: [0] },
    { input: [0.1, 0.0, 0.15], output: [0] },
    { input: [0.15, 0.0, 0.2], output: [0] },
    { input: [0.85, 0.3, 0.9], output: [1] },
    { input: [0.95, 0.5, 0.95], output: [1] },
  ];
  net.train(trainingData, { iterations: 2000, errorThresh: 0.005 });

  const normalResult = net.run([0.08, 0.0, 0.12]);
  const anomalyResult = net.run([0.9, 0.4, 0.9]);

  // Verify the net separates normal from anomaly (anomaly score must be meaningfully higher)
  assert(normalResult[0] < 0.45, `Normal traffic should have low score (got ${normalResult[0]})`);
  assert(anomalyResult[0] > 0.7, `Spiked traffic should have high score (got ${anomalyResult[0]})`);
  assert(anomalyResult[0] > normalResult[0] + 0.3, `Anomaly score must be at least 0.3 above normal (gap: ${(anomalyResult[0] - normalResult[0]).toFixed(3)})`);
});

// ── TEST 2: Deterministic Safety Gates ──
console.log('\n📦 2. Deterministic Safety Gates:');
it('should ALLOW_AUTONOMOUS_ACTION when all 8 safety gates pass with healthy target', () => {
  const sourceNode = { nodeId: 1, name: 'Node 1', health: 40, latency: 450, isUnderAttack: true };
  const targetNode = { nodeId: 2, name: 'Node 2', health: 95, latency: 25, cpu: 15, isUnderAttack: false };
  const altNode = { nodeId: 3, name: 'Node 3', health: 92, latency: 30, cpu: 20, isUnderAttack: false };
  const allNodes = [sourceNode, targetNode, altNode];

  const gateResult = runSafetyGate({
    confidence: 0.92,
    sourceNode,
    targetNode,
    allNodes,
    lastRerouteTime: Date.now() - 30000,
    lastTelemetryTime: Date.now() - 1000,
    actionType: 'REROUTE',
  });

  assert.strictEqual(gateResult.outcome, SAFETY_OUTCOMES.ALLOW_AUTONOMOUS_ACTION, 'Safety gate should approve for healthy target');
});

it('should REJECT when target node health is below threshold', () => {
  const sourceNode = { nodeId: 1, name: 'Node 1', health: 40, latency: 450, isUnderAttack: true };
  const targetNode = { nodeId: 2, name: 'Node 2', health: 30, latency: 600, cpu: 85, isUnderAttack: false }; // degraded target!
  const allNodes = [sourceNode, targetNode];

  const gateResult = runSafetyGate({
    confidence: 0.90,
    sourceNode,
    targetNode,
    allNodes,
    lastRerouteTime: Date.now() - 30000,
    lastTelemetryTime: Date.now() - 1000,
    actionType: 'REROUTE',
  });

  assert(gateResult.outcome !== SAFETY_OUTCOMES.ALLOW_AUTONOMOUS_ACTION, 'Safety gate must block degraded target');
});

// ── TEST 3: Incident State Machine Transitions ──
console.log('\n📦 3. Incident State Machine:');
it('should instantiate state machine and perform valid state transitions', () => {
  const sm = new IncidentStateMachine('NF-INC-TEST', 1);
  assert.strictEqual(sm.getState(), STATES.ANOMALY_DETECTED);

  assert.strictEqual(sm.canTransition(STATES.ANOMALY_DETECTED, STATES.INVESTIGATING), true);
  sm.transition(STATES.INVESTIGATING);
  assert.strictEqual(sm.getState(), STATES.INVESTIGATING);

  sm.transition(STATES.ANALYZING);
  sm.transition(STATES.GOAL_ESTABLISHED);
  sm.transition(STATES.PLANNING);
  sm.transition(STATES.POLICY_CHECK);
  sm.transition(STATES.EXECUTING);
  sm.transition(STATES.VERIFYING);
  sm.transition(STATES.RECOVERED);
  assert.strictEqual(sm.getState(), STATES.RECOVERED);
});

it('should block invalid transition from EXECUTING to IDLE directly', () => {
  const sm = new IncidentStateMachine('NF-INC-TEST-2', 1);
  sm.transition(STATES.INVESTIGATING);
  sm.transition(STATES.ANALYZING);
  sm.transition(STATES.GOAL_ESTABLISHED);
  sm.transition(STATES.PLANNING);
  sm.transition(STATES.POLICY_CHECK);
  sm.transition(STATES.EXECUTING);

  assert.strictEqual(sm.canTransition(sm.getState(), STATES.IDLE), false);
});

// ── TEST 4: Verification Engine (Action != Recovery) ──
console.log('\n📦 4. Independent Verification Engine:');
await runAsyncTest('should confirm recovery when post-action telemetry verifies SLA compliance', async () => {
  const targetNode = { nodeId: 2, name: 'Zero Bank' };
  const sourceNode = { nodeId: 1, name: 'Testfire Bank' };
  const preRerouteSnapshot = { latency: 450, errorRate: 15, health: 30 };

  const pollFunction = async () => ({
    latency: 28,
    errorRate: 0.0,
    health: 95,
    rps: 40,
  });

  const vResult = await runVerification({
    preRerouteSnapshot,
    targetNode,
    sourceNode,
    pollFunction,
    verificationWindowMs: 300,
  });

  assert.strictEqual(vResult.result, VERIFICATION_RESULTS.VERIFIED_SUCCESS, 'Verification should return VERIFIED_SUCCESS on healthy target');
});

// ── TEST 5: Decision Receipts & Audit Trail ──
console.log('\n📦 5. Auditable Decision Receipts:');
it('should generate structured decision receipts with complete provenance', () => {
  const receipt = createReceipt({
    incidentId: 'NF-TEST-002',
    action: 'REROUTE_TRAFFIC',
    sourceNodeId: 1,
    targetNodeId: 2,
    risk: { score: 88, severity: 'HIGH' },
    confidence: 0.94,
    policyChecks: [{ name: 'FRESHNESS_CHECK', passed: true }],
    verificationOutcome: 'RECOVERED',
    result: 'VERIFIED_SUCCESS',
  });

  assert.strictEqual(typeof receipt.id, 'string');
  assert.strictEqual(receipt.risk.score, 88);
  assert.strictEqual(receipt.confidence, 0.94);

  const found = getReceipt(receipt.id);
  assert.strictEqual(found.id, receipt.id);
  assert(getAllReceipts().length > 0);
});

console.log(`\n========================================`);
console.log(`Test Results: ${passed} passed, ${failed} failed`);
console.log(`========================================\n`);

if (failed > 0) {
  process.exit(1);
} else {
  console.log('✅ ALL CRITICAL SYSTEM & CONTROL PLANE TESTS PASSED!\n');
}
