# NEURALFLOW NFV5 IMPLEMENTATION PLAN
**Generated**: 2026-08-31
**Target**: Upgrade NFV3 → NFV5 (Parts A-D)

---

## PHASE 01-03: REPOSITORY FORENSICS & CAPABILITY MAP

### Repository Structure
```
NFV3/
├── backend/src/          # Core backend (16 modules)
│   ├── server.js         # Main server + WebSocket
│   ├── agentML.js        # Brain.js neural network
│   ├── aiEngine.js       # Decision logic
│   ├── safetyGate.js     # Policy enforcement
│   ├── verificationEngine.js
│   ├── evidenceBuilder.js
│   ├── decisionReceipt.js
│   ├── attackEngine.js
│   ├── nodeSimulator.js  # Internal nodes
│   ├── externalNodeAdapter.js  # BharatBazaar adapter
│   ├── monitor.js
│   ├── eventStore.js
│   ├── data.js
│   ├── agent.js          # Legacy infrastructure agent
│   ├── appNode.js        # Child process nodes
│   └── realWebsiteMonitor.js
├── frontend/src/         # React dashboard
│   ├── pages/            # 9 pages
│   ├── components/       # ~30 components (3D, UI, panels)
│   ├── store/            # Zustand state
│   ├── hooks/            # useWebSocket
│   └── config.js
├── BharatBazaar 2/       # External e-commerce project
├── docker-compose.yml
└── .github/workflows/    # CI/CD
```

### EXISTING CAPABILITIES AUDIT

#### ✅ WORKING & WELL-STRUCTURED
1. **Brain.js ML Model** (agentML.js)
   - Neural network with proper train/test split
   - Seeded random for reproducibility
   - Confusion matrix evaluation
   - Feature importance
   - STATUS: **WORKING** - Keep & enhance

2. **Safety Gate** (safetyGate.js)
   - 6 deterministic policy checks
   - Structured pass/fail/block outcomes
   - Telemetry freshness validation
   - STATUS: **WORKING** - Keep & enhance

3. **Verification Engine** (verificationEngine.js)
   - Independent post-action verification
   - Pre/post snapshot comparison
   - Recovery confirmation
   - STATUS: **WORKING** - Keep & enhance

4. **Evidence Builder** (evidenceBuilder.js)
   - Captures telemetry snapshots
   - Feature attribution
   - STATUS: **WORKING** - Keep & enhance

5. **Decision Receipts** (decisionReceipt.js)
   - Structured audit trail
   - JSON persistence
   - Feedback mechanism
   - STATUS: **WORKING** - Keep & enhance

6. **Event Store** (eventStore.js)
   - Centralized event management
   - Ring buffer (1000 events)
   - STATUS: **WORKING** - Keep

7. **Dual Environment** (server.js)
   - INTERNAL: Internal demo nodes
   - EXTERNAL: BharatBazaar integration
   - Dynamic switching
   - STATUS: **WORKING** - Keep

8. **WebSocket Real-time** (server.js)
   - Live telemetry broadcast
   - Event streaming
   - STATUS: **WORKING** - Keep

#### ⚠️ PARTIAL / NEEDS ENHANCEMENT

9. **AI Decision Engine** (server.js runAIDecisionEngine)
   - CURRENT: Monolithic function (~400 lines)
   - CURRENT: State machine (NORMAL → DETECTED → PREDICTED → REROUTING → VERIFYING → RESOLVED → COOLDOWN)
   - ISSUE: Not modular
   - ISSUE: Investigation/correlation not explicit
   - ISSUE: No clear goal establishment
   - ISSUE: Planning not separated from execution
   - **GAP**: Needs decomposition per NFV5 spec

10. **Agent Logic** (agent.js + aiEngine.js)
    - CURRENT: Two separate agent implementations
    - ISSUE: Duplicate/unclear responsibility
    - **GAP**: Needs consolidation into NFV5 agent supervisor

11. **Incident State Management**
    - CURRENT: Global `incident` object in server.js
    - ISSUE: Not refresh-safe, not modular
    - **GAP**: Needs proper state machine with valid transitions

