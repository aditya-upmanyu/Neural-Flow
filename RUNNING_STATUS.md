# 🚀 NFV5 Monorepo - Currently Running Services

**Status:** ✅ ALL SERVICES RUNNING  
**Date:** Live Status

---

## 📊 Running Services

### 1️⃣ NeuralFlow Backend ✅
- **URL:** http://localhost:3001
- **Process:** `npm run dev` in `NeuralFlow/backend`
- **Status:** RUNNING
- **Mode:** INTERNAL (Demo nodes)
- **AI Mode:** AUTO
- **Features:**
  - ✅ Neural network trained (88% accuracy)
  - ✅ 3 internal demo nodes (ports 4001-4003)
  - ✅ WebSocket server active
  - ✅ REST API responding

### 2️⃣ NeuralFlow Frontend ✅
- **URL:** http://localhost:5173
- **Process:** `npm run dev` in `NeuralFlow/frontend`
- **Status:** RUNNING
- **Framework:** React + Vite
- **Features:**
  - ✅ Real-time dashboard
  - ✅ 3D visualization
  - ✅ WebSocket connection to backend
  - ✅ Live metrics display

### 3️⃣ BharatBazaar Multi-Node Cluster ✅
- **Process:** `npm start` in `BharatBazaar`
- **Status:** RUNNING (3 nodes)
- **Database:** MongoDB connected

#### BB-NODE-1 (Mumbai) ✅
- **URL:** http://localhost:5001
- **Instance ID:** BB-NODE-1
- **Region:** Mumbai
- **Status:** ONLINE
- **Health:** http://localhost:5001/api/health
- **Metrics:** http://localhost:5001/api/metrics

#### BB-NODE-2 (Delhi) ✅
- **URL:** http://localhost:5002
- **Instance ID:** BB-NODE-2
- **Region:** Delhi
- **Status:** ONLINE
- **Health:** http://localhost:5002/api/health
- **Metrics:** http://localhost:5002/api/metrics

#### BB-NODE-3 (Bangalore) ✅
- **URL:** http://localhost:5003
- **Instance ID:** BB-NODE-3
- **Region:** Bangalore
- **Status:** ONLINE
- **Health:** http://localhost:5003/api/health
- **Metrics:** http://localhost:5003/api/metrics

### 4️⃣ MongoDB ✅
- **Port:** 27017
- **Database:** live-shopping
- **Host:** localhost
- **Status:** CONNECTED
- **Shared by:** All 3 BharatBazaar nodes

---

## 🌐 Access URLs

### Primary Access Points
- **NeuralFlow Dashboard:** http://localhost:5173
- **NeuralFlow API:** http://localhost:3001
- **BharatBazaar Node 1:** http://localhost:5001
- **BharatBazaar Node 2:** http://localhost:5002
- **BharatBazaar Node 3:** http://localhost:5003

### API Endpoints

**NeuralFlow:**
- Health: http://localhost:3001/api/health
- Nodes: http://localhost:3001/api/nodes
- State: http://localhost:3001/api/state
- Receipts: http://localhost:3001/api/receipts

**BharatBazaar (each node):**
- Health: http://localhost:5001/api/health
- Metrics: http://localhost:5001/api/metrics
- Products: http://localhost:5001/api/products
- Config: http://localhost:5001/api/config

---

## 🎯 Test Integration

### Step-by-Step Guide

1. **Open NeuralFlow Dashboard**
   ```
   http://localhost:5173
   ```

2. **Switch to EXTERNAL Mode**
   - Click "Switch to EXTERNAL" button
   - Should see 3 BharatBazaar nodes appear

3. **Verify Nodes Visible**
   - BB-NODE-1 (Mumbai) - Green indicator
   - BB-NODE-2 (Delhi) - Green indicator
   - BB-NODE-3 (Bangalore) - Green indicator

4. **Simulate Attack**
   - Click "Start Attack" on BB-NODE-1
   - Watch metrics:
     - Latency increases on NODE-1
     - Health score drops
     - Status changes to DEGRADED

5. **Watch AI Response**
   - NeuralFlow detects anomaly
   - Risk assessment runs
   - Safety gates check
   - Traffic reroutes to NODE-2 or NODE-3
   - Verification confirms recovery

6. **Check Decision Receipt**
   - View in sidebar
   - Export as JSON or text
   - See complete audit trail

---

## 🔧 Management Commands

### Stop All Services
```bash
# Stop each process with Ctrl+C or:
# In Kiro, use the process management tools
```

### Restart Individual Services

**NeuralFlow Backend:**
```bash
cd NeuralFlow/backend
npm run dev
```

**NeuralFlow Frontend:**
```bash
cd NeuralFlow/frontend
npm run dev
```

**BharatBazaar:**
```bash
cd BharatBazaar
npm start
```

### Check Process Status
```bash
# Windows
netstat -ano | findstr "3001 5173 5001 5002 5003"

# Get process list
Get-Process node
```

---

## 📊 Port Usage Summary

| Port | Service | Status |
|------|---------|--------|
| 3001 | NeuralFlow Backend API | ✅ Running |
| 4000 | NeuralFlow Internal Router | ✅ Running |
| 4001 | Demo Node 1 (Testfire Bank) | ✅ Running |
| 4002 | Demo Node 2 (Zero Bank) | ✅ Running |
| 4003 | Demo Node 3 (VulnWeb PHP) | ✅ Running |
| 5001 | BharatBazaar NODE-1 (Mumbai) | ✅ Running |
| 5002 | BharatBazaar NODE-2 (Delhi) | ✅ Running |
| 5003 | BharatBazaar NODE-3 (Bangalore) | ✅ Running |
| 5100 | NeuralFlow External Router | ✅ Running |
| 5173 | NeuralFlow Frontend (Vite) | ✅ Running |
| 27017 | MongoDB | ✅ Running |

---

## 🎉 Success!

All services are running and ready for:
- ✅ Development
- ✅ Testing
- ✅ Integration demos
- ✅ AI autonomous recovery demonstrations

---

## 🔍 Troubleshooting

### If any service fails to load:

**NeuralFlow Frontend (5173) not loading:**
- Clear browser cache
- Try incognito mode
- Check console for errors

**BharatBazaar nodes not visible in NeuralFlow:**
- Verify all 3 nodes are running (check ports 5001-5003)
- Make sure you clicked "Switch to EXTERNAL"
- Check NeuralFlow backend console for connection errors

**MongoDB connection errors:**
- Ensure MongoDB is running on port 27017
- Check .env file in BharatBazaar folder
- Verify MONGO_URI is set correctly

---

**Last Updated:** Live - All services confirmed running
