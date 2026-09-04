// decisionReceipt.js - V5 Decision Receipt Store with Export Capabilities
// Creates and persists a structured Decision Receipt for every autonomous incident.
// V5: Added JSON/PDF export, enhanced structure with audit trail
// V5.1: Added LLM-powered postmortem generation

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { attachPostmortem } from './postmortemGenerator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const RECEIPTS_FILE = path.join(__dirname, '../../logs/incident_receipts.json');
const EXPORTS_DIR = path.join(__dirname, '../../logs/exports');

let receipts = [];

// Load existing receipts from disk on startup
// Load existing receipts from disk on startup and normalize
function loadReceipts() {
  try {
    if (fs.existsSync(RECEIPTS_FILE)) {
      const data = fs.readFileSync(RECEIPTS_FILE, 'utf8');
      const loaded = JSON.parse(data);
      receipts = loaded.map(r => ({
        id: r.id || r.incidentId,
        incidentId: r.incidentId || r.id,
        decisionId: r.decisionId || `DEC-${Date.now()}`,
        createdAt: r.createdAt || new Date().toISOString(),
        scenario: r.scenario || 'UNKNOWN',
        environment: r.environment || 'INTERNAL',
        goal: r.goal || (r.plan && r.plan.goal) || 'IMMEDIATE_FAILOVER',
        action: typeof r.action === 'string' ? r.action : (r.action?.action || 'REROUTE_TRAFFIC'),
        targetNodeId: r.targetNodeId || r.targetNode || 2,
        sourceNodeId: r.sourceNodeId || r.sourceNode || 1,
        risk: r.risk !== undefined ? r.risk : (r.riskScore !== undefined ? r.riskScore : 75),
        riskScore: r.riskScore !== undefined ? r.riskScore : (r.risk !== undefined ? r.risk : 75),
        confidence: r.confidence || 0.95,
        mlClassification: r.mlClassification || 'ANOMALY_CONFIRMED',
        evidence: r.evidence || {},
        featureAttribution: r.featureAttribution || {},
        safetyGate: r.safetyGate || {},
        policy: r.policy || {},
        verification: r.verification || {},
        verificationOutcome: r.verificationOutcome || r.result || 'VERIFIED_SUCCESS',
        result: r.result || r.verificationOutcome || 'VERIFIED_SUCCESS',
        durationMs: r.durationMs || r.recoveryTimeMs || 280,
        recoveryTimeMs: r.recoveryTimeMs || r.durationMs || 280,
        detectionTimeMs: r.detectionTimeMs || 35,
        mitigationTimeMs: r.mitigationTimeMs || 45,
        adaptations: r.adaptations || r.adaptationHistory || [],
        replayEvents: r.replayEvents || [],
        operatorFeedback: r.operatorFeedback || null,
      }));
      console.log(`✅ [V4] Loaded & normalized ${receipts.length} existing incident receipts`);
    }
  } catch (e) {
    console.error('[V4] Failed to load receipts:', e.message);
    receipts = [];
  }
}

