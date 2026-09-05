# 🚀 NFV5 — Autonomous AI Infrastructure Resilience Platform

> **Predict. Decide. Safely Act. Verify. Replan.**

NFV5 is an AI-powered infrastructure resilience platform designed to detect abnormal infrastructure behavior, predict potential SLA breaches, make controlled recovery decisions, autonomously reroute traffic, verify whether recovery actually succeeded, and adapt when the first recovery strategy is unsuccessful.

The project combines **predictive machine learning, deterministic safety controls, autonomous decision-making, independent verification, adaptive recovery, and immutable audit receipts** into a controlled infrastructure recovery loop.

---

## 🌐 System Overview

Modern monitoring systems are primarily designed to **observe infrastructure and alert human operators**.

NFV5 takes the next step by introducing a controlled autonomous recovery cycle:

```text
┌─────────────────────────────────────────────────────────────┐
│                    NFV5 AUTONOMOUS LOOP                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   Monitor → Predict → Decide → Safely Act → Verify         │
│                                      │                      │
│                                      ▼                      │
│                                  Recovery?                 │
│                                  /       \                  │
│                                YES       NO                 │
│                                 │         │                │
│                                 ▼         ▼                │
│                              Resolve   Replan               │
│                                         │                   │
│                                         └──→ Decide         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Core Philosophy

**Detection alone is not enough.**

NFV5 is built around the principle:

> **An autonomous action should never be considered successful until the system independently verifies the outcome.**

---

# 🚀 Projects

This monorepo contains two connected but independently runnable applications:

1. **NeuralFlow** — AI infrastructure resilience and autonomous recovery platform
2. **BharatBazaar** — Multi-node e-commerce application used as a realistic external infrastructure environment

---

# 🧠 1. NeuralFlow

## Autonomous AI Infrastructure Resilience Platform

NeuralFlow is the core intelligence and control platform of NFV5.

It continuously evaluates infrastructure health, detects anomalies, predicts potential SLA breaches, evaluates recovery options, applies deterministic safety gates, executes controlled recovery actions, and independently verifies the result.

### 🔥 Key Features

* 🔮 **Predictive SLA Breach Detection**
* 🧠 **ML-Based Anomaly Evaluation**
* 🤖 **Controlled Autonomous Recovery**
* 🛡️ **8 Deterministic Safety Gates**
* 🔄 **Adaptive Replanning**
* ✅ **Independent 3-Point Recovery Verification**
* 📜 **Immutable Decision Receipts**
* 📊 **Real-Time Infrastructure Monitoring**
* 🌐 **Multi-Node External Application Monitoring**
* ⚡ **Sub-Second Decision Pipeline**
* 🚨 **Incident State Management**
* 🔍 **Explainable Decision Context**
* 🧾 **Audit-Ready Recovery Records**

---

## 🔮 Predictive Intelligence

Instead of waiting for an infrastructure failure to happen, NeuralFlow evaluates infrastructure signals and identifies abnormal behavior that could lead to an SLA breach.

The system can evaluate signals such as:

```text
Latency
Error Rate
Traffic
CPU / Resource Pressure
Node Health
Request Failures
Historical Behavior
Anomaly Score
```

The goal is to move from:

```text
Failure → Alert → Human Response
```

to:

```text
Anomaly → Prediction → Controlled Recovery → Verification
```

---

# 🛡️ Safety-First Autonomous AI

Autonomous infrastructure actions can be dangerous if an AI system is allowed to act without constraints.

NeuralFlow therefore separates:

```text
AI Decision
     ↓
Deterministic Safety Validation
     ↓
Approved Action
     ↓
Execution
```

The AI does **not** receive unrestricted authority.

Recovery actions must pass deterministic safety gates before execution.

### Safety Gates

The platform includes **8 deterministic safety gates** designed to prevent unsafe or unjustified autonomous actions.

Conceptually:

```text
                    AI Decision
                         │
                         ▼
              ┌────────────────────┐
              │   Safety Gate 1    │
              ├────────────────────┤
              │   Safety Gate 2    │
              ├────────────────────┤
              │   Safety Gate 3    │
              ├────────────────────┤
              │   Safety Gate 4    │
              ├────────────────────┤
              │   Safety Gate 5    │
              ├────────────────────┤
              │   Safety Gate 6    │
              ├────────────────────┤
              │   Safety Gate 7    │
              ├────────────────────┤
              │   Safety Gate 8    │
              └────────────────────┘
                         │
                  ┌──────┴──────┐
                  │             │
                PASS           FAIL
                  │             │
                  ▼             ▼
               Execute         Block
