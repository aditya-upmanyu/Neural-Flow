// evidenceBuilder.js - V4 Evidence Builder
// Captures a telemetry snapshot at the moment of detection.
// All values come from actual node metrics — no estimation.

export function captureEvidence(node, mlResult) {
  /*
  Captures evidence at the exact moment of detection.
  node: the node object with metrics
  mlResult: output from agentML.predict()
  */
  
  const m = node.metrics || node;
  
  return {
    capturedAt: new Date().toISOString(),
    nodeId: node.nodeId,
    nodeName: node.name || `Node-${node.nodeId}`,
    
    // Actual telemetry snapshot
    latency: m.latency || 0,
    requestsPerSecond: m.requestsPerSecond || 0,
    errorRate: m.errorRate || 0,
    cpu: m.cpu || 0,
    memory: m.memory || 0,
    queueSize: m.queue ?? m.queueSize ?? 0,
    health: m.health || 0,
    status: m.status || 'UNKNOWN',
    
    // ML outputs
    riskScore: mlResult?.riskScore || 0,
    confidence: mlResult?.confidence || 0,
    classification: mlResult?.classification || 'NORMAL',
    featureContributions: mlResult?.featureContributions || {},
    
    // Trend information
    latencyTrend: m.latencySlope ?? null,
    predictedBreach: m.predictedBreach ?? null,
  };
}

export function createFeatureAttributionSummary(featureContributions) {
  /*
  Convert feature contributions to a readable summary
  */
  if (!featureContributions || Object.keys(featureContributions).length === 0) {
    return 'No feature analysis available';
  }

  const sorted = Object.entries(featureContributions)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  return sorted
    .map(([feature, contrib]) => `${feature}: ${contrib.toFixed(1)}%`)
    .join(', ');
}