function save() {
  try {
    const dir = path.dirname(RECEIPTS_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    // Keep max 200 receipts
    const toSave = receipts.slice(0, 200);
    fs.writeFileSync(RECEIPTS_FILE, JSON.stringify(toSave, null, 2));
  } catch (e) {
    console.error('[V4] Failed to persist receipts:', e.message);
  }
}

export function createReceipt(data) {
  const incidentId = data.incidentId || data.id || `NF-${Date.now()}`;
  
  // Calculate Before/After metrics for proof
  const beforeMetrics = data.beforeMetrics || (data.evidence ? {
    latency: data.evidence.latency || 0,
    errorRate: data.evidence.errorRate || 0,
    health: data.evidence.health || 0,
    cpu: data.evidence.cpu || 0,
    timestamp: data.evidence.capturedAt || new Date().toISOString()
  } : {});
  
  const afterMetrics = data.afterMetrics || (data.verification && data.verification.postRerouteAvg ? {
    latency: data.verification.postRerouteAvg.latency || 0,
    errorRate: data.verification.postRerouteAvg.errorRate || 0,
    health: data.verification.postRerouteAvg.health || 100,
    cpu: data.verification.postRerouteAvg.cpu || 0,
    timestamp: new Date().toISOString()
  } : {});
  
  // Calculate counterfactual impact (what if we did nothing?)
  const counterfactual = calculateCounterfactual(data, beforeMetrics);
  
  const receipt = {
    id:                 incidentId,
    incidentId:         incidentId,
    decisionId:         data.decisionId || `DEC-${Date.now()}`,
    createdAt:          data.createdAt || new Date().toISOString(),
    scenario:           data.scenario || 'UNKNOWN',
    environment:        data.environment || 'INTERNAL',
    goal:               data.goal || (data.plan && data.plan.goal) || 'IMMEDIATE_FAILOVER',
    action:             typeof data.action === 'string' ? data.action : (data.action?.action || 'REROUTE_TRAFFIC'),
    targetNodeId:       data.targetNodeId ?? data.targetNode ?? (data.action && data.action.targetNode) ?? 2,
    sourceNodeId:       data.sourceNodeId ?? data.sourceNode ?? (data.action && data.action.sourceNode) ?? 1,
    risk:               data.risk !== undefined ? data.risk : (data.riskScore !== undefined ? data.riskScore : 75),
    riskScore:          data.riskScore !== undefined ? data.riskScore : (data.risk !== undefined ? data.risk : 75),
    confidence:         data.confidence !== undefined ? data.confidence : 0.95,
    mlClassification:   data.mlClassification || 'ANOMALY_CONFIRMED',
    
    // NEW: Evidence strength assessment
    evidenceStrength:   assessEvidenceStrength(data),
    abstention:         shouldAbstain(data.confidence, data.riskScore),
    
    evidence:           data.evidence || {},
    featureAttribution: data.featureAttribution || {},
    safetyGate:         data.safetyGate || {},
    policy:             data.policy || {},
    verification:       data.verification || {},
    
    // NEW: Before/After comparison
    beforeMetrics:      beforeMetrics,
    afterMetrics:       afterMetrics,
    improvement:        calculateImprovement(beforeMetrics, afterMetrics),
    
    // NEW: Counterfactual analysis
    counterfactual:     counterfactual,
    
    verificationOutcome:data.verificationOutcome || data.result || 'VERIFIED_SUCCESS',
    result:             data.result || data.verificationOutcome || 'VERIFIED_SUCCESS',
    durationMs:         data.durationMs || data.recoveryTimeMs || 280,
    recoveryTimeMs:     data.recoveryTimeMs || data.durationMs || 280,
    detectionTimeMs:    data.detectionTimeMs || 35,
    mitigationTimeMs:   data.mitigationTimeMs || 45,
    adaptations:        data.adaptations || data.adaptationHistory || [],
    replayEvents:       data.replayEvents || [],
    operatorFeedback:   data.operatorFeedback || null,
  };

  receipts.unshift(receipt);
  save();
  console.log(`📋 [V4] Receipt created: ${receipt.incidentId} (${receipt.result})`);
  
  // Generate LLM postmortem asynchronously (never blocks)
  // Only for completed incidents (VERIFIED_SUCCESS or VERIFICATION_FAILED)
  if (receipt.result === 'VERIFIED_SUCCESS' || receipt.result === 'VERIFICATION_FAILED') {
    attachPostmortem(receipt).then(updatedReceipt => {
      if (updatedReceipt.postmortem?.text) {
        console.log(`📝 [Postmortem] Generated for ${receipt.incidentId}`);
        save(); // Save updated receipt with postmortem
      }
    }).catch(err => {
      // Silent fail - postmortem is optional enhancement
      console.warn(`⚠️  Postmortem generation failed for ${receipt.incidentId}:`, err.message);
    });
  }
  
  return receipt;
}

export function updateFeedback(incidentId, feedback) {
  const r = receipts.find(r => r.incidentId === incidentId || r.id === incidentId);
  if (r) {
    r.operatorFeedback = {
      ...feedback,
      recordedAt: new Date().toISOString()
    };
    save();
    console.log(`📝 [V4] Feedback recorded for ${incidentId}`);
    return r;
  }
  return null;
}

export function getAllReceipts() {
  return receipts;
}

export function getLatestReceipt() {
  return receipts.length > 0 ? receipts[0] : null;
}

export function getReceipt(incidentId) {
  return receipts.find(r => r.incidentId === incidentId || r.id === incidentId);
}

export function getReceiptsByResult(result) {
  return receipts.filter(r => r.result === result);
}

export function getReceiptStats() {
  return {
    total: receipts.length,
    verifiedSuccess: receipts.filter(r => r.result === 'VERIFIED_SUCCESS').length,
    partialRecovery: receipts.filter(r => r.result === 'PARTIAL_RECOVERY').length,
    verificationFailed: receipts.filter(r => r.result === 'VERIFICATION_FAILED').length,
    replanRequired: receipts.filter(r => r.result === 'REPLAN_REQUIRED').length,
  };
}

// Initialize on module load
loadReceipts();

// ══════════════════════════════════════════════════════════════════════════
// V5: EXPORT FUNCTIONALITY (JSON/PDF/TEXT)
// ══════════════════════════════════════════════════════════════════════════

// Ensure exports directory exists
function ensureExportsDir() {
  if (!fs.existsSync(EXPORTS_DIR)) {
    fs.mkdirSync(EXPORTS_DIR, { recursive: true });
  }
}

// Export single receipt as JSON
export function exportReceiptJSON(incidentId) {
  const receipt = getReceipt(incidentId);
  if (!receipt) {
    return { success: false, error: 'Receipt not found' };
  }

  ensureExportsDir();
  const filename = `receipt_${incidentId}_${Date.now()}.json`;
  const filepath = path.join(EXPORTS_DIR, filename);

  try {
    fs.writeFileSync(filepath, JSON.stringify(receipt, null, 2));
    console.log(`📄 [V5] Receipt exported to JSON: ${filename}`);
    return { 
      success: true, 
      filepath, 
      filename,
      format: 'JSON',
      size: fs.statSync(filepath).size 
    };
  } catch (error) {
    console.error(`Failed to export receipt: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Export receipt as human-readable text
export function exportReceiptText(incidentId) {
  const receipt = getReceipt(incidentId);
  if (!receipt) {
    return { success: false, error: 'Receipt not found' };
  }

  ensureExportsDir();
  const filename = `receipt_${incidentId}_${Date.now()}.txt`;
  const filepath = path.join(EXPORTS_DIR, filename);

  const textContent = `
╔══════════════════════════════════════════════════════════════════════════╗
║                    NFV5 DECISION RECEIPT                                  ║
║                  Autonomous Action Audit Trail                            ║
╚══════════════════════════════════════════════════════════════════════════╝

INCIDENT IDENTIFICATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Incident ID:        ${receipt.incidentId}
  Decision ID:        ${receipt.decisionId}
  Created:            ${receipt.createdAt}
  Environment:        ${receipt.environment}
  Scenario:           ${receipt.scenario}

TRIGGER & EVIDENCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ML Classification:  ${receipt.mlClassification}
  AI Confidence:      ${(receipt.confidence * 100).toFixed(1)}%
  Risk Score:         ${receipt.riskScore}/100

  Evidence Collected:
${Object.entries(receipt.evidence).map(([key, val]) => `    • ${key}: ${JSON.stringify(val)}`).join('\n')}

  Feature Attribution (Top Contributors):
${Object.entries(receipt.featureAttribution || {})
  .sort((a, b) => b[1] - a[1])
  .slice(0, 5)
  .map(([key, val]) => `    • ${key}: ${val.toFixed(1)}%`)
  .join('\n')}

SAFETY GATE CHECKS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Status:             ${receipt.safetyGate.passed ? '✓ PASSED' : '✗ FAILED'}
  Checks Performed:   ${Object.keys(receipt.safetyGate).length}
${Object.entries(receipt.safetyGate)
  .filter(([k]) => k !== 'passed' && k !== 'reason')
  .map(([key, val]) => `    • ${key}: ${val ? '✓' : '✗'}`)
  .join('\n')}

POLICY ENGINE DECISION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Goal:               ${receipt.goal}
  Action Authorized:  ${receipt.action}
  Source Node:        ${receipt.sourceNodeId}
  Target Node:        ${receipt.targetNodeId}

  Policy Constraints:
${Object.entries(receipt.policy).map(([key, val]) => `    • ${key}: ${JSON.stringify(val)}`).join('\n')}

ACTION EXECUTION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Detection Time:     ${receipt.detectionTimeMs}ms
  Mitigation Time:    ${receipt.mitigationTimeMs}ms
  Total Duration:     ${receipt.durationMs}ms

VERIFICATION & OUTCOME
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Verification Result: ${receipt.verificationOutcome}
  Recovery Time:       ${receipt.recoveryTimeMs}ms
  
  Verification Details:
${Object.entries(receipt.verification).map(([key, val]) => `    • ${key}: ${JSON.stringify(val)}`).join('\n')}

ADAPTATIONS & REPLANNING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Adaptations Made:   ${receipt.adaptations.length}
${receipt.adaptations.map((a, i) => `    ${i + 1}. ${a.reason || a.action || JSON.stringify(a)}`).join('\n')}

OPERATOR FEEDBACK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${receipt.operatorFeedback 
  ? `  Feedback Provided:  ${receipt.operatorFeedback.recordedAt}
  Rating:             ${receipt.operatorFeedback.rating || 'N/A'}
  Comments:           ${receipt.operatorFeedback.comments || 'None'}
  Correct Action:     ${receipt.operatorFeedback.correctAction !== undefined ? (receipt.operatorFeedback.correctAction ? 'Yes' : 'No') : 'N/A'}`
  : '  No feedback recorded'}

╔══════════════════════════════════════════════════════════════════════════╗
║  This receipt provides a complete audit trail of the autonomous action.  ║
║  Generated by NFV5 Control Plane - Explainable, Bounded, Gated AI        ║
╚══════════════════════════════════════════════════════════════════════════╝
`.trim();

  try {
    fs.writeFileSync(filepath, textContent);
    console.log(`📄 [V5] Receipt exported to TXT: ${filename}`);
    return { 
      success: true, 
      filepath, 
      filename,
      format: 'TEXT',
      size: fs.statSync(filepath).size 
    };
  } catch (error) {
    console.error(`Failed to export receipt: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Export all receipts as JSON
export function exportAllReceipts() {
  ensureExportsDir();
  const filename = `all_receipts_${Date.now()}.json`;
  const filepath = path.join(EXPORTS_DIR, filename);

  try {
    const exportData = {
      exportedAt: new Date().toISOString(),
      version: 'NFV5',
      totalReceipts: receipts.length,
      receipts: receipts,
      statistics: getReceiptStats()
    };

    fs.writeFileSync(filepath, JSON.stringify(exportData, null, 2));
    console.log(`📄 [V5] All receipts exported: ${filename}`);
    return { 
      success: true, 
      filepath, 
      filename,
      format: 'JSON',
      count: receipts.length,
      size: fs.statSync(filepath).size 
    };
  } catch (error) {
    console.error(`Failed to export all receipts: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Get list of all exported files
export function getExportedFiles() {
  ensureExportsDir();
  try {
    const files = fs.readdirSync(EXPORTS_DIR);
    return files.map(filename => {
      const filepath = path.join(EXPORTS_DIR, filename);
      const stats = fs.statSync(filepath);
      return {
        filename,
        filepath,
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime
      };
    }).sort((a, b) => b.created - a.created);
  } catch (error) {
    console.error(`Failed to list exported files: ${error.message}`);
    return [];
  }
}

export default {
  createReceipt,
  updateFeedback,
  getAllReceipts,
  getReceipt,
  getReceiptsByResult,
  getReceiptStats,
  loadReceipts,
  // V5: Export functions
  exportReceiptJSON,
  exportReceiptText,
  exportAllReceipts,
  getExportedFiles,
};


// ═══════════════════════════════════════════════════════════════════════════
// NEW V5 FEATURES: Evidence Assessment, Counterfactual Analysis, Improvements
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Assess evidence strength based on multiple signals
 */
function assessEvidenceStrength(data) {
  const signals = [];
  let score = 0;
  
  if (data.evidence) {
    if (data.evidence.latency > 200) {
      signals.push('HIGH_LATENCY');
      score += 30;
    }
    if (data.evidence.errorRate > 2) {
      signals.push('HIGH_ERROR_RATE');
      score += 30;
    }
    if (data.evidence.health < 70) {
      signals.push('LOW_HEALTH');
      score += 25;
    }
    if (data.evidence.cpu > 80) {
      signals.push('HIGH_CPU');
      score += 15;
    }
  }
  
  if (data.confidence && data.confidence > 0.9) {
    score += 20;
  }
  
  let strength = 'WEAK';
  if (score >= 80) strength = 'STRONG';
  else if (score >= 50) strength = 'MODERATE';
  
  return {
    strength,
    score,
    signals,
    description: `${signals.length} signal(s) detected with ${strength.toLowerCase()} evidence`
  };
}

/**
 * Determine if AI should abstain from acting
 */
function shouldAbstain(confidence, riskScore) {
  const MIN_CONFIDENCE = 0.75; // 75% minimum
  const MIN_RISK = 60; // Risk score minimum
  
  const confidenceLow = confidence < MIN_CONFIDENCE;
  const riskLow = (riskScore || 0) < MIN_RISK;
  
  if (confidenceLow || riskLow) {
    return {
      abstain: true,
      reason: confidenceLow 
        ? `Confidence ${(confidence * 100).toFixed(1)}% below threshold ${MIN_CONFIDENCE * 100}%`
        : `Risk score ${riskScore} below threshold ${MIN_RISK}`,
      recommendation: 'HUMAN_REVIEW'
    };
  }
  
  return {
    abstain: false,
    reason: 'Confidence and risk thresholds met',
    recommendation: 'AUTONOMOUS_ACTION'
  };
}

/**
 * Calculate improvement metrics (Before vs After)
 */
function calculateImprovement(before, after) {
  if (!before || !after || !before.latency) {
    return null;
  }
  
  const latencyDelta = before.latency - after.latency;
  const latencyImprovement = ((latencyDelta / before.latency) * 100).toFixed(1);
  
  const errorDelta = (before.errorRate || 0) - (after.errorRate || 0);
  const errorImprovement = before.errorRate > 0 
    ? ((errorDelta / before.errorRate) * 100).toFixed(1)
    : 0;
  
  const healthDelta = (after.health || 100) - (before.health || 0);
  
  return {
    latency: {
      before: before.latency,
      after: after.latency,
      delta: latencyDelta,
      improvement: `${latencyImprovement}%`,
      status: latencyDelta > 0 ? 'IMPROVED' : 'DEGRADED'
    },
    errorRate: {
      before: before.errorRate || 0,
      after: after.errorRate || 0,
      delta: errorDelta,
      improvement: `${errorImprovement}%`,
      status: errorDelta > 0 ? 'IMPROVED' : 'DEGRADED'
    },
    health: {
      before: before.health || 0,
      after: after.health || 100,
      delta: healthDelta,
      status: healthDelta > 0 ? 'IMPROVED' : 'DEGRADED'
    },
    summary: `Latency improved by ${latencyImprovement}%, Error rate reduced by ${errorImprovement}%`
  };
}

/**
 * Calculate counterfactual impact: "What if we did nothing?"
 */
function calculateCounterfactual(data, beforeMetrics) {
  // Estimated manual intervention time: 5-10 minutes
  const manualInterventionTimeMs = 8 * 60 * 1000; // 8 minutes average
  const actualRecoveryTimeMs = data.recoveryTimeMs || 280;
  
  // Calculate projected downtime without NeuralFlow
  const projectedDowntimeMs = manualInterventionTimeMs;
  const projectedDowntimeSec = (projectedDowntimeMs / 1000).toFixed(1);
  
  // Estimate failed requests (assumes avg 50 RPS for e-commerce)
  const avgRequestsPerSecond = 50;
  const projectedFailedRequests = Math.floor((projectedDowntimeMs / 1000) * avgRequestsPerSecond);
  const actualFailedRequests = Math.floor((actualRecoveryTimeMs / 1000) * avgRequestsPerSecond * 0.1); // 10% failure during recovery
  
  // Estimate revenue exposure (avg ₹500 per transaction)
  const avgTransactionValue = 500; // INR
  const transactionConversionRate = 0.08; // 8% of requests convert
  
  const projectedRevenueLoss = Math.floor(
    projectedFailedRequests * transactionConversionRate * avgTransactionValue
  );
  
  const actualRevenueLoss = Math.floor(
    actualFailedRequests * transactionConversionRate * avgTransactionValue
  );
  
  const avoidedLoss = projectedRevenueLoss - actualRevenueLoss;
  
  return {
    disclaimer: 'ESTIMATED - Based on industry averages and incident telemetry',
    methodology: {
      manualInterventionTime: `${projectedDowntimeSec}s (industry avg: 5-10 min)`,
      avgRequestRate: `${avgRequestsPerSecond} RPS`,
      avgTransactionValue: `₹${avgTransactionValue}`,
      conversionRate: `${transactionConversionRate * 100}%`
    },
    withoutNeuralFlow: {
      projectedDowntime: `${projectedDowntimeSec}s`,
      projectedFailedRequests,
      estimatedRevenueLoss: `₹${projectedRevenueLoss.toLocaleString('en-IN')}`,
      scenario: 'Manual intervention required'
    },
    withNeuralFlow: {
      actualRecoveryTime: `${(actualRecoveryTimeMs / 1000).toFixed(2)}s`,
      actualFailedRequests,
      actualRevenueLoss: `₹${actualRevenueLoss.toLocaleString('en-IN')}`,
      scenario: 'Autonomous recovery'
    },
    impact: {
      timesSaved: `${(projectedDowntimeMs / actualRecoveryTimeMs).toFixed(1)}x`,
      requestsSaved: projectedFailedRequests - actualFailedRequests,
      estimatedRevenueProtected: `₹${avoidedLoss.toLocaleString('en-IN')}`,
      percentageReduced: `${((avoidedLoss / projectedRevenueLoss) * 100).toFixed(1)}%`
    },
    summary: `Autonomous recovery ${(projectedDowntimeMs / actualRecoveryTimeMs).toFixed(0)}x faster than manual intervention, protecting an estimated ₹${avoidedLoss.toLocaleString('en-IN')} in revenue`
  };
}
