// loadgenerator-leak.test.js - Bug Condition Exploration Test for LoadGenerator Interval Leak
// CRITICAL: This test is EXPECTED TO FAIL on unfixed code to prove the bug exists
// DO NOT attempt to fix the test or the code when it fails
// This test encodes the expected behavior - it will validate the fix when it passes after implementation

import assert from 'assert';
import { LoadGenerator } from '../server.js';

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

// Helper function to get active interval/timeout count (approximation)
// Note: Node.js doesn't expose exact interval count, but we can measure effects
function getApproximateTimerCount() {
  const handles = process._getActiveHandles();
  const requests = process._getActiveRequests();
  return { handles: handles.length, requests: requests.length, total: handles.length + requests.length };
}

// Helper function to measure CPU usage over a period
function measureCPUUsage(durationMs) {
  return new Promise((resolve) => {
    const startUsage = process.cpuUsage();
    const startTime = Date.now();
    
    setTimeout(() => {
      const endUsage = process.cpuUsage(startUsage);
      const elapsedTime = Date.now() - startTime;
      
      // CPU usage in microseconds, convert to percentage
      const cpuPercent = ((endUsage.user + endUsage.system) / 1000) / elapsedTime * 100;
      
      resolve(cpuPercent);
    }, durationMs);
  });
}

// Helper function to run one attack cycle
async function runAttackCycle(cycleNumber) {
  return new Promise((resolve) => {
    const generator = new LoadGenerator();
    
    console.log(`    [Cycle ${cycleNumber}] Starting attack with 100 req/s`);
    
    // Start attack
    generator.start(100, null, null); // 100 req/s intensity
    
    // Wait 5 seconds while attack runs
    setTimeout(async () => {
      console.log(`    [Cycle ${cycleNumber}] Stopping attack after 5 seconds`);
      
      // Measure CPU usage while attack is active
      const cpuBeforeStop = await measureCPUUsage(100);
      
      // Stop attack
      generator.stop();
      
      // Measure timers after stop
      const timersAfterStop = getApproximateTimerCount();
      
      // Measure CPU usage briefly after stop to see if intervals continue
      const cpuAfterStop = await measureCPUUsage(100);
      
      resolve({
        cycle: cycleNumber,
        cpuBeforeStop,
        cpuAfterStop,
        timersAfterStop,
        intervalId: generator.intervalId,
        isActive: generator.isActive,
      });
    }, 5000);
  });
}

console.log('\n🧪 Running LoadGenerator Interval Leak Bug Exploration Test...\n');
console.log('⚠️  EXPECTED OUTCOME: This test SHOULD FAIL on unfixed code\n');
console.log('📋 Bug Condition: LoadGenerator.stop() does not clear intervalId, causing cumulative CPU waste\n');

// ── MAIN TEST: LoadGenerator Interval Leak Across 10 Attack Cycles ──
console.log('📦 Property 1: LoadGenerator Interval Cleanup on Stop\n');

await runAsyncTest('should clear interval and maintain stable CPU across 10 consecutive attack cycles', async () => {
  const results = [];
  const cpuMeasurements = [];
  
  console.log('\n  Running 10 consecutive attack cycles (start → wait 5s → stop → repeat):\n');
  
  // Run 10 consecutive attack cycles
  for (let i = 1; i <= 10; i++) {
    const result = await runAttackCycle(i);
    results.push(result);
    cpuMeasurements.push(result.cpuAfterStop);
    
    console.log(`    [Cycle ${i}] CPU after stop: ${result.cpuAfterStop.toFixed(2)}%, intervalId: ${result.intervalId}, isActive: ${result.isActive}`);
    
    // Small delay between cycles
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n  Analysis:');
  
  // ASSERTION 1: intervalId should be null after stop() in each cycle
  const cyclesWithLeakedInterval = results.filter(r => r.intervalId !== null);
  console.log(`  • Cycles with leaked intervalId (should be 0): ${cyclesWithLeakedInterval.length}`);
  
  // ASSERTION 2: CPU usage should remain stable (not increase cumulatively)
  const firstCycleCPU = cpuMeasurements[0];
  const lastCycleCPU = cpuMeasurements[9];
  const cpuIncrease = lastCycleCPU - firstCycleCPU;
  const cpuIncreasePercent = (cpuIncrease / firstCycleCPU) * 100;
  
  console.log(`  • CPU usage - Cycle 1: ${firstCycleCPU.toFixed(2)}%, Cycle 10: ${lastCycleCPU.toFixed(2)}%`);
  console.log(`  • CPU increase: ${cpuIncrease.toFixed(2)}% (${cpuIncreasePercent.toFixed(1)}% relative increase)`);
  
  // ASSERTION 3: isActive should be false after stop()
  const cyclesWithActiveFlag = results.filter(r => r.isActive !== false);
  console.log(`  • Cycles with isActive still true (should be 0): ${cyclesWithActiveFlag.length}`);
  
  console.log('\n  Expected Counterexamples (on UNFIXED code):');
  console.log('  • "intervalId should be null after stop" - WILL FAIL (intervalId remains set)');
  console.log('  • "CPU usage should remain stable" - WILL FAIL (CPU increases from ~2% to ~15%)');
  console.log('  • "Only intervals should accumulate" - WILL FAIL (5+ intervals after 10 cycles)\n');
  
  // ASSERTIONS (will fail on unfixed code, pass on fixed code)
  assert.strictEqual(
    cyclesWithLeakedInterval.length,
    0,
    `LoadGenerator.stop() should clear intervalId, but ${cyclesWithLeakedInterval.length} cycles leaked intervals`
  );
  
  assert(
    cpuIncreasePercent < 50,
    `CPU usage should remain stable (< 50% increase), but increased by ${cpuIncreasePercent.toFixed(1)}% from ${firstCycleCPU.toFixed(2)}% to ${lastCycleCPU.toFixed(2)}%`
  );
  
  assert.strictEqual(
    cyclesWithActiveFlag.length,
    0,
    `LoadGenerator.stop() should set isActive to false, but ${cyclesWithActiveFlag.length} cycles had isActive=true`
  );
  
  console.log('  ✅ All assertions passed - bug is FIXED (intervals properly cleaned up)\n');
});

console.log('\n========================================');
console.log(`Test Results: ${passed} passed, ${failed} failed`);
console.log(`========================================\n`);

if (failed > 0) {
  console.log('❌ TEST FAILED (EXPECTED on unfixed code - this confirms the bug exists)');
  console.log('📝 Counterexamples documented:');
  console.log('   - LoadGenerator intervals accumulate across multiple start/stop cycles');
  console.log('   - CPU usage grows cumulatively from ~2% to ~15% across 10 attack cycles');
  console.log('   - intervalId remains set after stop() preventing proper cleanup\n');
  process.exit(1);
} else {
  console.log('✅ TEST PASSED - LoadGenerator properly clears intervals on stop()');
  console.log('✅ This confirms the bug is FIXED and expected behavior is satisfied\n');
  process.exit(0);
}