12. **Failure Adaptation**
    - CURRENT: Limited - cooldown only
    - ISSUE: No failed-target rejection
    - ISSUE: No replanning after verification failure
    - **GAP**: Critical NFV5 requirement MISSING

#### ❌ MISSING (NFV5 Requirements)

13. **Correlation Engine**
    - STATUS: **NOT IMPLEMENTED**
    - NEEDED: Group related signals into single incident

14. **Risk Engine (Separate from Confidence)**
    - STATUS: **PARTIAL** - anomaly probability exists but not a separate risk score
    - NEEDED: Distinct risk calculation with contributor breakdown

15. **Goal Supervisor**
    - STATUS: **NOT IMPLEMENTED**
    - NEEDED: Explicit operational mission (maintain availability, minimize latency, etc.)

16. **Context-Aware Planner**
    - STATUS: **NOT IMPLEMENTED**
    - NEEDED: Structured plan with alternatives, reasons, expected outcomes

17. **Candidate Ranking Explainer**
    - STATUS: **NOT IMPLEMENTED**
    - NEEDED: Why this node? Why not others? Score breakdown

18. **Incident Memory/History**
    - STATUS: **NOT IMPLEMENTED**
    - NEEDED: Learn from previous incidents

19. **Replay System**
    - STATUS: **NOT IMPLEMENTED**
    - NEEDED: Reproduce incidents for debugging/judging

20. **Adaptation After Failure**
    - STATUS: **CRITICAL MISSING**
    - NEEDED: Detect verification failure → mark target unsuitable → replan → select alternative

21. **Canonical Event Model**
    - STATUS: **PARTIAL** - events exist but not standardized
    - NEEDED: TELEMETRY_RECEIVED, ANOMALY_DETECTED, INVESTIGATION_STARTED, etc.

22. **Data Contracts**
    - STATUS: **NO VALIDATION**
    - NEEDED: Validated schemas for telemetry, evidence, risk, plan, etc.

### STALE/JUNK FILES TO REMOVE
- `backend.log`, `backend.pid` (runtime artifacts)
- `BharatBazaar 2/` (external project, not part of NeuralFlow)
- `fsd/` (prototype files)
- `project_documentation/` (old docs)
- `SENSITIVE_FILES/` (check contents first)
- `commit-to-github.bat`, `START_PROJECT.bat` (local scripts)
- `BHARATBAZAAR_INTEGRATION_SNIPPET.html`, `Untitled-2.html`
- `NFV3ppt.pptx`

### BHARATBAZAAR INTEGRATION AUDIT
**Current State:**
- BharatBazaar is a separate e-commerce project in `BharatBazaar 2/` folder
- ExternalNodeAdapter polls BharatBazaar health endpoints
- Server supports EXTERNAL environment mode
- Traffic routing between BB-NODE-1, BB-NODE-2, BB-NODE-3

**Assessment:**
- Integration architecture is sound
- BharatBazaar folder should be excluded from NeuralFlow repo
- ExternalNodeAdapter is the correct integration point
- Keep adapter, remove external project folder

---

## NFV5 IMPLEMENTATION PHASES (Parts A-D)

### PART A: ARCHITECTURE (PHASES 04-08)

#### PHASE 04: Data Contracts ✅
**Create:** `backend/src/contracts/`
- `telemetry.contract.js` - validate telemetry shape
- `evidence.contract.js` - validate evidence bundle
- `risk.contract.js` - validate risk assessment
- `plan.contract.js` - validate action plans
- `verification.contract.js` - validate verification results
- `validator.js` - central validation utility

#### PHASE 05: State Machine ✅
**Create:** `backend/src/core/incidentStateMachine.js`
- States: IDLE, MONITORING, ANOMALY_DETECTED, INVESTIGATING, CORRELATING, ANALYZING, GOAL_ESTABLISHED, PLANNING, POLICY_CHECK, EXECUTING, VERIFYING, RECOVERED, ADAPTING, REPLANNING, FAILED, CLOSED
- Valid transitions only
- Event emission on state change
- Refresh-safe, reconnect-safe

