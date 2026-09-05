# BharatBazaar

A full-stack Indian e-commerce platform used as a **realistic external application environment** for the [NeuralFlow V3](../../../NFV3) AI-powered network monitoring and rerouting demonstration.

BharatBazaar runs as **three independent Node.js instances** (BB-NODE-1, BB-NODE-2, BB-NODE-3) on ports 5001–5003. NeuralFlow monitors their health metrics in real time, simulates traffic attacks, and reroutes traffic autonomously when a node degrades.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  NeuralFlow V3  (port 3001 backend / 5173 frontend)     │
│                                                         │
│  ExternalNodeAdapter polls /api/metrics every 1 s       │
│  AttackEngine   POST /api/demo/stress  (localhost only) │
└──────────┬──────────────┬──────────────┬───────────────┘
           │              │              │
    :5001  ▼       :5002  ▼       :5003  ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│  BB-NODE-1   │ │  BB-NODE-2   │ │  BB-NODE-3   │
│  Mumbai      │ │  Delhi       │ │  Bangalore   │
│  (primary)   │ │  (failover)  │ │  (failover)  │
└──────────────┘ └──────────────┘ └──────────────┘
           │              │              │
           └──────────────┴──────────────┘
                          │
                   MongoDB :27017
                   (shared live-shopping DB)
```

All three nodes share one MongoDB database. The `INSTANCE_ID` and `PORT` environment variables tell each process which node it is.

---

## Prerequisites

| Requirement | Version | Notes |
|---|---|---|
| Node.js | ≥ 16 | https://nodejs.org |
| MongoDB | ≥ 6 | Local install **or** Atlas URI |
| npm | ≥ 8 | Bundled with Node.js |

**Install MongoDB on Windows (one command):**
```
winget install MongoDB.Server
```

---

## Quick Start

### Windows — one click
```
start-bb.bat
```
This script: checks Node.js, runs `npm install` if needed, copies `.env.example → .env` if missing, starts MongoDB if not running, starts all 3 nodes, waits for them to be healthy, and opens the browser.

### Any platform — terminal
```bash
# 1. Install dependencies (once)
npm install

# 2. Copy config
cp .env.example .env        # macOS/Linux
copy .env.example .env      # Windows

# 3. Edit .env — set MONGO_URI and JWT_SECRET at minimum

# 4. Start MongoDB
mongod --dbpath .mongo-data --port 27017   # or use a system service

# 5. Start all 3 nodes
npm start
# or directly:
node scripts/startInstances.js
```

### Seed demo data (first run)
```bash
node scripts/seed.js
```
Creates 24 products and a demo seller account:
- Email: `demo-seller@bharatbazaar.com`
- Password: `Demo@1234`

---

## Configuration

Copy `.env.example` to `.env` and set your values.

Key variables:

| Variable | Default | Description |
|---|---|---|
| `NODE_1_PORT` | `5001` | Port for BB-NODE-1 (Mumbai) |
| `NODE_2_PORT` | `5002` | Port for BB-NODE-2 (Delhi) |
| `NODE_3_PORT` | `5003` | Port for BB-NODE-3 (Bangalore) |
| `MONGO_URI` | `mongodb://localhost:27017/live-shopping` | MongoDB connection string |
| `JWT_SECRET` | *(required)* | Random secret for JWT tokens |
| `RAZORPAY_KEY_ID` | *(optional)* | Razorpay test key |

`PORT`, `INSTANCE_ID`, and `REGION` are set automatically per-node by `startInstances.js`. You do not need to set them manually when using the multi-node startup.

---

## Project Structure

