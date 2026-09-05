// safetyGate.js - V4 Safety Gate
// Deterministic policy layer between AI prediction and autonomous action.
// The AI never directly controls rerouting. This gate does.

export const SAFETY_OUTCOMES = {
  ALLOW_AUTONOMOUS_ACTION: 'ALLOW_AUTONOMOUS_ACTION',
  REQUIRE_HUMAN_REVIEW:    'REQUIRE_HUMAN_REVIEW',
  CONTINUE_MONITORING:     'CONTINUE_MONITORING',
  ABSTAIN:                 'ABSTAIN',
  NO_SAFE_TARGET:          'NO_SAFE_TARGET',
  BLOCK:                   'BLOCK', // Add missing BLOCK outcome
};

// Default policy thresholds — all configurable via /api/settings
export const DEFAULT_POLICY = {
  minAutonomousConfidence: 0.80,   // AI confidence must be ≥ this
  maxTargetCpu: 80,                // Target CPU must be < this
  minTargetHealth: 65,             // Target health must be > this
  maxTelemetryAgeMs: 5000,         // Telemetry must be fresher than this
  cooldownMs: 15000,               // Minimum time between reroutes
  minHealthyAlternatives: 1,       // At least 1 healthy candidate must exist
};

export function runSafetyGate(params) {
  /*
  params: {
    confidence,          // 0–1 from agentML
    sourceNode,          // the degraded node object
    targetNode,          // the selected candidate
    allNodes,            // all active nodes
    lastRerouteTime,     // timestamp
    lastTelemetryTime,   // timestamp of last successful poll
    policy,              // DEFAULT_POLICY or overridden
    actionType,          // 'REROUTE' | 'THROTTLE' | 'RATE_LIMIT'
  }

  Returns: {
    outcome,             // one of SAFETY_OUTCOMES
    checks,              // array of { name, passed, reason }
    blockedReason,       // string if not ALLOW
    timestamp,
    policy,
  }
  */

  const checks = [];
  const now = Date.now();
  const p = { ...DEFAULT_POLICY, ...params.policy };

  // Check 1: AI confidence threshold
  checks.push({
    name: 'AI_CONFIDENCE',
    passed: params.confidence >= p.minAutonomousConfidence,
    reason: params.confidence >= p.minAutonomousConfidence
      ? `Confidence ${(params.confidence * 100).toFixed(1)}% ≥ threshold ${p.minAutonomousConfidence * 100}%`
      : `Confidence ${(params.confidence * 100).toFixed(1)}% below threshold ${p.minAutonomousConfidence * 100}%`
  });

  // Check 2: Source node is actually degraded
  const sourceHealth = params.sourceNode?.healthScore ?? params.sourceNode?.health ?? params.sourceNode?.metrics?.health ?? 100;
  const isSourceDegraded = params.sourceNode && (
    params.sourceNode.status === 'CRITICAL' || params.sourceNode.status === 'WARNING' ||
    params.sourceNode.isUnderAttack || sourceHealth < 70 ||
    params.sourceNode.metrics?.status === 'CRITICAL' || params.sourceNode.metrics?.status === 'WARNING'
  );
  checks.push({
    name: 'SOURCE_DEGRADED',
    passed: Boolean(isSourceDegraded),
    reason: isSourceDegraded ? 'Source node is in degraded/attacked state' : 'Source node is healthy (no reroute needed)'
  });

  // Check 3: Target node exists and is healthy
  const targetHealth = params.targetNode?.healthScore ?? params.targetNode?.health ?? params.targetNode?.metrics?.health ?? 0;
  const targetCpu = params.targetNode?.cpu ?? params.targetNode?.metrics?.cpu ?? 100;
  checks.push({
    name: 'TARGET_HEALTHY',
    passed: !!params.targetNode && targetHealth >= p.minTargetHealth && !params.targetNode.isUnderAttack,
    reason: params.targetNode
      ? `Target health ${targetHealth}/100 — ${targetHealth >= p.minTargetHealth && !params.targetNode.isUnderAttack ? 'OK' : 'INSUFFICIENT'}`
      : 'No target node provided'
  });

  // Check 4: Target CPU capacity
  checks.push({
    name: 'TARGET_CAPACITY',
    passed: targetCpu < p.maxTargetCpu,
    reason: `Target CPU ${targetCpu.toFixed(1)}% — ${targetCpu < p.maxTargetCpu ? 'capacity available' : 'at capacity'}`
  });

  // Check 5: Telemetry freshness
  const telemetryAge = params.lastTelemetryTime ? (now - params.lastTelemetryTime) : Infinity;
  checks.push({
    name: 'FRESH_TELEMETRY',
    passed: telemetryAge < p.maxTelemetryAgeMs,
    reason: telemetryAge < p.maxTelemetryAgeMs
      ? `Telemetry age: ${telemetryAge}ms — fresh`
      : `Telemetry age: ${telemetryAge}ms — STALE (>${p.maxTelemetryAgeMs}ms)`
  });

  // Check 6: Cooldown
  const timeSinceReroute = now - (params.lastRerouteTime || 0);
  checks.push({
    name: 'COOLDOWN_CLEAR',
    passed: timeSinceReroute >= p.cooldownMs,
    reason: timeSinceReroute >= p.cooldownMs
      ? `Cooldown clear (${timeSinceReroute}ms since last reroute)`
      : `Cooldown active — ${p.cooldownMs - timeSinceReroute}ms remaining`
  });

  // Check 7: Healthy alternatives exist (not routing into a single point of failure)
  const healthyAlternatives = (params.allNodes || []).filter(n =>
    n.nodeId !== params.sourceNode?.nodeId &&
    n.nodeId !== params.targetNode?.nodeId &&
    (n.metrics?.health ?? n.healthScore ?? n.health ?? 0) >= p.minTargetHealth &&
    !n.isUnderAttack
  ).length;
  checks.push({
    name: 'FALLBACK_EXISTS',
    passed: healthyAlternatives >= p.minHealthyAlternatives,
    reason: `${healthyAlternatives} additional healthy node(s) available as fallback`
  });

  // Check 8: Target is not already overloaded (circuit breaker)
  const targetAlreadyOverloaded = targetCpu > 90 || targetHealth < 40;
  checks.push({
    name: 'TARGET_NOT_OVERLOADED',
    passed: !targetAlreadyOverloaded,
    reason: targetAlreadyOverloaded
      ? `Target appears overloaded (CPU: ${targetCpu}%, Health: ${targetHealth})`
      : 'Target not overloaded'
  });

  // Evaluate outcome
  const allCriticalPassed = checks
    .filter(c => ['AI_CONFIDENCE','TARGET_HEALTHY','FRESH_TELEMETRY','COOLDOWN_CLEAR','SOURCE_DEGRADED'].includes(c.name))
    .every(c => c.passed);

  const noSafeTarget = !params.targetNode ||
    (params.allNodes || []).filter(n =>
      n.nodeId !== params.sourceNode?.nodeId &&
      (n.metrics?.health ?? n.healthScore ?? n.health ?? 0) >= p.minTargetHealth &&
      !n.isUnderAttack
    ).length === 0;

  let outcome;
  let blockedReason = null;

  if (noSafeTarget) {
    outcome = SAFETY_OUTCOMES.NO_SAFE_TARGET;
    blockedReason = 'No healthy target node available';
  } else if (!checks.find(c => c.name === 'AI_CONFIDENCE')?.passed) {
    outcome = SAFETY_OUTCOMES.REQUIRE_HUMAN_REVIEW;
    blockedReason = 'AI confidence below autonomous action threshold';
  } else if (!checks.find(c => c.name === 'FRESH_TELEMETRY')?.passed) {
    outcome = SAFETY_OUTCOMES.ABSTAIN;
    blockedReason = 'Telemetry stale — autonomous action suspended';
  } else if (!checks.find(c => c.name === 'COOLDOWN_CLEAR')?.passed) {
    outcome = SAFETY_OUTCOMES.CONTINUE_MONITORING;
    blockedReason = 'Cooldown active — monitoring continues';
  } else if (allCriticalPassed) {
    outcome = SAFETY_OUTCOMES.ALLOW_AUTONOMOUS_ACTION;
  } else {
    outcome = SAFETY_OUTCOMES.REQUIRE_HUMAN_REVIEW;
    blockedReason = checks.filter(c => !c.passed).map(c => c.name).join(', ');
  }

  return { outcome, checks, blockedReason, timestamp: now, policy: p };
}