```

This architecture makes autonomous recovery **safety-controlled rather than blindly autonomous**.

---

# ✅ Independent Recovery Verification

A major principle of NeuralFlow is:

> **Executing an action does not mean recovery succeeded.**

After a recovery action is performed, NeuralFlow independently evaluates the affected infrastructure again.

The verification pipeline evaluates multiple recovery signals.

```text
Recovery Action
      │
      ▼
Verification #1
      │
      ▼
Verification #2
      │
      ▼
Verification #3
      │
      ▼
 ┌───────────────┐
 │ Recovery OK?  │
 └───────┬───────┘
         │
     ┌───┴───┐
    YES      NO
     │        │
     ▼        ▼
 Resolve    Replan
 Incident    Recovery
```

This prevents the system from incorrectly reporting a recovery merely because the action itself completed successfully.

---

# 🔄 Adaptive Replanning

Infrastructure conditions can change during recovery.

If the initially selected recovery target is unavailable, unhealthy, overloaded, or fails verification, NeuralFlow can evaluate alternative targets.

Example:

```text
Primary Target
     │
     ▼
Safety Validation
     │
     ▼
Execute
     │
     ▼
Verification
     │
   FAILED
     │
     ▼
Alternative Target
     │
     ▼
Safety Validation
     │
     ▼
Execute
     │
     ▼
Verify
```

This creates a resilient recovery strategy instead of relying on a single static failover destination.

---

# 📜 Immutable Decision Receipts

Every important autonomous decision can produce an auditable decision receipt.

A receipt can capture information such as:

```text
Incident
Timestamp
Observed Signals
Prediction
Decision
Selected Target
Safety Gate Results
Action
Verification Results
Final Outcome
Replanning Attempts
```

This provides traceability for autonomous infrastructure actions.

Instead of:

```text
"AI fixed the issue."
```

the system can provide:

```text
What happened?
Why did it act?
What safety checks passed?
What action was executed?
Did recovery actually succeed?
Was replanning required?
```

---

# 🌐 2. BharatBazaar

## Multi-Node E-Commerce Platform

BharatBazaar is a full-stack Indian e-commerce application used as the realistic external application environment for NeuralFlow.

It runs as multiple independent Node.js instances representing geographically distributed infrastructure nodes.

### 🌍 Infrastructure Nodes

```text
                 BharatBazaar
                      │
          ┌───────────┼───────────┐
          │           │           │
          ▼           ▼           ▼
       Mumbai       Delhi      Bangalore
       Node 1       Node 2       Node 3
       :5001        :5002        :5003
```

This architecture allows NeuralFlow to demonstrate monitoring, failure detection, traffic rerouting, and recovery verification against a real application environment.

---

## 🛒 BharatBazaar Features

* 🛍️ Product catalog
* 🛒 Shopping cart
* 📦 Orders
* 👤 User functionality
* 🌐 Multi-node architecture
* 📊 Health monitoring endpoints
* ⚡ Real-time infrastructure signals
* 🔗 NeuralFlow integration
* 💳 Razorpay payment integration
* 🗄️ MongoDB backend
* 🔄 Independent Node.js instances

---

# 💡 Why NeuralFlow?

Traditional monitoring platforms generally focus on:

```text
Observe → Detect → Alert
```

NeuralFlow extends the workflow:

```text
Observe
   ↓
Predict
   ↓
Decide
   ↓
Safety Check
   ↓
Act
   ↓
Verify
   ↓