```
BharatBazaar/
├── backend/
│   ├── config/
│   │   └── database.js          # Mongoose connection
│   ├── middleware/
│   │   ├── auth.js              # JWT authentication
│   │   ├── guestSession.js      # Guest cart session
│   │   ├── metrics.js           # Sliding-window RPS/latency/health
│   │   └── roleCheck.js         # Role-based access control
│   ├── models/
│   │   ├── Cart.js
│   │   ├── Order.js
│   │   ├── Product.js
│   │   └── User.js
│   ├── routes/
│   │   ├── auth.js              # /api/auth/*
│   │   ├── cart.js              # /api/cart/*
│   │   ├── orders.js            # /api/orders/*
│   │   ├── products.js          # /api/products/*
│   │   ├── queue.js             # /api/queue/*
│   │   └── rooms.js             # /api/rooms/*
│   ├── server.js                # Main Express server
│   └── socketserver.js          # Socket.IO server
├── frontend/
│   ├── js/
│   │   └── bb-status.js         # Live node status bar (NFV3 integration UI)
│   ├── index.html               # Homepage
│   ├── customerhome.html        # Product catalogue
│   ├── productdetail.html       # Product detail
│   ├── cart.html                # Shopping cart
│   ├── checkout.html            # Checkout
│   └── ...                      # Other pages
├── scripts/
│   ├── free-port.js             # Cross-platform port-freeing utility
│   ├── seed.js                  # Demo data seeder
│   └── startInstances.js        # Multi-node launcher
├── .env.example                 # Config template (commit this)
├── .gitignore
├── package.json
├── start-bb.bat                 # Windows one-click launcher
└── start-bb.sh                  # macOS/Linux launcher
```

---

## API Endpoints

### Health & Monitoring (used by NeuralFlow)

#### `GET /api/health`
Returns node identity and runtime state. NeuralFlow uses this to verify reachability.

```json
{
  "status": "healthy",
  "service": "BharatBazaar",
  "instanceId": "BB-NODE-1",
  "region": "Mumbai",
  "version": "1.0.0",
  "timestamp": "2026-08-24T10:00:00.000Z",
  "environment": "development",
  "uptime": 3600,
  "uptimeFormatted": "1h 0m 0s",
  "database": {
    "status": "connected",
    "connected": true
  },
  "routes": {
    "/api/auth": "ok",
    "/api/products": "ok",
    "/api/cart": "ok"
  }
}
```

#### `GET /api/metrics`
Returns real-time sliding-window metrics. NeuralFlow polls this every 1 s.

```json
{
  "nodeId": 1,
  "name": "BB-NODE-1",
  "instanceId": "BB-NODE-1",
  "region": "Mumbai",
  "location": "Mumbai",
  "version": "1.0.0",
  "service": "BharatBazaar",
  "latency": 45,
  "requestsPerSecond": 12.4,
  "errorRate": 0.5,
  "health": 98,
  "status": "HEALTHY",
  "stressActive": false,
  "stressLatencyMs": 0,
  "uptime": 3600,
  "uptimeFormatted": "1h 0m 0s"
}
```

