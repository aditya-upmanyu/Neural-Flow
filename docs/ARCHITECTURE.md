# NeuralFlow V5 - Architecture Documentation

## Table of Contents

1. [System Overview](#system-overview)
2. [Core Components](#core-components)
3. [Decision Pipeline](#decision-pipeline)
4. [Neural Network Architecture](#neural-network-architecture)
5. [Safety System](#safety-system)
6. [Data Flow](#data-flow)
7. [Scalability](#scalability)
8. [Security Architecture](#security-architecture)

## System Overview

NeuralFlow V5 is built on a microservices-inspired architecture with a centralized orchestrator coordinating specialized subsystems.

### High-Level Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                       Frontend Layer                          │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐    │
│  │  Dashboard  │  │   Analytics  │  │  Configuration   │    │
│  └──────┬──────┘  └───────┬──────┘  └────────┬─────────┘    │
│         │                 │                   │               │
│         └─────────────────┴───────────────────┘               │
│                          │                                    │
│                    WebSocket + REST                           │
└──────────────────────────┼───────────────────────────────────┘
                           │
┌──────────────────────────┼───────────────────────────────────┐
│                   Backend Layer                               │
│  ┌──────────────────────▼────────────────────────────────┐   │
│  │              Orchestrator (Control Center)            │   │
│  │                                                       │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌────────────┐ │   │
│  │  │   Sentinel   │  │   Planner    │  │  Verifier  │ │   │
│  │  │   (Detect)   │→ │   (Decide)   │→ │  (Verify)  │ │   │
│  │  └──────────────┘  └──────────────┘  └────────────┘ │   │
│  │                                                       │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌────────────┐ │   │
│  │  │ Investigator │  │  Correlator  │  │  Executor  │ │   │
│  │  └──────────────┘  └──────────────┘  └────────────┘ │   │
│  └───────────────────────────────────────────────────────┘   │
│                           │                                   │
│  ┌───────────────────────┴──────────────────────────────┐   │
│  │               Supporting Services                     │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────────┐   │   │
│  │  │   ML     │  │  Safety  │  │   Event Store    │   │   │
│  │  │ Engine   │  │   Gate   │  │   (Audit Log)    │   │   │
│  │  └──────────┘  └──────────┘  └──────────────────┘   │   │
│  └───────────────────────────────────────────────────────┘   │
└──────────────────────────┬───────────────────────────────────┘
                           │
┌──────────────────────────┴───────────────────────────────────┐
│                 Infrastructure Layer                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   Node 1     │  │   Node 2     │  │   Node 3     │       │
│  │  (Primary)   │  │ (Secondary)  │  │   (Backup)   │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└──────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. Orchestrator

**Location**: `backend/src/orchestrator.js`

**Responsibilities**:
- Central coordination hub
- Lifecycle management of incidents
- State machine transitions
- Event emission and broadcasting

**Key Methods**:
```javascript
- handleDetection()   // Process new anomalies
- handlePlanning()    // Route planning decisions
- handleVerification()// Post-action verification
- getStatus()         // Current system snapshot
- reset()             // System reset
```

**State Machine**:
```
NORMAL → DETECTED → PLANNING → PENDING → 
REROUTING → VERIFYING → RESOLVED/FAILED
         ↓
      PREDICTED (ML early warning)
```

### 2. Sentinel (Detection Engine)

**Location**: `backend/src/controlPlane/sentinel.js`

**Responsibilities**:
- Continuous health monitoring
- Anomaly detection
- ML-powered prediction
- Alert generation

**Detection Logic**:
```javascript
if (node.status === 'CRITICAL' || node.latency > threshold) {
  // Immediate detection
} else if (ML_prediction === 'CRITICAL') {
  // Predictive detection
}
```

**Features**:
- Dual-mode: Rule-based + ML-based
- Breach prediction using linear regression
- Configurable thresholds
- Duplicate detection prevention

### 3. Planner (Decision Engine)

**Location**: `backend/src/controlPlane/planner.js`

**Responsibilities**:
- Candidate selection
- Route optimization
- Traffic weight calculation
- Playbook selection

**Selection Criteria**:
```javascript
1. Node health > 60
2. CPU < 80%
3. Not under attack
4. Not in unsuitable list
5. Highest health score wins
```

**Playbook Types**:
- `traffic_shift` - Standard rerouting
- `ddos_shield` - DDoS mitigation
- `flash_crowd` - Burst traffic handling

### 4. Safety Gate (Policy Engine)

**Location**: `backend/src/safetyGate.js`

**Responsibilities**:
- Pre-execution validation
- Policy enforcement
- Risk assessment
- Human escalation decisions

**Safety Checks**:
```javascript
1. AI Confidence >= 80%
2. Source node is degraded
3. Target node is healthy
4. Target has capacity (CPU < 80%)
5. Telemetry is fresh (< 5s old)
6. Cooldown period elapsed (> 15s)
7. Fallback candidates exist
```

**Outcomes**:
- `ALLOW_AUTONOMOUS_ACTION` - Proceed
- `REQUIRE_HUMAN_REVIEW` - Escalate
- `CONTINUE_MONITORING` - Wait
- `ABSTAIN` - Skip
- `NO_SAFE_TARGET` - Abort
- `BLOCK` - Deny

### 5. Verifier (Verification Engine)

**Location**: `backend/src/controlPlane/verifier.js`

**Responsibilities**:
- Post-action verification
- Success validation
- Rollback detection
- Performance measurement

**Verification Process**:
```javascript
1. Wait 800ms (settle time)
2. Capture 3 telemetry snapshots
3. Calculate averages
4. Compare pre/post metrics
5. Check target stability
6. Determine success/failure
```

**Success Criteria**:
- Latency improved by 15%+
- Target node stable
- No error rate spike
- Traffic shifted as planned

### 6. Neural Network (ML Engine)

**Location**: `backend/src/agentML.js`

**Architecture**:
```
Input Layer (9 neurons)
    ↓
Hidden Layer (16 neurons, ReLU)
    ↓
Output Layer (3 neurons, Softmax)
    ↓
Classifications: [NORMAL, WARNING, CRITICAL]
```

**Features**:
- Backpropagation training
- Online learning capability
- Model persistence
- Feature importance analysis
- Confusion matrix tracking

**Input Features**:
1. Latency
2. CPU usage
3. Memory usage
4. Error rate
5. Queue depth
6. Traffic load
7. Latency trend
8. Error trend
9. Time of day

### 7. Event Store

**Location**: `backend/src/eventStore.js`

**Responsibilities**:
- Audit trail
- Event logging
- Metrics aggregation
- Historical analysis

**Event Types**:
- `INFO` - Informational
- `WARNING` - Warnings
- `CRITICAL` - Critical events
- `ACTION` - System actions

## Decision Pipeline

### End-to-End Flow

```
1. MONITORING (Continuous)
   ├─ Node health polling (2s intervals)
   ├─ Metrics collection
   └─ Telemetry aggregation

2. DETECTION (Sentinel)
   ├─ Rule-based: latency > threshold
   ├─ ML-based: neural network prediction
   ├─ Breach prediction: linear regression
   └─ Event: ANOMALY_DETECTED

3. INVESTIGATION (Investigator)
   ├─ Evidence gathering
   ├─ Pattern analysis
   ├─ Incident correlation
   └─ Event: EVIDENCE_GATHERED

4. PLANNING (Planner)
   ├─ Candidate evaluation
   ├─ Route selection
   ├─ Traffic calculation
   └─ Event: REROUTE_PLANNED

5. SAFETY CHECK (Safety Gate)
   ├─ Policy validation
   ├─ Risk assessment
   ├─ Confidence verification
   └─ Decision: ALLOW/DENY/REVIEW

6. EXECUTION (Action Executor)
   ├─ Traffic weight adjustment
   ├─ State transition
   ├─ Notification dispatch
   └─ Event: REROUTE_INITIATED

7. VERIFICATION (Verifier)
   ├─ Wait for stabilization
   ├─ Metrics comparison
   ├─ Success determination
   └─ Event: VERIFICATION_COMPLETE

8. AUDIT (Event Store)
   ├─ Decision receipt creation
   ├─ Full trace logging
   ├─ Metrics recording
   └─ Archive to disk
```

### Timing Breakdown

| Phase | Duration | Notes |
|-------|----------|-------|
| Detection | 0-2s | Polling interval |
| Investigation | 50-150ms | Evidence gathering |
| Planning | 100-200ms | Candidate selection |
| Safety Check | 10-50ms | Policy validation |
| Execution | 200-500ms | Traffic adjustment |
| Verification | 800-3000ms | 3× polling @ 800ms intervals |
| **Total** | **1.2-6s** | End-to-end incident response |

## Neural Network Architecture

### Model Specifications

```javascript
Architecture: Feedforward Neural Network
├─ Input: 9 features
├─ Hidden: 16 neurons (ReLU activation)
├─ Output: 3 classes (Softmax activation)
├─ Training: Backpropagation (SGD)
├─ Learning Rate: 0.01
└─ Epochs: 300-500

Performance:
├─ Accuracy: 98.5-99.5%
├─ Precision: 99-100%
├─ Recall: 98-100%
└─ F1 Score: 99-100%
```

### Training Process

```javascript
1. Dataset Generation (500 samples)
   ├─ Normal: 60%
   ├─ Warning: 25%
   └─ Critical: 15%

2. Split
   ├─ Training: 70% (350 samples)
   ├─ Validation: 15% (75 samples)
   └─ Test: 15% (75 samples, held out)

3. Training Loop
   ├─ Forward pass
   ├─ Loss calculation (Cross-entropy)
   ├─ Backward pass
   └─ Weight update

4. Validation
   ├─ Every 50 epochs
   ├─ Early stopping if no improvement
   └─ Best model selection

5. Testing
   ├─ Final evaluation on held-out set
   └─ Confusion matrix generation
```

### Online Learning

```javascript
After each incident:
1. Extract actual features
2. Determine actual class
3. Fine-tune model (10 epochs)
4. Update performance metrics
5. Save updated model
```

## Safety System

### Multi-Layer Defense

```
Layer 1: Input Validation
  ├─ Parameter bounds checking
  ├─ Type validation
  └─ Sanitization

Layer 2: Business Rules
  ├─ Node eligibility
  ├─ Resource availability
  └─ Timing constraints

Layer 3: ML Confidence
  ├─ Prediction confidence >= 80%
  ├─ Feature quality check
  └─ Model freshness

Layer 4: Policy Engine
  ├─ Safety gate checks
  ├─ Risk assessment
  └─ Escalation rules

Layer 5: Verification
  ├─ Post-action validation
  ├─ Rollback detection
  └─ Success confirmation

Layer 6: Audit Trail
  ├─ Complete logging
  ├─ Receipt generation
  └─ Forensics capability
```

### Fail-Safe Mechanisms

1. **Cooldown Period**: Minimum 15s between reroutes
2. **Unsuitable Node Tracking**: Temporarily blacklist failed targets
3. **Rollback Detection**: Automatic revert if verification fails
4. **Human Escalation**: Low confidence triggers review
5. **Emergency Stop**: Manual override capability

## Data Flow

### Real-Time Metrics Flow

```
Node Simulator → Agent → Orchestrator → Frontend
     ↓              ↓           ↓
  Telemetry    Aggregation  WebSocket
     ↓              ↓           ↓
  Local Cache  Event Store  Live Updates
```

### Decision Flow

```
Telemetry → Sentinel → Investigator → Planner
                ↓            ↓           ↓
           Detection    Evidence    Recommendation
                ↓            ↓           ↓
          Event Store ← Safety Gate → Action Executor
                              ↓
                         Verification
                              ↓
                       Decision Receipt
```

## Scalability

### Horizontal Scaling

- Stateless API design
- Shared state via external store (planned)
- Load balancer distribution
- Independent node instances

### Vertical Scaling

- CPU: Neural network training
- Memory: Event history, metrics cache
- Disk: Logs, model persistence

### Performance Optimizations

1. **Caching**
   - In-memory metrics cache
   - Computed health scores
   - Recent decisions

2. **Batch Processing**
   - Event logging
   - Metrics aggregation
   - Receipt generation

3. **Async Operations**
   - Non-blocking I/O
   - Promise-based flow
   - Event-driven architecture

## Security Architecture

### Authentication & Authorization

- API key validation
- Rate limiting per endpoint
- IP whitelisting capability
- Role-based access (planned)

### Data Protection

- Input sanitization
- XSS prevention
- SQL injection prevention (if DB added)
- Secure headers (CSP, HSTS, etc.)

### Network Security

- CORS configuration
- TLS/SSL encryption
- Port isolation
- Firewall recommendations

### Audit & Compliance

- Complete action logging
- Decision traceability
- Immutable audit trail
- Forensics capability

---

**Document Version**: 1.0  
**Last Updated**: December 2024  
**System Version**: 5.0.0


---

## V5: Safety Gate & Kill-Switch Architecture

### Safety Gate: 8-Layer Defense System

The Safety Gate is a **deterministic policy layer** that sits between AI prediction and autonomous action. The AI never directly controls rerouting — this gate does. Every autonomous action must pass **all 8 safety checks** before execution.

#### Check 1: AI Confidence Threshold
**Purpose:** Ensure the ML model is confident in its classification  
**Threshold:** ≥0.80 (80% confidence minimum for autonomous actions)  
**Rationale:** Low-confidence predictions require human review. Abstention mechanism prevents overconfident autonomous actions on uncertain scenarios.  
**Failure Mode:** `REQUIRE_HUMAN_REVIEW` if confidence < 0.80

```javascript
confidence >= policy.minAutonomousConfidence (default: 0.80)
```

#### Check 2: Source Node Degradation Verification
**Purpose:** Confirm the source node is actually degraded/under attack  
**Criteria:** 
- Status is CRITICAL or WARNING, OR
- `isUnderAttack` flag is true, OR  
- Health score < 70%, OR
- Metrics show critical state

**Rationale:** Prevents unnecessary reroutes on healthy nodes. A reroute from a healthy node is wasteful and risks introducing instability.  
**Failure Mode:** `CONTINUE_MONITORING` if source is healthy (false positive)

#### Check 3: Target Node Health Verification
**Purpose:** Ensure the destination node can handle additional traffic  
**Threshold:** Target health ≥65% AND not under attack  
**Rationale:** Rerouting to an unhealthy or attacked node cascades the problem. This check enforces "route to strength, not weakness."  
**Failure Mode:** `NO_SAFE_TARGET` if no healthy alternatives exist

#### Check 4: Target CPU Capacity Check
**Purpose:** Prevent overloading the target node with too much traffic  
**Threshold:** Target CPU < 80%  
**Rationale:** A node at 80%+ CPU is approaching saturation. Rerouting more traffic would push it into degradation, creating a cascading failure.  
**Failure Mode:** `BLOCK` if target CPU ≥80%

#### Check 5: Telemetry Freshness
**Purpose:** Ensure decisions are based on current data, not stale readings  
**Threshold:** Telemetry age < 5 seconds  
**Rationale:** Stale telemetry means the actual node state is unknown. Acting on old data risks routing traffic to a node that has since degraded.  
**Failure Mode:** `REQUIRE_HUMAN_REVIEW` if telemetry age >5s

#### Check 6: Cooldown Period
**Purpose:** Prevent rapid oscillation (reroute → reroute → reroute)  
**Threshold:** ≥15 seconds since last reroute  
**Rationale:** System needs time to stabilize after a reroute. Rapid changes create oscillation and prevent meaningful verification. Cooldown enforces stability windows.  
**Failure Mode:** `CONTINUE_MONITORING` if cooldown active

#### Check 7: Fallback Alternatives Exist
**Purpose:** Ensure at least one additional healthy node exists as backup  
**Threshold:** ≥1 healthy node (not source, not target)  
**Rationale:** Prevents routing into a single point of failure. If the target node degrades immediately after reroute, there must be another healthy node to fail over to.  
**Failure Mode:** `NO_SAFE_TARGET` if only one healthy node exists

#### Check 8: Target Not Overloaded (Circuit Breaker)
**Purpose:** Detect if target is already overloaded despite passing previous checks  
**Threshold:** Target CPU <90% AND health ≥40%  
**Rationale:** Final sanity check. Even if a node passed Check 3 and 4, real-time conditions may have changed. This is the circuit breaker that stops a clearly bad reroute.  
**Failure Mode:** `BLOCK` if target shows overload signals

---

### Safety Outcomes

| Outcome | Meaning | Action | Example |
|---------|---------|--------|---------|
| `ALLOW_AUTONOMOUS_ACTION` | All checks passed | Execute reroute autonomously | Normal healthy reroute |
| `REQUIRE_HUMAN_REVIEW` | AI abstained or low confidence | Escalate to operator | Confidence 75% (below 80% threshold) |
| `CONTINUE_MONITORING` | Source not actually degraded, or cooldown active | Wait and re-check | False positive, or too soon after last action |
| `NO_SAFE_TARGET` | No healthy nodes available | Alert operator, no action | All nodes degraded |
| `BLOCK` | Critical safety violation | Prevent action, log reason | Target at 95% CPU |
| `ABSTAIN` | Model explicitly abstained | Escalate to human | Edge case the model can't handle |

---

### Kill-Switch & Rollback Mechanism

#### Kill-Switch: Immediate Action Termination

**Trigger Methods:**
1. **Manual Override:** POST `/api/actions/kill-switch` (emergency stop)
2. **Verification Failure:** Automatic rollback if post-action verification fails
3. **Operator Command:** Dashboard "STOP ALL AUTONOMOUS ACTIONS" button

**Kill-Switch Actions:**
```javascript
1. Set global flag: autonomousActionsEnabled = false
2. Cancel any in-flight reroutes
3. Log kill-switch trigger (who, when, reason)
4. Broadcast emergency state to all clients
5. Freeze current traffic weights (no further changes)
```

**Resumption:** Requires explicit operator re-enablement after review

#### Rollback: Undo Autonomous Actions

**Automatic Rollback Triggers:**
- Verification check fails (target node still unhealthy 10s after reroute)
- Post-action health check shows degradation on target node
- New incident detected on target node within 30s of reroute

**Rollback Process:**
```javascript
1. Capture current state (weights, health scores, timestamps)
2. Restore previous traffic distribution (pre-reroute state)
3. Create rollback decision receipt
4. Increment rollback counter (track system stability)
5. Mark original action as ROLLED_BACK in audit log
```

**Rollback Limitations:**
- Can only roll back traffic weight changes (cannot un-fail a request)
- Rollback itself is subject to safety gate checks (prevents cascading rollbacks)
- Maximum 3 rollbacks per incident (circuit breaker)

---

### API Endpoints for Kill-Switch & Rollback

```javascript
// Emergency stop all autonomous actions
POST /api/actions/kill-switch
{
  "reason": "Operator-initiated emergency stop",
  "operator": "admin@company.com"
}

// Re-enable autonomous actions (after review)
POST /api/actions/resume
{
  "operator": "admin@company.com",
  "justification": "Issue resolved, system stable"
}

// Rollback specific action
POST /api/actions/:actionId/rollback
{
  "reason": "Action did not improve situation"
}

// Check kill-switch status
GET /api/actions/status
Response: {
  "autonomousActionsEnabled": true/false,
  "lastKillSwitchTrigger": timestamp,
  "lastKillSwitchReason": "...",
  "rollbackCount": 3
}
```

---

### Safety Gate Configuration (Tunable)

All thresholds are configurable via `/api/settings`:

```javascript
{
  "minAutonomousConfidence": 0.80,  // 80% AI confidence minimum
  "maxTargetCpu": 80,               // Max CPU % for target node
  "minTargetHealth": 65,            // Min health score for target
  "maxTelemetryAgeMs": 5000,        // Telemetry must be <5s old
  "cooldownMs": 15000,              // 15s between reroutes
  "minHealthyAlternatives": 1,      // At least 1 fallback node required
  "maxRollbacksPerIncident": 3      // Circuit breaker: stop after 3 rollbacks
}
```

**Recommended Settings:**
- **Development:** Lower thresholds for testing (minAutonomousConfidence: 0.70)
- **Staging:** Standard thresholds (as above)
- **Production:** Higher thresholds for safety (minAutonomousConfidence: 0.85, cooldownMs: 30000)

---

### Decision Receipt Integration

Every safety gate evaluation is recorded in the decision receipt:

```json
{
  "safetyGate": {
    "passed": true,
    "checks": [
      { "name": "AI_CONFIDENCE", "passed": true, "reason": "Confidence 92.3% ≥ threshold 80%" },
      { "name": "SOURCE_DEGRADED", "passed": true, "reason": "Source node is in degraded/attacked state" },
      { "name": "TARGET_HEALTHY", "passed": true, "reason": "Target health 89/100 — OK" },
      { "name": "TARGET_CAPACITY", "passed": true, "reason": "Target CPU 45.2% — capacity available" },
      { "name": "FRESH_TELEMETRY", "passed": true, "reason": "Telemetry age: 1250ms — fresh" },
      { "name": "COOLDOWN_CLEAR", "passed": true, "reason": "Cooldown clear (23400ms since last reroute)" },
      { "name": "FALLBACK_EXISTS", "passed": true, "reason": "2 additional healthy node(s) available as fallback" },
      { "name": "TARGET_NOT_OVERLOADED", "passed": true, "reason": "Target not overloaded" }
    ],
    "outcome": "ALLOW_AUTONOMOUS_ACTION",
    "blockedReason": null,
    "policy": {
      "minAutonomousConfidence": 0.80,
      "maxTargetCpu": 80,
      "minTargetHealth": 65
    }
  }
}
```

---

### Failure Scenario: What Stops a Bad Action?

**Scenario:** AI predicts degradation on Node 1 with 95% confidence. Node 2 looks healthy in telemetry (85% health, 60% CPU). System plans to reroute traffic 1→2. But Node 2 is actually experiencing a slow memory leak not yet visible in CPU metrics.

**Safety Gate Defense Layers:**

1. ✓ **Check 1 (Confidence):** Passes (95% > 80%)
2. ✓ **Check 2 (Source Degraded):** Passes (Node 1 is actually degraded)
3. ✓ **Check 3 (Target Healthy):** Passes (Node 2 shows 85% health)
4. ✓ **Check 4 (Target Capacity):** Passes (CPU 60% < 80%)
5. ✓ **Check 5 (Telemetry Fresh):** Passes (2s old)
6. ✓ **Check 6 (Cooldown):** Passes (45s since last reroute)
7. ✓ **Check 7 (Fallback Exists):** Passes (Node 3 is healthy)
8. ✓ **Check 8 (Not Overloaded):** Passes (no overload signals yet)

**Result:** `ALLOW_AUTONOMOUS_ACTION` — action executes

**Post-Action Verification (10 seconds later):**
- Target node health drops to 55% (below 70% threshold)
- Latency on Node 2 spikes to 850ms
- Verification check: **FAILED**

**Automatic Rollback Triggered:**
1. Traffic weights restored to pre-reroute state (Node 1: 60%, Node 2: 25%, Node 3: 15%)
2. Rollback decision receipt created
3. Incident marked as `VERIFICATION_FAILED` with `ROLLBACK_EXECUTED`
4. Adaptor replans: next candidate is Node 3 (the fallback)
5. Safety gate re-evaluates for Node 1→3 reroute
6. If passes, executes; if fails, escalates to human

**Outcome:** Bad action was executed (safety gate cannot predict future), but rollback mechanism prevented prolonged degradation. System self-corrected within 10 seconds.

---

### Design Principles

1. **Defense in Depth:** 8 independent checks, each with clear rationale
2. **Fail-Safe Defaults:** When in doubt, block or escalate to human
3. **Explainability:** Every check has a human-readable reason string
4. **Auditability:** All evaluations logged in decision receipts
5. **Tunability:** All thresholds configurable without code changes
6. **Circuit Breaker:** Rollback limit prevents infinite loops
7. **Human Override:** Kill-switch always available for emergency stop

---

**Last Updated:** 2026-09-02  
**Version:** NFV5 (V5 Control Plane)  
**Buildathon:** Razorpay AI Buildathon 2026 - Open Track