Replan if necessary
```

This creates a controlled autonomous infrastructure recovery system.

---

# 🔥 NeuralFlow vs Traditional Monitoring

| Capability            | Traditional Monitoring | NeuralFlow           |
| ---------------------- | ---------------------- | -------------------- |
| Problem Detection      | ✅                      | ✅                    |
| Predictive Detection   | Limited                 | ✅                    |
| Alerts                 | ✅                      | ✅                    |
| Autonomous Recovery    | ❌                      | ✅                    |
| Safety Controls        | Limited                 | ✅                    |
| Recovery Verification  | Often indirect          | ✅ Independent        |
| Adaptive Replanning    | ❌                      | ✅                    |
| Multi-Node Recovery    | Limited                 | ✅                    |
| Decision Audit Trail   | Basic Logs               | 📜 Decision Receipts |
| Controlled AI Actions  | ❌                      | 🛡️                  |

---

# 🧩 Architecture

```text
                         ┌─────────────────────┐
                         │   NeuralFlow UI     │
                         │   React Dashboard   │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │  NeuralFlow Backend │
                         │     Control Plane   │
                         └──────────┬──────────┘
                                    │
              ┌─────────────────────┼─────────────────────┐
              │                     │                     │
              ▼                     ▼                     ▼
       ML / Anomaly          Safety Engine         Incident Engine
        Evaluation          8 Safety Gates         State Machine
              │                     │                     │
              └─────────────────────┼─────────────────────┘
                                    │
                                    ▼
                           Decision / Recovery
                                    │
                                    ▼
                           Verification Engine
                                    │
                          ┌─────────┴─────────┐
                          │                   │
                       SUCCESS              FAILED
                          │                   │
                          ▼                   ▼
                       Resolve              Replan
                                              │
                                              ▼
                                       Alternative Target
```

---

# 🔗 External Mode — BharatBazaar Integration

NeuralFlow can operate against BharatBazaar as an external application environment.

### Integration Flow

```text
BharatBazaar Nodes
       │
       │ Health / Metrics
       ▼
NeuralFlow Monitor
       │
       ▼
Anomaly Detection
       │
       ▼
SLA Prediction
       │
       ▼
Recovery Decision
       │
       ▼
Safety Gates
       │
       ▼
Traffic Rerouting
       │
       ▼
Independent Verification
       │
       ├───────────────┐
       │               │
    SUCCESS          FAILURE
       │               │
       ▼               ▼
    Resolve          Replan
                       │
                       ▼
                Alternative Node
```

---

# 🏗️ Repository Structure

```text
NFV5/
│
├── BharatBazaar/
│   │
│   ├── backend/
│   │   └── Express API server
│   │
│   ├── frontend/
│   │   └── HTML/CSS/JS storefront
│   │
│   ├── scripts/
│   │   └── Startup and database seeding scripts
│   │
│   ├── package.json
│   └── README.md
│
├── NeuralFlow/
│   │
│   ├── backend/
│   │   └── Control plane and API
│   │
│   ├── frontend/
│   │   └── React monitoring dashboard
│   │
│   ├── config-templates/
│   │   └── Configuration examples
│   │
│   ├── logs/
│   │   └── Runtime logs and decision receipts
│   │
│   ├── Dockerfile
│   ├── docker-compose.yml
│   └── README.md
│
├── .github/
│   └── GitHub Actions workflows
│
├── .gitignore
├── LICENSE
└── README.md
```

---

# ⚙️ Tech Stack

## NeuralFlow

| Technology | Purpose                     |
| ---------- | ---------------------------- |
| Node.js    | Backend runtime              |
| Express    | API layer                    |
| React      | Dashboard                    |
| Brain.js   | ML / anomaly evaluation      |
| Socket.IO  | Real-time communication      |
| WebSockets | Live infrastructure updates  |
| JavaScript | Application logic            |
| Docker     | Containerization             |

## BharatBazaar

| Technology | Purpose                 |
| ---------- | ------------------------ |
| Node.js    | Backend runtime          |
| Express    | REST API                 |
| MongoDB    | Database                 |
| Socket.IO  | Real-time communication  |
| HTML       | Storefront structure     |
| CSS        | Storefront styling       |
| JavaScript | Frontend logic           |
| Razorpay   | Payment integration      |

---

# 🚦 Quick Start

## Prerequisites

Install the following:

* Node.js >= 18.0.0
* npm >= 8.0.0
* MongoDB >= 6.0

---

# 🧠 Running NeuralFlow

### Terminal 1 — Backend

```bash
cd NeuralFlow/backend
npm install
npm run dev
```

### Terminal 2 — Frontend

```bash
cd NeuralFlow/frontend
npm install
npm run dev
```

Open:

```text
http://localhost:5173
```

---

# 🛒 Running BharatBazaar

### Install dependencies

```bash
cd BharatBazaar
npm install
```

### Configure environment

Windows:

```bash
copy .env.example .env
```

macOS / Linux:

```bash
cp .env.example .env
```

Configure the required environment variables before starting the application.

### Start all nodes

```bash
npm start
```

---

# 🌍 BharatBazaar Node URLs

| Node      | Location  | Port   |
| --------- | --------- | ------ |
| BB-NODE-1 | Mumbai    | `5001` |
| BB-NODE-2 | Delhi     | `5002` |
| BB-NODE-3 | Bangalore | `5003` |

```text
Mumbai     → http://localhost:5001
Delhi      → http://localhost:5002
Bangalore  → http://localhost:5003
```

---

# 🔗 Running the Complete Demonstration

For the full NeuralFlow + BharatBazaar demonstration:

### Step 1

Start BharatBazaar.

```bash
cd BharatBazaar
npm start
```

### Step 2

Verify all three nodes are running.

```text
BB-NODE-1 → Mumbai
BB-NODE-2 → Delhi
BB-NODE-3 → Bangalore
```

### Step 3

Start NeuralFlow backend.

```bash
cd NeuralFlow/backend
npm run dev
```

### Step 4

Start NeuralFlow frontend.

```bash
cd NeuralFlow/frontend
npm run dev
```

### Step 5

Open the NeuralFlow dashboard.

```text
http://localhost:5173
```

### Step 6

Switch NeuralFlow to:

```text
EXTERNAL MODE
```

### Step 7

NeuralFlow begins monitoring:

```text
BB-NODE-1
BB-NODE-2
BB-NODE-3
```

### Step 8

Simulate an infrastructure incident and observe:

```text
Detection
   ↓