Health score formula (same as NeuralFlow's internal nodes):
```
latScore = max(0, 100 − (latency − baseLatency) / 3)
errScore = max(0, 100 − errorRate × 5)
health   = round(latScore × 0.7 + errScore × 0.3)
```
Base latency per node: NODE-1 = 45 ms, NODE-2 = 65 ms, NODE-3 = 85 ms.

#### `POST /api/demo/stress`  *(localhost only)*
Controlled demo degradation — called by NeuralFlow's attack engine. **Restricted to `127.0.0.1` / `::1`.**

```jsonc
// Enable stress (NeuralFlow calls this when starting an attack)
{ "active": true, "addedLatencyMs": 450, "errorRateTarget": 0.05 }

// Disable and reset metrics window (NeuralFlow calls this when attack ends)
{ "active": false, "resetMetrics": true }
```

Response:
```json
{
  "success": true,
  "instanceId": "BB-NODE-1",
  "region": "Mumbai",
  "stress": { "active": true, "addedLatencyMs": 450, "errorRateTarget": 0.05 },
  "note": "Controlled demo mechanism — affects this process only."
}
```

**Safety:** This endpoint only affects the in-process latency middleware. It cannot proxy to, contact, or attack any external system.

#### `GET /api/config`
Returns safe public config values (Razorpay public key, currency). No secrets.

### E-Commerce

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/signup` | No | Register |
| POST | `/api/auth/login` | No | Login |
| GET | `/api/auth/profile` | JWT | Get profile |
| GET | `/api/products` | No | List products |
| GET | `/api/products/featured/list` | No | Featured products |
| GET | `/api/products/:id` | No | Single product |
| POST | `/api/products` | Seller | Create product |
| PUT | `/api/products/:id` | Seller | Update product |
| DELETE | `/api/products/:id` | Seller | Delete product |
| GET | `/api/cart` | Guest/JWT | View cart |
| POST | `/api/cart/add` | Guest/JWT | Add to cart |
| PUT | `/api/cart/update/:id` | Guest/JWT | Update quantity |
| DELETE | `/api/cart/remove/:id` | Guest/JWT | Remove item |
| POST | `/api/orders/create` | Guest/JWT | Place order |

---

## NeuralFlow Integration

BharatBazaar is the **EXTERNAL** environment in NeuralFlow. To use it:

1. Start BharatBazaar (`node scripts/startInstances.js`)
2. Start NeuralFlow (`cd NFV3 && node backend/src/server.js`)
3. In the NeuralFlow dashboard, click **Switch to EXTERNAL**
4. NeuralFlow will show BB-NODE-1, BB-NODE-2, BB-NODE-3
5. Click **Start Attack** on BB-NODE-1 — NeuralFlow calls `/api/demo/stress` on `:5001`
6. BB-NODE-1 latency rises; NeuralFlow AI detects the anomaly and reroutes traffic
7. BB-NODE-1 recovers; NeuralFlow enters COOLDOWN then NORMAL

NeuralFlow configuration (in its `.env` or `server.js`):
```
EXTERNAL_NODE_1_URL=http://localhost:5001
EXTERNAL_NODE_2_URL=http://localhost:5002
EXTERNAL_NODE_3_URL=http://localhost:5003
```
These are the defaults — no change needed for local demo.

---

## Live Status Bar

Every BharatBazaar HTML page includes `frontend/js/bb-status.js`, which renders a sticky dark status bar at the top of the page showing:

- **Node tabs** — BB-NODE-1 · Mumbai / BB-NODE-2 · Delhi / BB-NODE-3 · Bangalore with colour-coded health dots
- **Latency bar** — visual fill bar, green→yellow→red
- **RPS / Error rate / Health %**
- **Attack mode** — red flashing bar, vignette overlay, banner when stress is active
- **Recovery** — green banner when NFV3 reroutes and latency drops

---

## Troubleshooting

### `Database unavailable` on product pages
MongoDB is not running. Start it:
```
# Windows (after winget install MongoDB.Server)
"C:\Program Files\MongoDB\Server\8.3\bin\mongod.exe" --dbpath .mongo-data --port 27017

# macOS/Linux
mongod --dbpath .mongo-data --port 27017
```

### `Port already in use`
Free the port first:
```
node scripts/free-port.js 5001
# or all three:
node scripts/free-port.js 5001 5002 5003
```

### Node keeps restarting (crash loop)
Check the startup log:
```
type .bb\bharatbazaar.log   # Windows
tail -f .bb/bharatbazaar.log  # macOS/Linux
```
Common causes: MongoDB not running, missing `.env`, missing `npm install`.

### NeuralFlow shows BB nodes as OFFLINE
- Confirm all three ports are listening: `netstat -an | findstr "5001\|5002\|5003"`
- Test directly: `curl http://localhost:5001/api/health`
- Check NeuralFlow is in EXTERNAL mode

### No products on the homepage
Run the seeder: `node scripts/seed.js`

---

## Demo Instructions (safe)

The demo stress mechanism is **contained** — it only affects the local Node.js process:

1. Open BharatBazaar at `http://localhost:5001` in one browser tab
2. Open NeuralFlow at `http://localhost:5173` in another tab
3. In NeuralFlow: switch to EXTERNAL mode
4. Click **Start Attack** on BB-NODE-1
5. Watch BharatBazaar's status bar turn red with live latency rising
6. Watch NeuralFlow detect the anomaly and reroute traffic to NODE-2 or NODE-3
7. Watch BharatBazaar's status bar go green as the node recovers
8. Click **Reset Demo** in NeuralFlow to return to baseline

The demo stress endpoint (`/api/demo/stress`) is restricted to `127.0.0.1` — it cannot be triggered from any other machine.

---

## License

MIT
