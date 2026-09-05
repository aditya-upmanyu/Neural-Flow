// verificationEngine.js - V4 Verification Engine
// After a reroute, independently polls the target node 3×
// and compares pre/post telemetry to determine if recovery occurred.

export const VERIFICATION_RESULTS = {
  VERIFIED_SUCCESS:   'VERIFIED_SUCCESS',
  PARTIAL_RECOVERY:   'PARTIAL_RECOVERY',
  VERIFICATION_FAILED:'VERIFICATION_FAILED',
  REPLAN_REQUIRED:    'REPLAN_REQUIRED',
};

function delay(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function avg(arr) {
  return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
}

export async function runVerification(params) {
  /*
  params: {
    preRerouteSnapshot,    // telemetry at detection time
    targetNode,            // the node traffic was sent to
    sourceNode,            // the original degraded node
    pollFunction,          // async () => nodeMetrics
    verificationWindowMs,  // default 8000 (poll 3× over 8s)
  }
  */

  if (!params.pollFunction || typeof params.pollFunction !== 'function') {
    return {
      result: VERIFICATION_RESULTS.VERIFICATION_FAILED,
      reason: 'No poll function provided',
      polls: [],
      error: 'Missing pollFunction'
    };
  }

  const polls = [];
  const iterations = 3;
  const delayMs = (params.verificationWindowMs || 8000) / iterations;

  // Poll target node 3× over verification window
  for (let i = 0; i < iterations; i++) {
    await delay(delayMs);
    try {
      const metrics = await params.pollFunction();
      polls.push({ iteration: i + 1, timestamp: Date.now(), metrics });
    } catch (e) {
      polls.push({ iteration: i + 1, timestamp: Date.now(), error: e.message });
    }
  }

  const validPolls = polls.filter(p => p.metrics);
  
  if (validPolls.length === 0) {
    return {
      result: VERIFICATION_RESULTS.VERIFICATION_FAILED,
      polls,
      reason: 'No telemetry received post-action'
    };
  }

  const avgPostLatency = avg(validPolls.map(p => p.metrics.latency || 0));
  const avgPostErrorRate = avg(validPolls.map(p => p.metrics.errorRate || 0));
  const avgPostHealth = avg(validPolls.map(p => p.metrics.health || 50));

  const pre = params.preRerouteSnapshot;
  
  // Check criteria for recovery
  const latencyImproved = pre.latency > 0 && avgPostLatency < pre.latency * 0.85;  // >15% better
  const errorRateImproved = avgPostErrorRate <= (pre.errorRate || 100) * 1.1;  // stable or better
  const targetHealthy = avgPostHealth >= 60;

  const checks = [
    {
      name: 'LATENCY_RECOVERED',
      passed: latencyImproved,
      pre: pre.latency,
      post: avgPostLatency,
      unit: 'ms'
    },
    {
      name: 'ERROR_RATE_STABLE',
      passed: errorRateImproved,
      pre: pre.errorRate,
      post: avgPostErrorRate,
      unit: '%'
    },
    {
      name: 'TARGET_STILL_HEALTHY',
      passed: targetHealthy,
      value: avgPostHealth,
      unit: '/100'
    }
  ];

  const passedAll = checks.every(c => c.passed);
  const passedSome = checks.some(c => c.passed);

  let result;
  if (passedAll) {
    result = VERIFICATION_RESULTS.VERIFIED_SUCCESS;
  } else if (passedSome) {
    result = VERIFICATION_RESULTS.PARTIAL_RECOVERY;
  } else if (!targetHealthy) {
    result = VERIFICATION_RESULTS.REPLAN_REQUIRED;
  } else {
    result = VERIFICATION_RESULTS.VERIFICATION_FAILED;
  }

  return {
    result,
    checks,
    polls,
    preRerouteSnapshot: pre,
    postRerouteAvg: { latency: avgPostLatency, errorRate: avgPostErrorRate, health: avgPostHealth },
    latencyDelta: pre.latency ? pre.latency - avgPostLatency : 0,
    errorRateDelta: pre.errorRate ? pre.errorRate - avgPostErrorRate : 0,
    timestamp: Date.now()
  };
}
