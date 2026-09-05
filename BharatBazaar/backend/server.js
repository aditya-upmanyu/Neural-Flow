/* ===================================
   MAIN EXPRESS SERVER
   BharatBazaar Platform Backend
   =================================== */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const { trackMetrics, getMetrics, setStress, getStressState, resetMetrics } = require('./middleware/metrics');

const FRONTEND_DIR = path.join(__dirname, '../frontend');
const INSTANCE_ID = process.env.INSTANCE_ID || 'BB-NODE-1';
const PORT = process.env.PORT || 5001;
const REGION = process.env.REGION || (INSTANCE_ID === 'BB-NODE-1' ? 'Mumbai' : INSTANCE_ID === 'BB-NODE-2' ? 'Delhi' : 'Bangalore');

function loadRoute(label, mountPath, routePath) {
    try {
        const routeModule = require(routePath);
        return { label, mountPath, router: routeModule, loaded: true, error: null };
    } catch (error) {
        return { label, mountPath, router: null, loaded: false, error: error.message };
    }
}

// Initialize Express app
const app = express();

// Middleware
app.use(cors({
    origin: (origin, callback) => {
        if (!origin || origin.indexOf('localhost') !== -1 || origin.indexOf('127.0.0.1') !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(trackMetrics);

// Serve static files from frontend folder
app.use(express.static(FRONTEND_DIR));

const routeDefinitions = [
    { label: 'Auth routes', mountPath: '/api/auth', routePath: './routes/auth' },
    { label: 'Product routes', mountPath: '/api/products', routePath: './routes/products' },
    { label: 'Cart routes', mountPath: '/api/cart', routePath: './routes/cart' },
    { label: 'Queue routes', mountPath: '/api/queue', routePath: './routes/queue' },
    { label: 'Room routes', mountPath: '/api/rooms', routePath: './routes/rooms' },
    { label: 'Order routes', mountPath: '/api/orders', routePath: './routes/orders' },
    { label: 'Razorpay routes', mountPath: '/api/razorpay', routePath: './routes/razorpay' }
];

const loadedRoutes = routeDefinitions.map(({ label, mountPath, routePath }) => {
    const route = loadRoute(label, mountPath, routePath);
    if (route.loaded) {
        app.use(mountPath, route.router);
    }
    return route;
});

// Health check endpoint
// Returns a stable, NeuralFlow-compatible shape every time.
// Fields: status, service, instanceId, region, version, timestamp,
//         environment, uptime, uptimeFormatted, database.
app.get('/api/health', (req, res) => {
    const uptime   = process.uptime();
    const dbState  = mongoose.connection.readyState;
    // 0=disconnected 1=connected 2=connecting 3=disconnecting
    const dbStatus = dbState === 1 ? 'connected'
                   : dbState === 2 ? 'connecting'
                   : 'disconnected';

    res.json({
        // ── Core identity (NeuralFlow reads these) ──────────────────────
        status:     'healthy',           // always 'healthy' while process is up
        service:    'BharatBazaar',
        instanceId: INSTANCE_ID,         // e.g. 'BB-NODE-1'
        region:     REGION,              // e.g. 'Mumbai'
        version:    '1.0.0',
        // ── Runtime ────────────────────────────────────────────────────
        timestamp:       new Date().toISOString(),
        environment:     process.env.NODE_ENV || 'development',
        uptime:          Math.floor(uptime),
        uptimeFormatted: formatUptime(uptime),
        // ── Database ───────────────────────────────────────────────────
        database: {
            status:    dbStatus,
            connected: dbState === 1,
        },
        // ── Routes loaded ──────────────────────────────────────────────
        routes: loadedRoutes.reduce((acc, r) => {
            acc[r.mountPath] = r.loaded ? 'ok' : 'failed';
            return acc;
        }, {}),
    });
});

// ── CONTROLLED DEMO STRESS ENDPOINT ─────────────────────────────────────────
//
// PURPOSE  : Allows NeuralFlow (running locally) to simulate degradation on
//            THIS node so the AI detection + rerouting demo is visible.
//
// SAFETY   : This endpoint ONLY affects the Node.js process it runs in.
//            It cannot contact, proxy, or attack any external system.
//            The "stress" is implemented purely inside metrics.js as an
//            in-process latency injection and controlled error rate.
//
// RESET    : POST { active: false, resetMetrics: true } to restore normal
//            operation and clear the sliding-window latency history.
//
// CALLED BY: NeuralFlow backend (ExternalNodeAdapter.startAttack / endAttack)
//            Must only be reachable from localhost.
//
app.post('/api/demo/stress', (req, res) => {
    // Safety: reject if the request is not from localhost
    const remoteIp = req.socket.remoteAddress || '';
    const isLocal  = remoteIp === '127.0.0.1'
                  || remoteIp === '::1'
                  || remoteIp === '::ffff:127.0.0.1';
    if (!isLocal) {
        return res.status(403).json({
            error:   'Forbidden',
            message: 'Demo stress endpoint is restricted to localhost only.',
        });
    }

    const {
        active,
        addedLatencyMs  = 400,
        errorRateTarget = 0.05,
        resetMetrics: doReset = false,
    } = req.body;

    // Clamp to safe maximums — cannot be weaponised against external hosts
    setStress({
        active:          !!active,
        addedLatencyMs:  Math.min(Number(addedLatencyMs)   || 0, 2000),
        errorRateTarget: Math.min(Number(errorRateTarget) || 0, 0.5),
    });

    if (!active && doReset) {
        resetMetrics();
    }

    const state = getStressState();
    console.log(
        `[DEMO-STRESS] ${state.active ? 'ON ▲' : 'OFF ▼'}` +
        `  latency+${state.addedLatencyMs}ms` +
        `  errorRate=${(state.errorRateTarget * 100).toFixed(0)}%` +
        `${doReset ? '  (metrics window reset)' : ''}`
    );

    res.json({
        success:    true,
        instanceId: INSTANCE_ID,
        region:     REGION,
        stress:     state,
        note:       'Controlled demo mechanism — affects this process only.',
    });
});

// Metrics endpoint (NeuralFlow-compatible — returns sliding-window latency, RPS, health)
app.get('/api/metrics', (req, res) => {
    const metrics = getMetrics();
    res.json(metrics);
});

// Frontend config endpoint (exposes safe config values to frontend)
app.get('/api/config', (req, res) => {
    res.json({
        razorpayKeyId: process.env.RAZORPAY_KEY_ID || '',
        whatsappNumber: process.env.WHATSAPP_BUSINESS_NUMBER || '',
        currency: 'INR'
    });
});

function formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m ${secs}s`;
    if (minutes > 0) return `${minutes}m ${secs}s`;
    return `${secs}s`;
}

// Serve frontend for any non-API routes
app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
        const filePath = path.join(FRONTEND_DIR, req.path);
        res.sendFile(filePath, (err) => {
            if (err) {
                res.sendFile(path.join(FRONTEND_DIR, 'index.html'));
            }
        });
    } else {
        res.status(404).json({ error: 'API endpoint not found' });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err.stack);
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    res.status(statusCode).json({
        error: message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

let mongoConnected = false;
let socketInitialized = false;

// Database connection
try {
    const connectDatabase = require('./config/database');
    connectDatabase().then(() => {
        mongoConnected = mongoose.connection.readyState === 1;
    }).catch(() => {
        mongoConnected = false;
    });
} catch (error) {
    console.error('Database config failed to load:', error.message);
}

// Start server
const server = app.listen(PORT, () => {
    console.log('BharatBazaar Backend running');
    console.log(`Port: ${PORT}`);
    console.log(`Instance ID: ${INSTANCE_ID}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Frontend directory: ${FRONTEND_DIR}`);
    console.log(`Health endpoint: http://localhost:${PORT}/api/health`);
    console.log(`Metrics endpoint: http://localhost:${PORT}/api/metrics`);

    loadedRoutes.forEach((route) => {
        if (route.loaded) {
            console.log(`Routes: ${route.label} loaded at ${route.mountPath}`);
        } else {
            console.error(`Routes: ${route.label} failed to load (${route.error})`);
        }
    });

    setTimeout(() => {
        const dbState = mongoose.connection.readyState;
        if (dbState === 1) {
            console.log(`MongoDB: Connected (${mongoose.connection.name} @ ${mongoose.connection.host})`);
        } else if (dbState === 2) {
            console.log('MongoDB: Connecting...');
        } else {
            console.error('MongoDB: Not connected');
        }

        if (socketInitialized) {
            console.log('Socket.IO: Enabled');
        } else {
            console.error('Socket.IO: Disabled');
        }
    }, 500);
});

server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Stop the existing process or use a different PORT.`);
        console.error(`Try: lsof -ti:${PORT} | xargs kill -9`);
        console.error(`Or: PORT=${Number(PORT) + 1} npm run dev`);
        process.exit(1);
    }

    console.error('Server failed to start:', error.message);
    process.exit(1);
});

// Initialize Socket.IO
try {
    const socketServer = require('./socketserver');
    socketServer.initialize(server);
    socketInitialized = true;
} catch (error) {
    socketInitialized = false;
    console.error(`Socket.IO initialization failed: ${error.message}`);
}

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(async () => {
        console.log('HTTP server closed');
        if (mongoose.connection.readyState === 1) {
            try {
                await mongoose.connection.close();
                console.log('MongoDB connection closed');
            } catch (error) {
                console.error('Error closing MongoDB connection:', error.message);
            }
        }
        process.exit(0);
    });
});

process.on('unhandledRejection', (err) => {
    console.error('[BB] Unhandled Promise Rejection (non-fatal):', err && err.message ? err.message : err);
    // Do NOT exit — the supervisor will restart if a real crash occurs.
    // Exiting here on transient errors (e.g. DB timeouts) causes unnecessary
    // node flapping during a demo.
});

module.exports = app;