#### PHASE 06: Canonical Event Model ✅
**Create:** `backend/src/core/eventTypes.js`
- Define all event types:
  - TELEMETRY_RECEIVED
  - ANOMALY_DETECTED
  - INVESTIGATION_STARTED
  - EVIDENCE_COLLECTED
  - CORRELATION_COMPLETED
  - RISK_CALCULATED
  - GOAL_ESTABLISHED
  - PLAN_CREATED
  - POLICY_CHECK_STARTED
  - POLICY_APPROVED
  - POLICY_BLOCKED
  - ACTION_STARTED
  - ACTION_COMPLETED
  - VERIFICATION_STARTED
  - VERIFICATION_PASSED
  - VERIFICATION_FAILED
  - ADAPTATION_STARTED
  - REPLAN_COMPLETED
  - RECOVERY_CONFIRMED
  - INCIDENT_CLOSED

**Modify:** `backend/src/eventStore.js`
- Use canonical event types
- Structured event payload

#### PHASE 07: ML/Evaluation Hardening ✅
**Modify:** `backend/src/agentML.js`
- Add model versioning
- Add dataset versioning
- Document training seed
- Improve evaluation metrics display
- Add confidence abstention threshold

#### PHASE 08: Modular Control Plane ✅
**Create:** `backend/src/controlPlane/`
- `sentinel.js` - Monitor telemetry, detect anomalies
- `investigator.js` - Collect evidence after detection
- `correlator.js` - Group related signals
- `riskEngine.js` - Calculate operational danger score
- `goalSupervisor.js` - Establish operational mission
- `planner.js` - Context-aware action planning
- `policyEngine.js` - Wrap safetyGate with additional checks
- `actionExecutor.js` - Execute validated actions
- `verifier.js` - Wrap verificationEngine
- `adaptor.js` - Handle failure → replanning
- `index.js` - Export control plane

### PART B: AI, AGENT & DECISION INTELLIGENCE (PHASES 09-12)

#### PHASE 09: Evidence + Correlation ✅
**Enhance:** `backend/src/controlPlane/investigator.js`
- Structured evidence with baseline/current/trend
- Signal comparison

**Implement:** `backend/src/controlPlane/correlator.js`
- Time window correlation
- Signal family grouping
- Avoid duplicate incidents for same root cause

#### PHASE 10: Risk + Confidence ✅
**Implement:** `backend/src/controlPlane/riskEngine.js`
- Separate risk score (operational danger)
- Separate confidence score (model certainty)
- Contributor breakdown
- Risk severity levels: LOW, MEDIUM, HIGH, CRITICAL

**Modify:** `backend/src/agentML.js`
- Return confidence with predictions
- Implement abstention when confidence < threshold

#### PHASE 11: Goal Supervisor ✅
**Implement:** `backend/src/controlPlane/goalSupervisor.js`
- Establish operational mission:
  - MAINTAIN_AVAILABILITY
  - MINIMIZE_LATENCY
  - REDUCE_ERROR_RATE
  - PRESERVE_CAPACITY
  - AVOID_UNHEALTHY_NODES
- Goal influences planner
- Store in incident state

#### PHASE 12: Planner ✅
**Implement:** `backend/src/controlPlane/planner.js`
- Context-aware planning
- Available actions: OBSERVE, WAIT, RETRY, REROUTE, SWITCH_NODE, ISOLATE_NODE, ESCALATE
- Each plan includes:
  - goal
  - action
  - sourceNode
  - targetNode
  - reason
  - expectedOutcome
  - risk
  - confidence
  - verificationCriteria
  - fallback
- Candidate node scoring with explainability
- Alternative evaluation

### PART C: SAFE ACTION, VERIFICATION & ADAPTATION (PHASES 13-16)

#### PHASE 13: Policy Engine ✅
**Enhance:** `backend/src/safetyGate.js`
- Wrap in policy engine
- Add telemetry freshness check (< 5 seconds)
- Add cooldown enforcement
- Add retry count tracking
- Add last-healthy-node protection
- Return structured reasons for BLOCK/ABSTAIN

#### PHASE 14: Action Executor ✅
**Implement:** `backend/src/controlPlane/actionExecutor.js`
- Execute only validated actions
- Generate actionId for traceability
- Idempotency protection
- Emit ACTION_STARTED, ACTION_COMPLETED, ACTION_FAILED events
- Actual backend state change (traffic weights)

