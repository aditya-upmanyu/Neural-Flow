# NFV5 Monorepo

This repository contains two independent AI-powered projects:

## 🚀 Projects

### 1. [NeuralFlow](./NeuralFlow) - Autonomous AI Infrastructure Resilience Platform

An AI-powered infrastructure resilience platform that predicts SLA breaches, autonomously reroutes traffic, and verifies recovery with sub-second response times.

**Key Features:**
- 🔮 Predicts SLA breaches 8-25 seconds before they occur
- 🛡️ 8 deterministic safety gates for safe autonomous actions
- ✅ Independent 3-point verification confirms recovery
- 🔄 Adaptive replanning with alternative targets
- 📜 Immutable decision receipts for audit compliance

**Tech Stack:** Node.js, React, Brain.js, Express, Socket.IO, WebSockets

👉 [View NeuralFlow Documentation](./NeuralFlow/README.md)

---

### 2. [BharatBazaar](./BharatBazaar) - Multi-Node E-Commerce Platform

A full-stack Indian e-commerce platform running as three independent Node.js instances, used as a realistic external application environment for NeuralFlow demonstrations.

**Key Features:**
- 🛒 Complete e-commerce functionality (products, cart, orders)
- 🌐 Multi-node architecture (Mumbai, Delhi, Bangalore)
- 📊 Real-time health metrics and monitoring endpoints
- 🔗 Seamless integration with NeuralFlow
- 💳 Razorpay payment integration

**Tech Stack:** Node.js, Express, MongoDB, Socket.IO, HTML/CSS/JS

👉 [View BharatBazaar Documentation](./BharatBazaar/README.md)

---

## 🏗️ Repository Structure

```
NFV5/
├── BharatBazaar/              # Multi-node e-commerce platform
│   ├── backend/               # Express API server
│   ├── frontend/              # HTML/CSS/JS storefront
│   ├── scripts/               # Startup & seeding scripts
│   ├── package.json
│   └── README.md
│
├── NeuralFlow/                # AI infrastructure resilience
│   ├── backend/               # Control plane & API
│   ├── frontend/              # React dashboard
│   ├── config-templates/      # Configuration examples
│   ├── logs/                  # Runtime logs & receipts
│   ├── Dockerfile
│   ├── docker-compose.yml
│   └── README.md
│
├── .github/                   # GitHub Actions workflows
├── .gitignore
├── LICENSE
└── README.md                  # This file
```

---

## 🚦 Quick Start

### Prerequisites

- Node.js >= 18.0.0
- npm >= 8.0.0
- MongoDB >= 6.0 (for BharatBazaar)

### Running NeuralFlow

```bash
# Terminal 1: Backend
cd NeuralFlow/backend
npm install
npm run dev

# Terminal 2: Frontend
cd NeuralFlow/frontend
npm install
npm run dev
```

**Access:** http://localhost:5173

### Running BharatBazaar

```bash
# Install dependencies
cd BharatBazaar
npm install

# Copy environment config
copy .env.example .env    # Windows
cp .env.example .env      # macOS/Linux

# Start all 3 nodes
npm start
```

**Access:** 
- Node 1 (Mumbai): http://localhost:5001
- Node 2 (Delhi): http://localhost:5002
- Node 3 (Bangalore): http://localhost:5003

---

## 🔗 Integration

NeuralFlow can monitor BharatBazaar in EXTERNAL mode:

1. Start BharatBazaar (3 nodes running)
2. Start NeuralFlow
3. In NeuralFlow dashboard, click **Switch to EXTERNAL**
4. NeuralFlow now monitors BB-NODE-1, BB-NODE-2, BB-NODE-3
5. Simulate incidents and watch autonomous recovery

---

## 📚 Documentation

Each project has comprehensive documentation in its respective README:

- **[NeuralFlow Documentation](./NeuralFlow/README.md)** - Architecture, API reference, ML model details, safety gates
- **[BharatBazaar Documentation](./BharatBazaar/README.md)** - Setup, API endpoints, NeuralFlow integration

---

## 🧪 Testing

### NeuralFlow Tests
```bash
cd NeuralFlow/backend
npm test
```

Test coverage includes:
- ML Anomaly Detection
- 8 Safety Gates
- Incident State Machine
- Verification Engine
- Decision Receipts

### BharatBazaar Tests
```bash
cd BharatBazaar
npm test
```

---

## 🐳 Docker Support

### NeuralFlow with Docker
```bash
cd NeuralFlow
docker-compose up -d
```

### Full Stack (Both Projects)
```bash
# Start NeuralFlow
cd NeuralFlow
docker-compose up -d

# Start BharatBazaar (in separate terminal)
cd ../BharatBazaar
npm start
```

---

## 🏆 Built For

**Razorpay AI Buildathon 2026 | Open Track**

NeuralFlow V5 demonstrates autonomous AI infrastructure resilience with:
- Predictive ML breach detection
- Deterministic safety guardrails
- Independent recovery verification
- Adaptive replanning
- Full audit trails

---

## 📝 License

MIT License - see [LICENSE](./LICENSE) file

---

## 🔗 Links

- 📊 [NeuralFlow Project](./NeuralFlow)
- 🛒 [BharatBazaar Project](./BharatBazaar)
- 🐛 [Report Issues](https://github.com/aditya-upmanyu/Neural_Flow/issues)
- 💬 [Discussions](https://github.com/aditya-upmanyu/Neural_Flow/discussions)

---

## 📧 Contact

For questions or collaboration, reach out through GitHub issues or discussions.

---

<div align="center">

**⭐ Star this repo if you find it useful!**

</div>
