// validation-bypass.test.js - Bug Condition Exploration Test for Input Validation
// This test MUST FAIL on unfixed code to prove validation bugs exist
// DO NOT fix the test or the code when it fails - failure confirms the bug

import assert from 'assert';
import http from 'http';

/**
 * CRITICAL: This is a bug condition exploration test
 * 
 * Expected Outcome on UNFIXED code: TEST FAILS
 * - POST /api/mode with mode='INVALID' should return 400 but returns 500 or accepts
 * - POST /api/attack with nodeId=null should return 400 but causes crash
 * 
 * This test encodes the EXPECTED behavior and will validate the fix later
 */

const BASE_URL = 'http://localhost:3001';

// Helper to make HTTP POST requests
function makePostRequest(path, body) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(body);
    
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({
            statusCode: res.statusCode,
            body: parsed
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            body: data
          });
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    req.write(postData);
    req.end();
  });
}

// Wait for server to be ready
async function waitForServer(maxAttempts = 10) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      await makePostRequest('/api/mode', { mode: 'AI' });
      return true;
    } catch (e) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  throw new Error('Server not ready after ' + maxAttempts + ' attempts');
}

let passed = 0;
let failed = 0;

function it(desc, fn) {
  return async () => {
    try {
      await fn();
      console.log(`  ✓ ${desc}`);
      passed++;
    } catch (err) {
      console.error(`  ✗ ${desc}`);
      console.error(`    ${err.message}`);
      failed++;
    }
  };
}

console.log('\n🧪 Running Validation Bypass Bug Condition Exploration Tests...');
console.log('⚠️  EXPECTED: These tests SHOULD FAIL on unfixed code (proving bug exists)\n');

console.log('📦 Bug Condition: API Endpoints Accept Invalid Inputs Without Validation\n');

// Wait for server
try {
  console.log('Waiting for server to be ready...');
  await waitForServer();
  console.log('Server ready, starting tests...\n');
} catch (e) {
  console.error('❌ Server not available:', e.message);
  console.error('   Please start the server with: npm start');
  process.exit(1);
}

// Test 1: Invalid mode value should be rejected with 400
await it('POST /api/mode with mode="INVALID" should return 400 with error message', async () => {
  const response = await makePostRequest('/api/mode', { mode: 'INVALID' });
  
  // Expected behavior: Should return 400 status
  // Bug behavior: Returns 500 or accepts the invalid mode (200)
  assert.strictEqual(
    response.statusCode, 
    400, 
    `Expected 400 Bad Request for invalid mode, got ${response.statusCode}. ` +
    `This indicates validation is missing (bug confirmed).`
  );
  
  // Expected behavior: Should have error message
  assert(
    response.body.error || response.body.message,
    'Response should contain error message explaining invalid mode'
  );
  
  // Error message should mention validation issue
  const errorText = JSON.stringify(response.body).toLowerCase();
  assert(
    errorText.includes('invalid') || errorText.includes('mode'),
    'Error message should mention invalid mode'
  );
})();

// Test 2: Missing mode value should be rejected
await it('POST /api/mode with no mode should return 400 with error message', async () => {
  const response = await makePostRequest('/api/mode', {});
  
  assert.strictEqual(
    response.statusCode, 
    400, 
    `Expected 400 Bad Request for missing mode, got ${response.statusCode}`
  );
  
  assert(
    response.body.error || response.body.message,
    'Response should contain error message for missing mode'
  );
})();

// Test 3: null mode value should be rejected
await it('POST /api/mode with mode=null should return 400 with error message', async () => {
  const response = await makePostRequest('/api/mode', { mode: null });
  
  assert.strictEqual(
    response.statusCode, 
    400, 
    `Expected 400 Bad Request for null mode, got ${response.statusCode}`
  );
})();

// Test 4: Missing nodeId in attack should be rejected
await it('POST /api/attack with nodeId=null should return 400 with error message', async () => {
  const response = await makePostRequest('/api/attack', { 
    nodeId: null,
    attackType: 'TrafficSpike',
    intensity: 75
  });
  
  // Expected behavior: Should return 400 status
  // Bug behavior: Causes crash or 500 error when trying to process null nodeId
  assert.strictEqual(
    response.statusCode, 
    400, 
    `Expected 400 Bad Request for null nodeId, got ${response.statusCode}. ` +
    `This indicates validation is missing and may cause crashes (bug confirmed).`
  );
  
  assert(
    response.body.error || response.body.message,
    'Response should contain error message explaining missing nodeId'
  );
  
  const errorText = JSON.stringify(response.body).toLowerCase();
  assert(
    errorText.includes('nodeid') || errorText.includes('required'),
    'Error message should mention nodeId requirement'
  );
})();