#### PHASE 15: Independent Verification ✅
**Enhance:** `backend/src/verificationEngine.js`
- Pre-snapshot capture
- Post-snapshot sampling with configurable windows
- Criteria checks:
  - Latency improved
  - Error rate reduced
  - Health recovered
  - Availability maintained
- Return: VERIFIED_SUCCESS, PARTIAL_RECOVERY, VERIFICATION_FAILED, UNKNOWN

#### PHASE 16: Failure Adaptation ✅
**Implement:** `backend/src/controlPlane/adaptor.js`
- Detect VERIFICATION_FAILED
- Mark failed target as unsuitable
- Store failure evidence
- Trigger replanning
- Bounded retry (MAX_ADAPTATION_STEPS = 3)
- Escalate when limits reached

**Critical Test Scenario:**
```
NODE A DEGRADES
↓ DETECT → INVESTIGATE → RISK → GOAL → PLAN NODE B
↓ POLICY → REROUTE
↓ VERIFY → NODE B FAILS
↓ VERIFICATION_FAILED
↓ ADAPT → MARK NODE B UNSUITABLE
↓ REPLAN → SELECT NODE C
↓ POLICY → REROUTE
↓ VERIFY → RECOVERED
```

### PART D: PRODUCT, OBSERVABILITY, EVIDENCE & DEMO (PHASES 17-20)

#### PHASE 17: Receipts, Replay, Memory ✅
**Enhance:** `backend/src/decisionReceipt.js`
- Include all NFV5 fields:
  - Detection evidence
  - Risk score + contributors
  - Confidence score
  - Goal
  - Plan with alternatives
  - Policy checks
  - Verification results
  - Adaptation history
- Generate JSON receipts

**Implement:** `backend/src/incidentMemory.js`
- Store incident outcomes
- Similarity matching for future incidents
- Lookup previous strategies

**Implement:** `backend/src/replayEngine.js`
- Replay recorded incidents
- Step-by-step playback
- Compare expected vs actual

#### PHASE 18: Benchmark System ✅
**Implement:** `backend/src/benchmark/`
- `scenarios.js` - Define test scenarios
- `executor.js` - Run benchmarks
- `metrics.js` - Measure outcomes
- Scenarios:
  - NORMAL
  - LATENCY_SPIKE
  - NODE_DEGRADATION
  - NODE_FAILURE
  - FAILED_REROUTE
  - LOW_CONFIDENCE
  - STALE_TELEMETRY
- Measure:
  - Detection time
  - Investigation time
  - Decision time
  - Mitigation time
  - Recovery time
  - Adaptation count
  - Outcome (success/partial/failed)

#### PHASE 19: BharatBazaar Integration ✅
**Verify:** `backend/src/externalNodeAdapter.js`
- Already working
- Keep as-is
- Ensure EXTERNAL mode properly integrated with new control plane

**Cleanup:**
- Remove `BharatBazaar 2/` folder from repo
- Update .gitignore
- Document integration architecture

#### PHASE 20: Dashboard/UX Upgrade ✅
**Enhance:** Frontend components

**New Components:**
- `AgentMissionPanel.jsx` - Show goal, risk, confidence, phase
- `LiveAgentActivity.jsx` - Real lifecycle steps
- `ExplainabilityCenter.jsx` - Why this decision?
- `CandidateRanking.jsx` - Why this node? Why not others?
- `AdaptationTimeline.jsx` - Show failure → adapt → replan
- `DecisionReceipt.jsx` - Full audit display
- `IncidentReplay.jsx` - Replay recorded incidents
- `BenchmarkView.jsx` - Show measured results

**Update Existing:**
- `DashboardPage.jsx` - Integrate new panels
- `AIInsightsPage.jsx` - Show risk vs confidence
- `ComparisonPage.jsx` - Manual vs NeuralFlow benchmarks
- `AnalyticsPage.jsx` - Add adaptation metrics
- `NetworkTopology3D.jsx` - Show adaptation states

**State Management:**
- Update Zustand store for new incident state machine
- Add control plane phase tracking
- Add adaptation state