Prediction
   ↓
Decision
   ↓
Safety Validation
   ↓
Recovery Action
   ↓
Independent Verification
   ↓
Resolution / Replanning
```

---

# 🧪 Testing

## NeuralFlow Tests

```bash
cd NeuralFlow/backend
npm test
```

Testing areas include:

* ML anomaly detection
* Safety gates
* Incident state machine
* Recovery engine
* Verification engine
* Decision receipts
* Recovery workflows

---

## BharatBazaar Tests

```bash
cd BharatBazaar
npm test
```

---

# 🐳 Docker Support

## NeuralFlow

```bash
cd NeuralFlow
docker-compose up -d
```

---

## Full Stack

Start NeuralFlow:

```bash
cd NeuralFlow
docker-compose up -d
```

Then start BharatBazaar separately:

```bash
cd ../BharatBazaar
npm start
```

---

# 🔐 Security & Reliability Philosophy

NFV5 is designed around controlled autonomy.

The architecture intentionally avoids treating AI predictions as unrestricted commands.

Instead:

```text
                 AI / ML
                    │
                    ▼
              Recommendation
                    │
                    ▼
        Deterministic Safety Layer
                    │
             ┌──────┴──────┐
             │             │
           PASS           FAIL
             │             │
             ▼             ▼
          Execute        Reject
             │
             ▼
         Verify
             │
       ┌─────┴─────┐
       │           │
    Success      Failure
       │           │
       ▼           ▼
    Resolve      Replan
```

This separation between **prediction, decision, safety, execution, and verification** is a central design principle of NeuralFlow.

---

# 📊 Example Autonomous Recovery Scenario

Consider three application nodes:

```text
Mumbai     → Healthy
Delhi      → Degrading
Bangalore  → Healthy
```

Traffic is currently routed through Delhi.

NeuralFlow observes:

```text
Latency ↑
Error Rate ↑
Anomaly Score ↑
```

The prediction engine determines that the current behavior may result in an SLA breach.

The system then:

```text
1. Detects abnormal behavior
2. Predicts potential SLA breach
3. Evaluates available recovery targets
4. Selects a candidate target
5. Runs deterministic safety gates
6. Executes controlled rerouting
7. Independently verifies recovery
8. Records the decision receipt
```

If verification fails:

```text
Verification Failed
        ↓
Replanning
        ↓
Evaluate Alternative Target
        ↓
Safety Validation
        ↓
Execute
        ↓
