/**
 * LLM-powered Incident Postmortem Generator
 * 
 * Generates human-readable 3-sentence postmortems from decision receipts
 * using Claude API. Designed to never block the safety-critical pipeline.
 * 
 * @module postmortemGenerator
 */

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || '';
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-3-5-sonnet-20241022';

/**
 * Generate a plain-English postmortem from a decision receipt
 * 
 * @param {Object} receipt - The decision receipt object
 * @returns {Promise<string|null>} Generated postmortem or null on failure
 */
async function generatePostmortem(receipt) {
  // Safety: Never block if API key is missing
  if (!ANTHROPIC_API_KEY || ANTHROPIC_API_KEY.length < 10) {
    console.log('⚠️  Anthropic API key not configured - skipping postmortem generation');
    return null;
  }

  try {
    const prompt = buildPrompt(receipt);
    
    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 300,
        temperature: 0.3, // Low temp for factual, consistent output
        system: buildSystemPrompt(),
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      }),
      signal: AbortSignal.timeout(10000) // 10s timeout - never hang
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Postmortem API error ${response.status}:`, errorText.slice(0, 200));
      return null;
    }

    const data = await response.json();
    const postmortem = data.content?.[0]?.text?.trim() || null;
    
    if (postmortem) {
      console.log(`✅ Generated postmortem for ${receipt.incidentId || 'unknown'}`);
    }
    
    return postmortem;

  } catch (err) {
    // Graceful degradation: log but never throw
    if (err.name === 'TimeoutError' || err.name === 'AbortError') {
      console.warn('⏱️  Postmortem generation timed out after 10s - proceeding without');
    } else {
      console.error('❌ Postmortem generation failed:', err.message);
    }
    return null;
  }
}

/**
 * Build the system prompt for the LLM
 */
function buildSystemPrompt() {
  return `You are an SRE writing incident postmortems for an autonomous infrastructure resilience system.

Rules:
- Write EXACTLY 3 sentences in plain English
- Be factual: cite actual numbers from the receipt
- No speculation or hedging language
- Format: (1) What happened, (2) How it was resolved, (3) Outcome/impact
- Use past tense
- Keep it under 150 words total
- Never add recommendations or future actions

Example good postmortem:
"Node app-3 experienced a DDoS attack with latency spiking to 850ms and error rate at 42%. The system autonomously rerouted traffic to app-1 (health: 95%, capacity: 60%) after passing 8 safety gate checks with 89% confidence. Post-recovery verification confirmed latency returned to 45ms and errors dropped to 2%, with the action verified as VERIFIED_SUCCESS."`;
}

/**
 * Build the prompt with receipt data
 */
function buildPrompt(receipt) {
  // Extract key metrics
  const incident = {
    id: receipt.incidentId || receipt.id || 'unknown',
    status: receipt.result || receipt.status || 'unknown',
    affectedNode: receipt.affectedNode || 'unknown',
    targetNode: receipt.targetNode || 'unknown',
    decision: receipt.decision || 'unknown',
    confidence: receipt.confidence || 0,
    
    // Detection metrics
    detectionMetrics: receipt.detectionSnapshot?.metrics || {},
    
    // Recovery action
    action: receipt.action || {},
    
    // Safety gates
    safetyGates: receipt.safetyGateResults || {},
    
    // Verification
    verification: receipt.verification || {},
    
    // Improvement metrics
    improvement: receipt.improvement || {}
  };

  return `Generate a 3-sentence incident postmortem from this structured decision receipt JSON:

**Incident ID:** ${incident.id}
**Final Status:** ${incident.status}
**Affected Node:** ${incident.affectedNode}
**Target Node:** ${incident.targetNode}
**Decision:** ${incident.decision}
**Confidence:** ${(incident.confidence * 100).toFixed(1)}%

**Detection Metrics:**
${JSON.stringify(incident.detectionMetrics, null, 2)}

**Action Taken:**
${JSON.stringify(incident.action, null, 2)}

**Safety Gates:** ${incident.safetyGates.totalChecks || 0} checks, ${incident.safetyGates.passedChecks || 0} passed

**Verification:**
${JSON.stringify(incident.verification, null, 2)}

**Improvement:**
${JSON.stringify(incident.improvement, null, 2)}

Write exactly 3 sentences summarizing: (1) what happened, (2) how it was resolved, (3) the outcome.`;
}

/**
 * Attach postmortem to receipt (mutates receipt)
 * Safe to call - never throws, never blocks pipeline
 * 
 * @param {Object} receipt - Decision receipt to enhance
 * @returns {Promise<Object>} The receipt (with postmortem if successful)
 */
async function attachPostmortem(receipt) {
  // Only generate for completed incidents (success or failure)
  const shouldGenerate = 
    receipt.result === 'VERIFIED_SUCCESS' || 
    receipt.result === 'VERIFICATION_FAILED' ||
    receipt.status === 'VERIFIED_SUCCESS' ||
    receipt.status === 'VERIFICATION_FAILED';

  if (!shouldGenerate) {
    return receipt;
  }

  try {
    const postmortem = await generatePostmortem(receipt);
    
    if (postmortem) {
      receipt.postmortem = {
        text: postmortem,
        generatedAt: new Date().toISOString(),
        model: MODEL
      };
    } else {
      receipt.postmortem = {
        text: null,
        error: 'Generation failed or API unavailable',
        generatedAt: new Date().toISOString()
      };
    }
  } catch (err) {
    // Ultimate safety: catch any unexpected errors
    console.error('❌ Unexpected error in attachPostmortem:', err);
    receipt.postmortem = {
      text: null,
      error: err.message,
      generatedAt: new Date().toISOString()
    };
  }

  return receipt;
}

export { generatePostmortem, attachPostmortem };
