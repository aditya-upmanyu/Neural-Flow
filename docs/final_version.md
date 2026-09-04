# NFV5 → Razorpay AI Buildathon: Final Submission Master Prompt

**Purpose:** Paste this whole document into Claude Code (or hand section-by-section to
whichever AI dev tool/agent you're using) to take NFV5 from its current state to a
submission-ready Open Track entry. Work top to bottom — sections are ordered by priority,
not by "nice to have." Do not skip Section 1.

**Project context for the agent:** NFV5 is an autonomous infrastructure resilience
platform (sentinel → investigator → correlator → riskEngine → planner → policyEngine →
actionExecutor → verifier → adaptor), demoed against a mock e-commerce site
"BharatBazaar" that uses Razorpay for checkout. Submitting to Razorpay AI Buildathon,
**Open Track**. Judging criteria: Problem taste, Build quality, AI judgment, Failure
recovery. Same bar as the named tracks — "open doesn't mean easier."

---

## SECTION 1 — CRITICAL: Real Razorpay Integration

The current repo only exposes `RAZORPAY_KEY_ID` as a string — no real API calls. Fix
this first; nothing else matters if this stays fake.

1. Implement real Razorpay **test-mode order creation** (`orders.create`) in
   `backend/server.js` for BharatBazaar checkout — replace any placeholder/mock checkout
   logic with an actual call to the Razorpay Orders API using test keys.
2. Implement a **webhook listener** for `payment.captured` and `payment.failed` events.
   Verify webhook signatures properly (don't skip signature verification — a judge who
   checks this will notice).
3. Wire the webhook events into NFV5's own pipeline: a `payment.failed` burst or a spike
   in checkout latency should be a real, first-class event type that `sentinel.js` /
   `investigator.js` can detect and correlate — not a separate demo path from the rest of
   the system.
4. Add a `.env.example` entry for `RAZORPAY_KEY_SECRET` and `RAZORPAY_WEBHOOK_SECRET`
   (never commit real values — confirm `.env` stays gitignored).
5. Replace the hardcoded revenue-loss formula
   (`revenueLoss = failedRequestsCount * 0.15`) with a calculation derived from **real
   order amounts in INR (₹)**, not a flat USD constant. This number needs to survive a
   judge asking "how did you calculate this?"

**Acceptance test:** a reviewer should be able to trigger a real test-mode payment
failure and watch NFV5 detect it, log it, and attempt recovery — with an actual Razorpay
API call visible in the network tab / server logs, not a simulated event.

---

## SECTION 2 — AI/ML Engine Advancements (`backend/src/agentML.js`)

Current state: Brain.js feedforward net, hidden layers [12,8,6], leaky-relu, 9
synthetic features, seeded 70/15/15 split, confusion matrix + abstention threshold
already implemented. Good foundation — these are real improvements, not cosmetic ones.

### 2.1 Fix data integrity issues (do this before anything else in this section)
- Audit `generateTrainingData()` for **feature leakage**: `latencyTrend` and
  `errorTrend` are currently derived from the same `isAttack` rule that generates the
  label. Decouple feature generation from label generation, or at minimum document this
  clearly as a known limitation — don't let inflated accuracy go unexplained.
- Add a `[SYNTHETIC EVAL]` disclosure that's impossible to miss in both the UI and the
  README: this model is trained and evaluated on synthetic data; real-world
  generalization is untested. State it, don't hide it.

### 2.2 Add a real vs. synthetic evaluation split
- Use `realWebsiteMonitor.js`'s collected telemetry to build a small **held-out
  "real-world sanity check" set**, separate from the synthetic test set. Report both
  numbers side by side. A gap between them is fine and expected — showing you measured
  it is the point.

### 2.3 Add a baseline comparison
- Implement one simple baseline (rule-based threshold classifier, or logistic
  regression) and report its precision/recall/F1 next to the neural net's. "Neural net
  beats naive baseline by X points" is the single strongest sentence you can put in a
  pitch deck for an ML component.

### 2.4 Temporal features
- Move from instantaneous single-snapshot features to a **sliding window** (last 3–5
  readings: rolling mean, rolling std, rate of change) for latency/error/CPU/queue
  metrics. Attacks and degradations are sequences, not points — this is a genuine
  architectural improvement, not just more parameters.

### 2.5 Calibration
- Add a calibration check (reliability diagram or Brier score) comparing predicted
  confidence to actual accuracy. Confidence numbers that aren't calibrated are
  decorative; this closes that gap and directly supports the "honest AI" story.

### 2.6 Class imbalance
- Current synthetic data is 40% attack / 60% normal. Real systems see attacks far less
  often (single-digit %). Add and report a second evaluation run on an imbalanced split
  so precision/recall numbers aren't flattered by an unrealistic base rate.

### 2.7 Cross-validation
- Replace or supplement the single train/val/test split with k-fold cross-validation to
  show metric stability, not a single lucky split.

### 2.8 Expose what's already built but hidden
- `getFeatureImportance()` already exists — wire it into the UI. Showing *why* the model
  flagged something is a bigger "AI judgment" signal than the flag itself.
- The single-sample online retrain path already exists — build one clear demo scenario
  around it: simulate drift, show the model adapting live.
- Track **abstention rate** as an aggregate dashboard metric ("model abstained on X% of
  cases, here's why"), not just a per-prediction flag.

### 2.9 Write a `MODEL_CARD.md`
Include: architecture, hyperparameters, data source and generation method, seed,
split ratios, full metrics (accuracy/precision/recall/F1/FPR/FNR) on both synthetic and
real-check sets, calibration results, and an explicit "known limitations" section.

---

## SECTION 3 — Agent / Control-Plane Engine Enhancements

The sentinel → investigator → correlator → riskEngine → planner → policyEngine →
actionExecutor → verifier → adaptor pipeline is the strongest part of this project —
extend it, don't replace it.

1. **Decision receipts as first-class, exportable artifacts.** Every autonomous action
   should produce a structured, timestamped receipt (trigger → evidence → confidence →
   policy check → action taken → verification result) that's one click to export as
   JSON/PDF. This is your audit trail and your best evidence for "explainable, bounded,
   gated."
2. **Record one real end-to-end failure-recovery case.** Trigger a verification failure
   on purpose, let the adaptor replan, and keep the full log as a demo asset — this is
   literally the "failure recovery" judging criterion, made concrete instead of claimed.
3. **Harden the safety gate.** Document all 8 gate checks explicitly in
   `ARCHITECTURE.md` with a short rationale for each — a judge should be able to read
   this and understand exactly what stops a bad action from executing.
4. **Add a kill-switch / rollback path** for any autonomous action, and show it being
   exercised at least once in the demo. "Bounded" isn't credible without a visible undo.
5. **Integration tests** between BharatBazaar and NFV5's control plane, actually running
   in CI (the `ci.yml` already exists — make sure it runs these, not just lints).

---

## SECTION 4 — UI/UX, Design, Animation, 3D

Goal: the dashboard should communicate system state and AI reasoning at a glance, in
the first 10 seconds of the pitch video — not just look good.

1. **Hero metric above the fold.** "₹X revenue protected" or "Checkout uptime %" as the
   single largest, most prominent number on the dashboard landing view.
2. **Live system topology view.** A node graph (2D is fine; 3D is a stretch goal, see
   below) showing services/nodes, color-coded by health state (normal / degraded /
   recovering), animating in real time as the sentinel detects and the actionExecutor
   responds. This is the single highest-leverage visual for a 5-minute pitch video.
3. **3D visualization (optional stretch, only if time allows):**
   - Use a lightweight WebGL library (Three.js or a React wrapper) for a 3D node/network
     graph rather than trying to 3D-ify the whole dashboard — scope it to one hero
     visualization, not the entire UI.
   - Animate state transitions: a node pulsing red on detection, a connecting line
     animating as traffic reroutes, a green settle animation on verified recovery.
   - Keep it performant — judges are watching a video, not stress-testing your frame
     rate; don't let 3D chrome slow down the actual demo.
4. **Decision timeline / audit trail panel**, chronological, filterable, with the
   feature-importance breakdown (from Section 2.8) shown per decision — this turns
   "black box AI" into "explainable AI" visually.
5. **Confidence + abstention indicator**, always visible during a live prediction — show
   the number, the threshold line, and whether the system is in ABSTAIN state, not just
   a binary alert/no-alert.
6. **Micro-interactions and motion design:** subtle transition animations on state
   changes (health status changes, new decision receipts appearing, metric updates) —
   use restrained easing (200–400ms), not flashy or gratuitous. Consistent design
   tokens (spacing, color, type scale) throughout; avoid default/templated component
   styling — this is what separates a "built in a weekend" look from a "built with
   care" look, and judges notice both.
7. **Mobile/responsive pass** is not required for a backend-and-dashboard demo project,
   but the demo resolution (whatever you'll screen-record in) should be pixel-clean —
   no overflow, no clipped text, no unstyled fallback states visible.

---

## SECTION 5 — Repo Hygiene & Documentation

1. Move all status/progress churn files out of root into `/docs`:
   `BUILD_STATUS.md`, `NFV5_STATUS.md`, `NFV5_PROGRESS.md`, `final_version.md`,
   `GITHUB_DEPLOYMENT_READY.md`, `version5_fixing`, `commit-to-github.bat`, `start.bat`.
2. Root should contain only: `README.md`, `LICENSE`, `ARCHITECTURE.md`,
   `MODEL_CARD.md`, `CHANGELOG.md`.
3. Rename or delete the `SENSITIVE_FILES` folder — even if empty of actual secrets, the
   name alone reads as a red flag to a reviewer skimming the repo.
4. Rewrite `README.md` top-to-bottom in this order: problem statement → 30-second demo
   GIF/video link → architecture diagram → how to run locally → metrics/evidence →
   known limitations. Assume a judge gives it 2 minutes.
5. **Rebuild git history with real incremental commits** going forward — no more single
   giant "initial submission" commits. Suggested sequence:
   - `feat: add razorpay test-mode order creation`
   - `feat: payment failure webhook → root cause detection`
   - `fix: revenue calculation linked to real order value`
   - `feat: temporal features for ML pipeline`
   - `feat: baseline model comparison`
   - `feat: feature importance UI panel`
   - `feat: decision receipt export`
   - `fix: verification-failure replan path`
   - `docs: architecture + model card`
   This history *is* your evidence for the "what broke, how you fixed it" form question
   — write commit messages assuming a judge will actually read the log.

---

## SECTION 6 — Pitch Video & Submission Form

1. **5-minute video structure:**
   - 0:00–0:30 — Problem statement, stated in one sentence, no throat-clearing.
   - 0:30–2:30 — Live demo: trigger a real degradation/attack scenario end-to-end
     (detect → gate → act → verify), narrated plainly.
   - 2:30–3:30 — The one recorded real failure-recovery case (Section 3.2) — this is
     your strongest differentiator, don't cut it for time.
   - 3:30–4:30 — Architecture walkthrough, fast, diagram-led not slide-text-led.
   - 4:30–5:00 — Metrics: precision/recall/F1, real vs. synthetic eval gap, ₹ revenue
     protected, decision receipt example.
2. **Form answers:**
   - "What it solves" — use the Section 1 problem statement, not a feature list.
   - "What broke, and how you got out" — pull directly from the real git history
     (Section 5.5) and the recorded failure-recovery case (Section 3.2). Specific and
     verifiable beats well-written and vague.
3. Make the GitHub repo public before submitting and do a final read-through as if
   you've never seen it before — README should answer "what is this and does it work"
   without needing to open a second file.

---

## Execution priority if time is short

If only partial time is available, do these in order — this is the sequence with the
best signal-per-hour for judging criteria (Problem taste / Build quality / AI judgment
/ Failure recovery):

1. Section 1 (real Razorpay integration) — non-negotiable, do this first.
2. Section 2.1 + 2.3 + 2.8 (fix leakage, add baseline, expose feature importance) —
   highest-leverage ML credibility gains.
3. Section 3.1 + 3.2 (decision receipts + one real recorded failure-recovery case).
4. Section 5.5 (real commit history) — do this continuously as you work, not at the end.
5. Section 4.1 + 4.2 (hero metric + live topology view) — biggest visual impact for the
   pitch video for the least build time.
6. Everything else, time permitting.
PART 2
===============================================================
NFV5 — WINNING DIFFERENTIATION PACK
GOAL: TURN EXISTING DEPTH INTO A JUDGE-PROVABLE PRODUCT
===============================================================

IMPORTANT:

NFV5 already has substantial functionality.

DO NOT add features simply to increase the feature count.

The goal of this phase is:

PROVE
MEASURE
EXPLAIN
RECOVER
LEARN
COMPARE
AUDIT

The final product must feel like a coherent autonomous
resilience system, not a collection of disconnected hackathon
features.

===============================================================
SECTION A — THE "ONE INCIDENT, COMPLETE PROOF" SYSTEM
===============================================================

Create one canonical incident object that becomes the source for:

- Dashboard
- AI Insights
- Decision Receipt
- Reports
- AI vs Human
- Mission Mode
- Incident Replay

Every screen must reference the same incident ID.

Example:

NF-2026-0042

The incident must have:

TRIGGER
↓
EVIDENCE
↓
DETECTION
↓
INVESTIGATION
↓
RISK
↓
PREDICTION
↓
DECISION
↓
SAFETY
↓
EXECUTION
↓
VERIFICATION
↓
ADAPTATION
↓
RECOVERY
↓
IMPACT

A judge should be able to click one incident and reconstruct
the entire story.

===============================================================
SECTION B — BEFORE / AFTER PROOF
===============================================================

For every resolved incident generate a measurable BEFORE vs AFTER
comparison.

Example:

                    BEFORE       AFTER

Availability        81.4%        98.7%
Latency             312ms        74ms
Error Rate          18.2%        2.1%
Traffic              85 RPS       82 RPS
Node Health          41%          96%

Also calculate:

Recovery Time
Detection Time
Decision Time
Execution Time
Verification Time

DO NOT fabricate these numbers.

Calculate them from actual event timestamps.

Add:

"Recovery verified in 2.8 seconds"

when supported by real event data.

===============================================================
SECTION C — COUNTERFACTUAL / "WHAT IF WE DID NOTHING?"
===============================================================

Add a counterfactual impact estimator.

Purpose:

Show the difference between:

SYSTEM WITH NEURALFLOW

vs

SYSTEM WITHOUT NEURALFLOW

Example:

WITHOUT NEURALFLOW
Projected downtime: 42 sec
Projected failed requests: 3,280
Estimated transaction exposure: ₹18,450

WITH NEURALFLOW
Recovery time: 4.2 sec
Failed requests: 240
Estimated impact: ₹1,350

Estimated exposure avoided:
₹17,100

IMPORTANT:

Clearly label this as:

ESTIMATED / COUNTERFACTUAL

Never present projected avoided impact as actual money saved.

Explain the calculation methodology.

===============================================================
SECTION D — CONFIDENCE ≠ CERTAINTY
===============================================================

Strengthen the confidence system.

Every AI prediction should expose:

Risk Score
Confidence
Decision Threshold
Abstention Threshold
Evidence Strength

Example:

RISK              87/100
CONFIDENCE        91%
ABSTENTION        NO
EVIDENCE           STRONG

If confidence is below the configured threshold:

DO NOT AUTOMATICALLY ACT.

Instead:

ABSTAIN
↓
REQUEST HUMAN REVIEW

This creates a visible safety boundary around AI autonomy.

===============================================================
SECTION E — AI ABSTENTION / "KNOW WHEN NOT TO ACT"
===============================================================

Create a dedicated demo scenario where the AI intentionally
does NOT act.

Example:

Anomaly detected.

Risk = 63.

Confidence = 54%.

Required confidence = 75%.

Therefore:

AI DECISION:

ABSTAIN

Reason:

"Evidence insufficient for autonomous intervention."

Recommended action:

Human review.

This is extremely important.

Do not design the AI to always produce a confident answer.

A trustworthy autonomous system must know when to stop.

===============================================================
SECTION F — MULTI-HYPOTHESIS INVESTIGATION
===============================================================

Strengthen Investigator.

Instead of immediately deciding one cause:

generate candidate hypotheses.

Example:

INCIDENT:

Checkout latency spike.

Possible causes:

H1 — Traffic surge
H2 — Node degradation
H3 — Payment provider latency
H4 — Database bottleneck

Assign evidence scores.

Example:

H1: 0.71
H2: 0.89
H3: 0.32
H4: 0.21

Selected root-cause hypothesis:

H2 — Node degradation

Reason:

latency + error rate + node health evidence.

Do not fabricate causal certainty.

Label this:

"Most supported hypothesis"

rather than:

"Guaranteed root cause"

===============================================================
SECTION G — EVIDENCE GRAPH
===============================================================

Create a lightweight evidence graph for incidents.

Example:

LATENCY SPIKE
      ↓
ERROR RATE INCREASE
      ↓
NODE HEALTH DROP
      ↓
ANOMALY SCORE
      ↓
HIGH RISK
      ↓
REROUTE DECISION

Allow a judge to visually inspect:

Signal
→ Evidence
→ Inference
→ Decision

This should be more useful than a decorative neural-network
diagram.

===============================================================
SECTION H — ACTION SIMULATION / DRY RUN
===============================================================

Before executing an autonomous action, support:

DRY RUN

Example:

PROPOSED ACTION

ISOLATE N1
REROUTE → N3

Expected effect:

Latency ↓
Error rate ↓
Availability ↑

Safety checks:

✓ Target healthy
✓ Capacity available
✓ No routing loop
✓ Confidence above threshold

Then:

[ EXECUTE ]

This demonstrates bounded autonomy.

===============================================================
SECTION I — ACTION ROLLBACK / KILL SWITCH
===============================================================

Every autonomous action must have a rollback path where
technically possible.

Example:

REROUTE N1 → N3

[ ROLLBACK ]

Rollback should restore the previous routing state.

Record:

rollbackRequested
rollbackReason
rollbackTime
rollbackResult

Also provide:

EMERGENCY STOP

The kill switch must stop further autonomous actions.

This should be demonstrated once in the final testing/demo.

===============================================================
SECTION J — WHAT IF THE FIRST RECOVERY FAILS?
===============================================================

Create a first-class adaptive recovery demonstration.

Example:

Incident
↓
Reroute N1 → N2
↓
Verification FAILED
↓
Investigator analyzes new telemetry
↓
N2 rejected
↓
Strategy regenerated
↓
Safety Gate
↓
Reroute N1 → N3
↓
Verification PASSED
↓
RECOVERED

Display:

ATTEMPT 1 — FAILED
ATTEMPT 2 — SUCCESS

This should become one of the strongest parts of the product.

===============================================================
SECTION K — INCIDENT REPLAY
===============================================================

Implement deterministic incident replay.

A completed incident should be replayable from:

START

step-by-step:

Detection
Investigation
Risk
Decision
Safety
Execution
Verification
Recovery

Allow:

PLAY
PAUSE
STEP
REPLAY

The replay should use the stored event timeline rather than
randomly regenerating events.

This gives judges a reliable way to inspect the system.

===============================================================
SECTION L — CHAOS / FAILURE INJECTION
===============================================================

Create SAFE LOCAL CHAOS SCENARIOS.

Never perform real-world attacks.

Supported scenarios:

- latency degradation
- error burst
- node failure
- traffic spike
- target capacity reduction
- payment failure burst
- partial dependency failure
- verification failure
- backend disconnect

Each scenario must trigger the actual NeuralFlow pipeline.

Do not simply change frontend labels.

===============================================================
SECTION M — DEPENDENCY-AWARE RECOVERY
===============================================================

Extend the topology to represent dependencies.

Example:

BharatBazaar
    ↓
Checkout API
    ↓
Payment Service
    ↓
Razorpay Test API

and:

BharatBazaar
    ↓
Node 1
Node 2
Node 3

If a dependency becomes unhealthy, the system should distinguish:

APPLICATION FAILURE

from:

DEPENDENCY FAILURE

from:

NODE FAILURE

Do not blindly reroute traffic when the real dependency is the
problem.

===============================================================
SECTION N — PAYMENT-AWARE RISK
===============================================================

Because BharatBazaar uses Razorpay test-mode checkout, introduce
payment-specific telemetry where available.

Track:

payment attempts
successful payments
failed payments
payment latency
failure ratio
order amount
checkout availability

Derive:

payment failure rate
payment degradation signal
estimated transaction exposure

Feed these signals into risk assessment where appropriate.

Do not make Razorpay-specific claims that cannot be measured.

===============================================================
SECTION O — BUSINESS IMPACT + TECHNICAL IMPACT
===============================================================

Separate infrastructure metrics from business metrics.

TECHNICAL:

Latency
Error Rate
Availability
Node Health
Recovery Time

BUSINESS:

Payment Failures
Affected Orders
Transaction Exposure
Estimated Revenue Impact

Never mix these into one unexplained number.

===============================================================
SECTION P — MODEL DRIFT MONITORING
===============================================================

Since the environment can change, add:

MODEL DRIFT INDICATOR

Track whether current telemetry distributions differ from the
training/evaluation distribution.

Example:

Latency distribution:
BASELINE → CURRENT

Error distribution:
BASELINE → CURRENT

If significant drift is detected:

WARNING:

"Input distribution differs from evaluation baseline."

Do not automatically retrain unless a safe, implemented
retraining mechanism exists.

===============================================================
SECTION Q — ONLINE LEARNING WITH SAFETY
===============================================================

If the existing online retraining capability is retained:

DO NOT immediately replace the production model.

Use:

CURRENT MODEL
↓
COLLECT FEEDBACK
↓
CANDIDATE MODEL
↓
EVALUATION
↓
COMPARE
↓
APPROVE
↓
PROMOTE

Never silently replace the active model.

Show:

Current Model
Candidate Model
Performance Difference

===============================================================
SECTION R — MODEL VERSIONING
===============================================================

Every prediction should include:

modelVersion

Example:

NF-RISK-ML v5.2

When a model changes:

create a new version.

Decision receipts must preserve which model generated the
prediction.

This makes historical decisions reproducible.

===============================================================
SECTION S — DECISION QUALITY METRICS
===============================================================

Do not only measure model accuracy.

Track operational AI quality:

Detection Rate
False Positive Rate
False Negative Rate
Abstention Rate
Autonomous Resolution Rate
Human Escalation Rate
Verification Failure Rate
Rollback Rate
Average Recovery Time

This is more meaningful for an autonomous infrastructure system.

===============================================================
SECTION T — AI VS BASELINE VS HUMAN
===============================================================

Upgrade the comparison system.

Compare:

BASELINE
AI AUTONOMOUS
HUMAN

Metrics:

Detection Time
Decision Time
Recovery Time
Failed Requests
Successful Recovery
Human Intervention
Estimated Impact

Only show data for sessions that actually occurred.

If a session does not exist:

NOT RUN

not:

0

===============================================================
SECTION U — TRUST CENTER
===============================================================

Add a dedicated "Trust & Safety" view.

Show:

AI capabilities
AI limitations
Safety gates
Abstention policy
Human escalation policy
Data source
Model version
Evaluation status
Simulation status
External integration status

Example:

MODEL:

Synthetic training data
Real-world sanity check: AVAILABLE

AUTONOMY:

Bounded by safety policy

FAIL-SAFE:

Human escalation

This makes the system look mature instead of pretending to be
perfect.

===============================================================
SECTION V — LIVE SYSTEM HEALTH SCORE
===============================================================

Create one composite operational health score.

Example:

SYSTEM HEALTH

94 / 100

Break it down into:

Availability
Latency
Errors
Node health
Payment health

Do not let this score replace raw metrics.

The raw metrics must remain visible.

Explain how the score is calculated.

===============================================================
SECTION W — "WHY DIDN'T YOU ACT?"
===============================================================

Every non-action should be explainable.

Examples:

NO ACTION

Reason:
Risk below intervention threshold.

or:

ABSTAINED

Reason:
Confidence below autonomous-action threshold.

or:

BLOCKED

Reason:
Target node failed safety checks.

This is an important differentiator from simplistic AI demos.

===============================================================
SECTION X — INCIDENT REPORT GENERATION
===============================================================

Automatically generate a structured post-incident report.

Include:

Executive Summary

Incident Timeline

Detection

Evidence

Root-cause hypothesis

Risk Assessment

Decision

Safety Checks

Actions

Verification

Recovery

Before vs After

Impact

Model Version

Limitations

Recommended Follow-up

The report must be generated from actual incident data.

===============================================================
SECTION Y — RECOMMENDATIONS AFTER RECOVERY
===============================================================

After recovery, generate evidence-based recommendations.

Example:

"Node N1 repeatedly exceeded latency threshold."

Recommendation:

"Increase capacity or investigate dependency latency."

Recommendations must reference observed evidence.

Do not generate generic AI advice.

===============================================================
SECTION Z — DEMO MODE / PRODUCTION MODE SEPARATION
===============================================================

Clearly separate:

SAFE LOCAL DEMO

from:

EXTERNAL INTEGRATION

Do not make demo-generated telemetry appear to be production
telemetry.

Display environment:

SIMULATION
or
BHARATBAZAAR EXTERNAL

Every incident should identify its environment.

===============================================================
SECTION AA — JUDGE MODE
===============================================================

Create a dedicated:

JUDGE MODE

Purpose:

A reviewer should understand NeuralFlow within 30 seconds.

Display:

1. Current system health
2. Active incident
3. AI decision
4. Why
5. Safety status
6. Action
7. Verification
8. Before vs After
9. Business impact
10. Decision Receipt

Provide one:

[ RUN DEMO INCIDENT ]

button.

The demo must trigger the actual backend pipeline.

===============================================================
SECTION AB — ONE-CLICK GOLDEN DEMO
===============================================================

Create a deterministic "Golden Incident".

Example:

GOLDEN INCIDENT

BharatBazaar checkout degradation

Sequence:

1. Healthy baseline
2. Controlled latency/error degradation
3. Sentinel detects anomaly
4. Investigator gathers evidence
5. ML produces anomaly/risk
6. Multiple hypotheses evaluated
7. Risk becomes HIGH
8. Strategy proposes reroute
9. Safety gate approves
10. Action executes
11. Verification intentionally detects partial failure
12. Adaptor replans
13. Second target selected
14. Safety gate approves
15. Reroute executes
16. Verification succeeds
17. Recovery confirmed
18. Before/After metrics shown
19. Impact calculated
20. Decision Receipt generated
21. Incident stored for replay

This MUST be deterministic enough to reliably reproduce during
the pitch.

===============================================================
SECTION AC — OBSERVABILITY FOR THE BUILD
===============================================================

Add developer observability without exposing unnecessary
internal details to end users.

Track:

request latency
agent execution time
ML inference time
decision time
verification time
API failures
WebSocket state
incident processing time

This helps prove that the system itself is engineered carefully.

===============================================================
SECTION AD — RELIABILITY TEST MATRIX
===============================================================

Create automated tests for:

NORMAL

ANOMALY

HIGH RISK

LOW CONFIDENCE

ABSTENTION

SAFE ACTION

UNSAFE ACTION

EXECUTION FAILURE

VERIFICATION FAILURE

PARTIAL RECOVERY

ADAPTIVE RECOVERY

ROLLBACK

HUMAN ESCALATION

DUPLICATE ACTION

TARGET FAILURE

BACKEND DISCONNECT

PAYMENT FAILURE

BHARATBAZAAR FAILURE

Every test must verify backend state, not merely UI text.

===============================================================
SECTION AE — ANTI-FABRICATION RULE
===============================================================

This is mandatory.

The system must NEVER claim:

"Recovered"

unless verification actually passed.

It must NEVER claim:

"Revenue protected"

unless the calculation is supported by actual measured or clearly
labeled estimated data.

It must NEVER claim:

"AI decided"

when a deterministic rule made the final decision.

It must NEVER claim:

"Root cause"

when the system only has a hypothesis.

It must NEVER claim:

"Production validated"

when only synthetic evaluation exists.

Use honest labels:

OBSERVED
ESTIMATED
PREDICTED
HYPOTHESIS
SIMULATED
VERIFIED
NOT AVAILABLE

===============================================================
SECTION AF — FINAL HACKATHON "WOW" LAYER
===============================================================

The final experience should visually communicate:

OBSERVE
    ↓
UNDERSTAND
    ↓
DECIDE
    ↓
ACT
    ↓
VERIFY
    ↓
ADAPT

The judge should be able to SEE the system thinking through
evidence and state transitions.

Avoid:

fake neural-network animations
fake AI typing
random numbers
decorative charts
unexplained percentages

Prefer:

real telemetry
real timestamps
real decisions
real state changes
real verification
real failure recovery
real evidence

===============================================================
FINAL ACCEPTANCE TEST
===============================================================

The project is NOT complete until the following single scenario
works from beginning to end:

BharatBazaar starts healthy.

↓

A controlled degradation is introduced.

↓

Telemetry changes.

↓

ML detects anomaly.

↓

Investigator gathers evidence.

↓

Multiple hypotheses are evaluated.

↓

Risk is calculated.

↓

Confidence is evaluated.

↓

Decision is generated.

↓

Safety gate evaluates the action.

↓

Dry-run shows expected action.

↓

Action executes.

↓

Verification begins.

↓

First recovery attempt intentionally fails.

↓

System recognizes verification failure.

↓

Adaptor replans.

↓

Second action is selected.

↓

Safety gate approves.

↓

Action executes.

↓

Verification passes.

↓

Recovery confirmed.

↓

Before vs After metrics are calculated.

↓

Business impact is calculated.

↓

Decision Receipt is generated.

↓

Incident is stored.

↓

Incident can be replayed.

↓

Reports update.

↓

AI-vs-Human metrics update only if actual sessions exist.

↓

Judge Mode can replay the complete story.

===============================================================
FINAL PRODUCT STANDARD
===============================================================

DO NOT TRY TO MAKE NEURALFLOW LOOK LIKE IT HAS MORE FEATURES.

MAKE IT LOOK LIKE IT HAS MORE INTELLIGENCE.

The winning experience should be:

REAL SIGNAL
↓
REAL EVIDENCE
↓
REAL AI
↓
REAL DECISION
↓
REAL SAFETY
↓
REAL ACTION
↓
REAL FAILURE
↓
REAL ADAPTATION
↓
REAL VERIFICATION
↓
REAL PROOF

The final NeuralFlow should make the judge think:

"I can see exactly what happened,
why the system acted,
what prevented unsafe action,
what happened when the first action failed,
and how the system proved recovery."

That is the core differentiator.

===============================================================
END OF NFV5 WINNING DIFFERENTIATION PACK
===============================================================