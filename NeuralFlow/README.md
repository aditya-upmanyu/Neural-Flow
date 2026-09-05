# ⚡ NeuralFlow V5

### Autonomous AI Infrastructure Resilience & Self-Healing Platform

[![Build Status](https://img.shields.io/badge/build-passing-00e87a?style=flat-square)](https://github.com/aditya-upmanyu/Neural_Flow)
[![Tests](https://img.shields.io/badge/tests-7%2F7%20passed-00d4ff?style=flat-square)](https://github.com/aditya-upmanyu/Neural_Flow)
[![AI Engine](https://img.shields.io/badge/ML%20Engine-Brain.js%20(88--92%25%20Accuracy)-7c5cfc?style=flat-square)](https://github.com/aditya-upmanyu/Neural_Flow)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-f5a623?style=flat-square)](https://nodejs.org)

---

## Overview

NeuralFlow V5 is an autonomous AI-powered infrastructure resilience platform that combines predictive machine learning, deterministic safety guardrails, and sub-second traffic orchestration to anticipate SLA violations, autonomously divert compromised traffic, verify real recovery, and maintain zero downtime.

**Key Capabilities:**
- 🔮 Predicts SLA breaches 8-25 seconds before they occur
- 🛡️ 8 deterministic safety gates ensure safe autonomous actions
- ✅ Independent 3-point verification confirms actual recovery
- 🔄 Adaptive replanning with alternative targets
- 📜 Immutable decision receipts for audit compliance

---

## Quick Start

### Prerequisites
- Node.js >= 18.0.0
- npm >= 8.0.0

### Installation

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Running NeuralFlow

```bash
# Terminal 1: Start Backend (Control Plane)
cd backend
npm run dev

# Terminal 2: Start Frontend (Dashboard)
cd frontend
npm run dev
```

**Access Points:**
- 🖥️ Dashboard: http://localhost:5173
- 🔌 API: http://localhost:3001
- 📊 Health: http://localhost:3001/api/health

---

## Architecture

NeuralFlow uses a 10-component control plane:

```
Telemetry → Sentinel → Investigator → Correlator → RiskEngine 
→ ML (Brain.js) → Planner → PolicyEngine → Safety Gates 
→ ActionExecutor → Verifier
```

**Safety-First Design:**
- ML provides risk signals
- Deterministic policies evaluate
- 8 safety gates control execution
- Independent verification confirms recovery

---

## Project Structure

```
NeuralFlow/
├── backend/               # Control plane & API server
│   ├── src/
│   │   ├── controlPlane/  # 10 control components
│   │   ├── core/          # FSM, events, contracts
│   │   ├── middleware/    # Express middleware
│   │   └── utils/         # Logger, validation
│   └── tests/             # Unit & integration tests
├── frontend/              # React dashboard
│   ├── src/
│   │   ├── components/    # UI components
│   │   ├── hooks/         # WebSocket, state
│   │   └── store/         # Zustand store
├── config-templates/      # Configuration examples
├── logs/                  # Runtime logs & receipts
├── Dockerfile             # Container image
├── docker-compose.yml     # Multi-container setup
└── render.yaml            # Render deployment
```

---

## Configuration

### Environment Variables

Create `.env` file in backend directory:

```bash
# Server Configuration
PORT=3001
NODE_ENV=development

# External Node URLs (for BharatBazaar integration)
EXTERNAL_NODE_1_URL=http://localhost:5001
EXTERNAL_NODE_2_URL=http://localhost:5002
EXTERNAL_NODE_3_URL=http://localhost:5003

# Safety Gate Configuration
MIN_AUTONOMOUS_CONFIDENCE=0.80
MAX_TARGET_CPU=80
MIN_TARGET_HEALTH=65
COOLDOWN_MS=15000
```

---

## Testing

```bash
# Run all tests
npm test

# Run specific test suite
npm test -- backend/tests/unit/safetyGate.test.js

# Run with coverage
npm run test:coverage
```

**Test Coverage:**
- ✅ ML Anomaly Detection
- ✅ Safety Gates (8 checks)
- ✅ Incident State Machine
- ✅ Verification Engine
- ✅ Decision Receipts

---

## API Endpoints

### System Health
```http
GET /api/health
```

### Node Management
```http
GET /api/nodes              # List all monitored nodes
GET /api/nodes/:id/details  # Node details
GET /api/state              # System state snapshot
```

### Incident Management
```http
POST /api/attack/start      # Simulate incident
POST /api/attack/stop       # Stop simulation
POST /api/mode              # Switch AI/MANUAL mode
POST /api/environment       # Switch INTERNAL/EXTERNAL
```

### Decision Receipts
```http
GET /api/receipts           # All receipts
GET /api/receipts/latest    # Most recent
GET /api/receipts/:id       # Specific receipt
```

---

## Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f neuralflow

# Stop services
docker-compose down
```

---

## Integration with BharatBazaar

NeuralFlow can monitor the BharatBazaar e-commerce platform:

1. Start BharatBazaar (see ../BharatBazaar/README.md)
2. Switch NeuralFlow to EXTERNAL mode:
   ```bash
   curl -X POST http://localhost:3001/api/environment \
     -H "Content-Type: application/json" \
     -d '{"environment": "EXTERNAL"}'
   ```
3. NeuralFlow now monitors BB-NODE-1, BB-NODE-2, BB-NODE-3

---

## ML Model Details

**Architecture:** Feedforward Neural Network (Brain.js)
- Hidden Layers: [12, 8, 6]
- Activation: Leaky ReLU
- Training: 500 samples (70/15/15 split)
- Accuracy: 88-92% on held-out test set

**Features:** Latency, Error Rate, CPU, Memory, RPS, Trends

**Safety:** Confidence threshold 0.80 for autonomous actions

---

## Troubleshooting

### Backend won't start
- Check if port 3001 is available
- Verify Node.js version >= 18.0.0
- Run `npm install` in backend directory

### Frontend can't connect to backend
- Ensure backend is running on port 3001
- Check CORS configuration
- Verify WebSocket connection

### Tests failing
- Clean install: `rm -rf node_modules && npm install`
- Check Node.js version
- Ensure no conflicting processes

---

## License

MIT License - see [LICENSE](../LICENSE) file

---

## Links

- 📚 [Main Repository README](../README.md)
- 🛒 [BharatBazaar Integration](../BharatBazaar/README.md)
- 🐛 [Report Issues](https://github.com/aditya-upmanyu/Neural_Flow/issues)
- 💬 [Discussions](https://github.com/aditya-upmanyu/Neural_Flow/discussions)