---

## IMPLEMENTATION GATES

### ✅ GATE A: Repository Understood
- [x] Full forensics complete
- [x] Capability map created
- [x] Gap analysis documented
- [x] Stale files identified

### 🔄 GATE B: Control Plane Works
- [ ] Modular control plane implemented
- [ ] State machine operational
- [ ] Event flow works end-to-end
- [ ] All phases execute in sequence

### 🔄 GATE C: Closed-Loop Action + Verification Works
- [ ] Detection → Action → Verification proven
- [ ] Real backend state changes
- [ ] Independent verification passes

### 🔄 GATE D: Failure + Adaptation Works
- [ ] Verification failure detected
- [ ] Failed target marked unsuitable
- [ ] Replanning triggers
- [ ] Alternative selected
- [ ] Recovery verified

### 🔄 GATE E: Evidence/Replay/Benchmark Works
- [ ] Decision receipts complete
- [ ] Incident replay functional
- [ ] Benchmark scenarios measurable

### 🔄 GATE F: Security + Test + Build Passes
- [ ] No secrets exposed
- [ ] Input validation
- [ ] Tests execute
- [ ] Build succeeds

---

## KEY ARCHITECTURAL DECISIONS

### 1. Modular Control Plane
**Decision:** Decompose monolithic `runAIDecisionEngine()` into separate modules
**Rationale:** Testability, maintainability, explainability
**Implementation:** `backend/src/controlPlane/` directory

### 2. State Machine Authority
**Decision:** Explicit state machine with valid transitions only
**Rationale:** Prevent invalid states, enable safe reconnect
**Implementation:** `backend/src/core/incidentStateMachine.js`

### 3. Backend as Truth
**Decision:** Backend owns all state, frontend is projection
**Rationale:** Consistency, reconnect safety, audit trail
**Implementation:** WebSocket state sync

### 4. Separation of Risk and Confidence
**Decision:** Risk = operational danger, Confidence = model certainty
**Rationale:** Autonomous systems must distinguish "how dangerous" from "how sure"
**Implementation:** Separate engines

### 5. Explicit Goal-Driven Behavior
**Decision:** Agent establishes operational mission
**Rationale:** Plans must satisfy a goal, not just react
**Implementation:** Goal supervisor influences planner

### 6. Failure as Learning Opportunity
**Decision:** Verification failure triggers adaptation
**Rationale:** Proves agentic behavior beyond detection
**Implementation:** Adaptor marks failed targets, triggers replanning

---

## RISK REGISTER

### P0 RISKS (Must Address)
1. **Breaking Existing Functionality**
   - Mitigation: Inspect before modifying, test after changes
2. **Infinite Agent Loops**
   - Mitigation: MAX_ADAPTATION_STEPS, bounded retries
3. **Stale Telemetry Decisions**
   - Mitigation: Freshness check in policy engine
4. **Race Conditions on State**
   - Mitigation: State machine with atomic transitions
5. **Verification False Positives**
   - Mitigation: Multiple samples, stabilization windows

### P1 RISKS (Should Address)
1. **Performance Degradation**
   - Mitigation: Benchmark before/after, optimize hot paths
2. **WebSocket Reconnect Issues**
   - Mitigation: State resync protocol
3. **BharatBazaar Integration Breakage**
   - Mitigation: Test EXTERNAL mode thoroughly

---

## NEXT STEPS

### Immediate (Start Implementation)
1. Create `backend/src/contracts/` with validation schemas
2. Create `backend/src/core/incidentStateMachine.js`
3. Create `backend/src/core/eventTypes.js`
4. Create `backend/src/controlPlane/` modules
5. Update `backend/src/server.js` to use new control plane
6. Test basic flow: DETECT → INVESTIGATE → PLAN → ACT → VERIFY

### Then
7. Implement adaptation logic
8. Test failure scenario: bad target → adapt → recover
9. Build decision receipts
10. Build replay engine
11. Build benchmarks
12. Update frontend

---

**STATUS:** Ready to proceed with implementation
**ESTIMATED TIME:** Parts A-D = 6-8 hours of focused engineering
**APPROVAL NEEDED:** Begin Phase 04?