Verify Again
```

This demonstrates the difference between **simple monitoring** and **autonomous resilience**.

---

# 🏆 Built For

## Razorpay AI Buildathon 2026

**Track:** Open Track — Build what you believe should exist.

NFV5 demonstrates an approach to autonomous infrastructure resilience combining:

* 🔮 Predictive ML
* 🤖 Controlled autonomous decisions
* 🛡️ Deterministic safety guardrails
* 🔄 Adaptive recovery
* ✅ Independent verification
* 📜 Audit-ready decision receipts
* 🌐 Real-world multi-node application demonstration

---

# 💳 Razorpay Integration

BharatBazaar includes Razorpay payment integration as part of its e-commerce environment.

This allows the external application environment to represent a more realistic production-style application rather than a simple synthetic monitoring target.

> **Important:** Use test-mode credentials for local development and demonstrations. Never commit API secrets or private keys to GitHub.

Recommended environment configuration:

```text
.env
.env.local
```

These files should remain excluded through `.gitignore`.

---

# 📚 Documentation

Detailed documentation is available inside each project:

### NeuralFlow

[NeuralFlow Documentation](./NeuralFlow/README.md)

Includes:

* Architecture
* Backend structure
* API information
* ML model details
* Safety gates
* Recovery workflow
* Verification engine
* Decision receipts
* Configuration

### BharatBazaar

[BharatBazaar Documentation](./BharatBazaar/README.md)

Includes:

* Installation
* Application architecture
* API endpoints
* Database configuration
* Multi-node setup
* Razorpay integration
* NeuralFlow integration

---

# 📈 Core Recovery Loop

The complete NFV5 philosophy can be summarized as:

```text
┌───────────┐
│  MONITOR  │
└─────┬─────┘
      ↓
┌───────────┐
│  PREDICT  │
└─────┬─────┘
      ↓
┌───────────┐
│   DECIDE  │
└─────┬─────┘
      ↓
┌───────────┐
│   SAFETY  │
└─────┬─────┘
      ↓
┌───────────┐
│    ACT    │
└─────┬─────┘
      ↓
┌───────────┐
│  VERIFY   │
└─────┬─────┘
      ↓
   SUCCESS?
    /    \
  YES     NO
  ↓        ↓
DONE     REPLAN
           │
           └──────→ DECIDE
```

---

# 🎯 Design Principles

NFV5 follows several core principles:

### 1. Predict Before Failure

Identify abnormal behavior before it becomes a major outage.

### 2. Never Trust AI Alone

AI recommendations must operate within deterministic constraints.

### 3. Verify Every Recovery

An action is not considered successful until its outcome is independently verified.

### 4. Adapt When Reality Changes

If the original recovery plan fails, evaluate alternatives.

### 5. Record What Happened

Autonomous actions should be traceable and auditable.

### 6. Demonstrate Against a Real Application

BharatBazaar provides a realistic distributed application environment for demonstrating resilience.

---

# 🌟 Why NFV5 Is Different

NFV5 is not designed as another dashboard that simply displays infrastructure metrics.

It is designed around an autonomous control loop:

```text
                    NFV5
                     │
       ┌─────────────┴─────────────┐
       │                           │
   Intelligence                 Control
       │                           │
       ▼                           ▼
 Prediction                  Safety Gates
 Anomaly ML                  Decision Engine
 Risk Evaluation             Recovery Engine
       │                           │
       └─────────────┬─────────────┘
                     │
                     ▼
                 Execution
                     │
                     ▼
                Verification
                     │
                     ▼
                  Replan
```

> **NeuralFlow is not just an observability dashboard — it is a safety-controlled autonomous infrastructure recovery system.**

---

# 📝 License

This project is licensed under the MIT License.

See:

[LICENSE](./LICENSE)

---

# 🔗 Repository Links

* 📊 [NeuralFlow](./NeuralFlow)
* 🛒 [BharatBazaar](./BharatBazaar)
* 🐛 [Report Issues](https://github.com/aditya-upmanyu/Neural-Flow/issues)
* 💬 [GitHub Discussions](https://github.com/aditya-upmanyu/Neural-Flow/discussions)

---

# 📧 Contact

For questions, suggestions, collaboration, or technical discussions, use GitHub Issues or Discussions.

---

<div align="center">

## 🚀 NFV5

**Predict. Decide. Safely Act. Verify. Replan.**

Built for **Razorpay AI Buildathon 2026 — Open Track**

⭐ **Star the repository if you find the project interesting!**

</div>