// Test 5: Missing nodeId (undefined) in attack should be rejected
await it('POST /api/attack with missing nodeId should return 400 with error message', async () => {
  const response = await makePostRequest('/api/attack', { 
    attackType: 'TrafficSpike',
    intensity: 75
  });
  
  assert.strictEqual(
    response.statusCode, 
    400, 
    `Expected 400 Bad Request for missing nodeId, got ${response.statusCode}`
  );
})();

// Test 6: Invalid nodeId (negative) should be rejected
await it('POST /api/attack with nodeId=-1 should return 400 with error message', async () => {
  const response = await makePostRequest('/api/attack', { 
    nodeId: -1,
    attackType: 'TrafficSpike',
    intensity: 75
  });
  
  assert.strictEqual(
    response.statusCode, 
    400, 
    `Expected 400 Bad Request for negative nodeId, got ${response.statusCode}`
  );
  
  const errorText = JSON.stringify(response.body).toLowerCase();
  assert(
    errorText.includes('invalid') || errorText.includes('nodeid'),
    'Error message should mention invalid nodeId'
  );
})();

// Test 7: Missing attackType should be rejected
await it('POST /api/attack with missing attackType should return 400 with error message', async () => {
  const response = await makePostRequest('/api/attack', { 
    nodeId: 1,
    intensity: 75
  });
  
  assert.strictEqual(
    response.statusCode, 
    400, 
    `Expected 400 Bad Request for missing attackType, got ${response.statusCode}`
  );
  
  const errorText = JSON.stringify(response.body).toLowerCase();
  assert(
    errorText.includes('attacktype') || errorText.includes('required'),
    'Error message should mention attackType requirement'
  );
})();

// Test 8: Invalid attackType should be rejected
await it('POST /api/attack with invalid attackType should return 400 with error message', async () => {
  const response = await makePostRequest('/api/attack', { 
    nodeId: 1,
    attackType: 'InvalidAttackType',
    intensity: 75
  });
  
  assert.strictEqual(
    response.statusCode, 
    400, 
    `Expected 400 Bad Request for invalid attackType, got ${response.statusCode}`
  );
})();

// Test 9: Invalid intensity (too high) should be rejected
await it('POST /api/attack with intensity=99999 should return 400 with error message', async () => {
  const response = await makePostRequest('/api/attack', { 
    nodeId: 1,
    attackType: 'TrafficSpike',
    intensity: 99999
  });
  
  assert.strictEqual(
    response.statusCode, 
    400, 
    `Expected 400 Bad Request for invalid intensity, got ${response.statusCode}`
  );
  
  const errorText = JSON.stringify(response.body).toLowerCase();
  assert(
    errorText.includes('intensity') || errorText.includes('invalid'),
    'Error message should mention invalid intensity'
  );
})();

// Test 10: Invalid intensity (negative) should be rejected
await it('POST /api/attack with intensity=-50 should return 400 with error message', async () => {
  const response = await makePostRequest('/api/attack', { 
    nodeId: 1,
    attackType: 'TrafficSpike',
    intensity: -50
  });
  
  assert.strictEqual(
    response.statusCode, 
    400, 
    `Expected 400 Bad Request for negative intensity, got ${response.statusCode}`
  );
})();

console.log(`\n========================================`);
console.log(`Test Results: ${passed} passed, ${failed} failed`);
console.log(`========================================\n`);

if (failed > 0) {
  console.log('⚠️  EXPECTED OUTCOME: Tests FAILED on unfixed code');
  console.log('✅ Bug condition confirmed: API endpoints accept invalid inputs without validation');
  console.log('📝 Documented counterexamples:');
  console.log('   - mode="INVALID" accepted or returns 500 instead of 400');
  console.log('   - nodeId=null causes crash or 500 instead of 400');
  console.log('   - Missing required fields not validated');
  console.log('   - Invalid parameter values not validated');
  console.log('\n🔧 Next step: Implement validation middleware to fix these issues\n');
  process.exit(0); // Exit success because failure was expected
} else {
  console.log('✅ All validation tests passed!');
  console.log('   This means validation middleware is working correctly.\n');
  process.exit(0);
}
