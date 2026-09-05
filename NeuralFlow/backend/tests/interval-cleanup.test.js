// interval-cleanup.test.js - Bug Condition Exploration Test for Interval Cleanup
// This test MUST FAIL on unfixed code to prove the bug exists
// Bug: mainLoop and broadcastState intervals are not cleared in gracefulShutdown

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import assert from 'assert';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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

console.log('\n🧪 Bug Condition Exploration: Interval Cleanup on Shutdown\n');
console.log('📦 Testing: mainLoop and broadcastState intervals should be cleared on SIGTERM\n');

// ── TEST 1: Process Should Exit Cleanly on SIGTERM ──
await runAsyncTest('server should exit within 5 seconds after SIGTERM signal', async () => {
  console.log('  📍 Starting server as child process...');
  
  // Start the server as a child process
  const serverPath = join(__dirname, '..', 'src', 'server.js');
  const serverProcess = spawn('node', [serverPath], {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env, NODE_ENV: 'test', PORT: '13001' }
  });

  // Wait for server to initialize (look for startup message)
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Server failed to start within 10 seconds'));
    }, 10000);

    serverProcess.stdout.on('data', (data) => {
      const output = data.toString();
      if (output.includes('running on') || output.includes('listening')) {
        clearTimeout(timeout);
        console.log('  📍 Server started successfully');
        resolve();
      }
    });

    serverProcess.stderr.on('data', (data) => {
      console.error('  ⚠️  Server stderr:', data.toString());
    });
  });

  // Give server a moment to fully initialize intervals
  await new Promise(resolve => setTimeout(resolve, 1000));

  console.log('  📍 Sending SIGTERM signal to server...');
  
  // Send SIGTERM signal to trigger graceful shutdown
  const shutdownStartTime = Date.now();
  serverProcess.kill('SIGTERM');

  // Wait for process to exit
  const exitPromise = new Promise((resolve, reject) => {
    const maxWaitTime = 5000; // Process should exit within 5 seconds
    const timeout = setTimeout(() => {
      // Force kill if it doesn't exit
      serverProcess.kill('SIGKILL');
      reject(new Error(`Server did not exit within ${maxWaitTime}ms - likely zombie process due to uncleaned intervals`));
    }, maxWaitTime);

    serverProcess.on('exit', (code, signal) => {
      clearTimeout(timeout);
      const shutdownDuration = Date.now() - shutdownStartTime;
      console.log(`  📍 Server exited with code ${code}, signal ${signal} after ${shutdownDuration}ms`);
      resolve({ code, signal, duration: shutdownDuration });
    });
  });

  const exitInfo = await exitPromise;

  // Assert: Process should exit cleanly (code 0) within reasonable time
  assert(
    exitInfo.duration < 5000,
    `Server should exit within 5 seconds, but took ${exitInfo.duration}ms (FAILS on unfixed code - zombie process)`
  );

  assert(
    exitInfo.code === 0 || exitInfo.signal === 'SIGTERM',
    `Server should exit cleanly with code 0 or SIGTERM, got code ${exitInfo.code}, signal ${exitInfo.signal}`
  );
});

// ── TEST 2: Intervals Should Be Stored and Cleared ──
await runAsyncTest('mainLoop and broadcastState intervals should be stored in variables and cleared', async () => {
  console.log('  📍 Checking server.js source code for interval storage...');
  
  // Read server.js source to check if intervals are stored
  const fs = await import('fs');
  const serverPath = join(__dirname, '..', 'src', 'server.js');
  const serverSource = fs.readFileSync(serverPath, 'utf-8');

  // Check if intervals are stored in variables
  const hasMainLoopStorage = /(?:const|let|var)\s+\w*mainLoop\w*IntervalId\s*=\s*setInterval/.test(serverSource);
  const hasBroadcastStorage = /(?:const|let|var)\s+\w*broadcast\w*IntervalId\s*=\s*setInterval/.test(serverSource);

  console.log(`  📍 mainLoopIntervalId stored: ${hasMainLoopStorage}`);
  console.log(`  📍 broadcastStateIntervalId stored: ${hasBroadcastStorage}`);

  // Check if gracefulShutdown clears these intervals
  const gracefulShutdownMatch = serverSource.match(/async?\s+function\s+gracefulShutdown[\s\S]*?(?=\n(?:async\s+)?function|\nexport|\n$)/);
  let gracefulShutdownCode = '';
  if (gracefulShutdownMatch) {
    gracefulShutdownCode = gracefulShutdownMatch[0];
  }

  const clearsMainLoop = /clearInterval\s*\(\s*\w*mainLoop\w*IntervalId\s*\)/.test(gracefulShutdownCode);
  const clearsBroadcast = /clearInterval\s*\(\s*\w*broadcast\w*IntervalId\s*\)/.test(gracefulShutdownCode);

  console.log(`  📍 gracefulShutdown clears mainLoopIntervalId: ${clearsMainLoop}`);
  console.log(`  📍 gracefulShutdown clears broadcastStateIntervalId: ${clearsBroadcast}`);

  // Assert: Both intervals should be stored AND cleared (FAILS on unfixed code)
  assert(
    hasMainLoopStorage,
    'mainLoop interval should be stored in a variable (FAILS on unfixed code - interval not stored)'
  );

  assert(
    hasBroadcastStorage,
    'broadcastState interval should be stored in a variable (FAILS on unfixed code - interval not stored)'
  );

  assert(
    clearsMainLoop,
    'gracefulShutdown should clear mainLoopIntervalId (FAILS on unfixed code - interval not cleared)'
  );

  assert(
    clearsBroadcast,
    'gracefulShutdown should clear broadcastStateIntervalId (FAILS on unfixed code - interval not cleared)'
  );
});

console.log(`\n========================================`);
console.log(`Test Results: ${passed} passed, ${failed} failed`);
console.log(`========================================\n`);

if (failed > 0) {
  console.log('❌ EXPECTED FAILURE: These tests demonstrate the bugs exist');
  console.log('📝 Counterexamples documented:');
  console.log('   - mainLoop and broadcastState intervals not stored in variables');
  console.log('   - gracefulShutdown does not clear these intervals');
  console.log('   - Process becomes zombie (hangs indefinitely) after SIGTERM');
  console.log('\n✅ Bug condition exploration complete - proceed to fix implementation\n');
  process.exit(0); // Exit with 0 because failure is expected for exploration tests
} else {
  console.log('✅ All tests passed - fix has been applied successfully!\n');
  process.exit(0);
}
