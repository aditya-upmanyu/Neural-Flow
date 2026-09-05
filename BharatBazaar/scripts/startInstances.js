#!/usr/bin/env node
/**
 * startInstances.js — Start all 3 BharatBazaar backend nodes
 *
 * Spawns BB-NODE-1, BB-NODE-2 and BB-NODE-3 as independent child processes,
 * each on its own port.  Ports are read from environment variables so they
 * are easily configurable without touching this file:
 *
 *   NODE_1_PORT  (default 5001)  →  BB-NODE-1 / Mumbai
 *   NODE_2_PORT  (default 5002)  →  BB-NODE-2 / Delhi
 *   NODE_3_PORT  (default 5003)  →  BB-NODE-3 / Bangalore
 *
 * Features
 * ─────────
 *  • Cross-platform (Windows + macOS/Linux)
 *  • Checks for duplicate processes on each port before starting
 *  • Auto-respawn with exponential back-off (1 s → 2 s → … cap 30 s)
 *  • Resets back-off counter after a node runs stably for 10 s
 *  • Graceful shutdown on SIGINT / SIGTERM
 *  • Clear error messages when a node fails to start
 *
 * Usage
 * ─────
 *   node scripts/startInstances.js
 *
 * Stop
 * ────
 *   Ctrl+C  (sends SIGINT → graceful shutdown of all children)
 */

'use strict';

const { fork }   = require('child_process');
const http       = require('http');
const path       = require('path');
const os         = require('os');

// Load .env so NODE_x_PORT values are available
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const BACKEND = path.join(__dirname, '../backend/server.js');

// ── Port configuration (from .env with sensible defaults) ───────────────────
const INSTANCES = [
  {
    INSTANCE_ID: 'BB-NODE-1',
    PORT:        String(process.env.NODE_1_PORT || '5001'),
    REGION:      'Mumbai',
  },
  {
    INSTANCE_ID: 'BB-NODE-2',
    PORT:        String(process.env.NODE_2_PORT || '5002'),
    REGION:      'Delhi',
  },
  {
    INSTANCE_ID: 'BB-NODE-3',
    PORT:        String(process.env.NODE_3_PORT || '5003'),
    REGION:      'Bangalore',
  },
];

// Track live children: INSTANCE_ID → child process
const liveChildren = new Map();
// Track shutdown intent so exit handler does not respawn
let shuttingDown = false;

// ── Duplicate-process detection ──────────────────────────────────────────────
/**
 * Returns true if something is already LISTENING on `port`.
 * Uses a quick TCP connect attempt — works cross-platform.
 */
function isPortInUse(port) {
  return new Promise(resolve => {
    const net = require('net');
    const s = net.connect({ port: Number(port), host: '127.0.0.1' }, () => {
      s.destroy();
      resolve(true);
    });
    s.on('error', () => resolve(false));
    s.setTimeout(500, () => { s.destroy(); resolve(false); });
  });
}

/**
 * Returns true if the process on `port` is already a healthy BB node
 * (i.e. it responds to /api/health with instanceId matching `id`).
 */
function isHealthyBBNode(port, id) {
  return new Promise(resolve => {
    const req = http.get(
      { hostname: '127.0.0.1', port: Number(port), path: '/api/health', timeout: 2000 },
      res => {
        let body = '';
        res.on('data', c => { body += c; });
        res.on('end', () => {
          try {
            const j = JSON.parse(body);
            resolve(j.instanceId === id && j.status === 'healthy');
          } catch (_) { resolve(false); }
        });
      }
    );
    req.on('error', () => resolve(false));
    req.on('timeout', () => { req.destroy(); resolve(false); });
  });
}

// ── Spawner ──────────────────────────────────────────────────────────────────
async function spawnInstance(cfg, retryCount = 0) {
  if (shuttingDown) return;

  const { INSTANCE_ID, PORT, REGION } = cfg;

  // ── Check for duplicate before spawning ──────────────────────────────────
  const occupied = await isPortInUse(PORT);
  if (occupied) {
    const alreadyBB = await isHealthyBBNode(PORT, INSTANCE_ID);
    if (alreadyBB) {
      console.log(`[BB] ${INSTANCE_ID} already running on :${PORT} — skipping spawn.`);
      return;
    }
    // Something else is on the port — try to free it first
    console.warn(`[BB] ${INSTANCE_ID}: port ${PORT} occupied by a foreign process — attempting to free it...`);
    try {
      require('child_process').execSync(
        os.platform() === 'win32'
          ? `node "${path.join(__dirname, 'free-port.js')}" ${PORT}`
          : `node "${path.join(__dirname, 'free-port.js')}" ${PORT}`,
        { stdio: 'inherit' }
      );
      await new Promise(r => setTimeout(r, 400));
    } catch (_) {
      console.error(`[BB] ${INSTANCE_ID}: could not free port ${PORT}. Start failed.`);
      return;
    }
  }

  const startTime = Date.now();

  const child = fork(BACKEND, [], {
    env: {
      ...process.env,
      PORT,
      INSTANCE_ID,
      REGION,
    },
    stdio: 'inherit',
  });

  liveChildren.set(INSTANCE_ID, child);
  console.log(`[BB] ${INSTANCE_ID} started  port=${PORT}  pid=${child.pid}  attempt=${retryCount + 1}`);

  child.on('error', err => {
    console.error(`[BB] ${INSTANCE_ID} fork error: ${err.message}`);
    console.error(`     → Check that Node.js can execute: ${BACKEND}`);
  });

  child.on('exit', (code, sig) => {
    liveChildren.delete(INSTANCE_ID);

    if (shuttingDown || sig === 'SIGTERM' || sig === 'SIGINT') {
      console.log(`[BB] ${INSTANCE_ID} stopped (${sig || 'exit ' + code})`);
      return;
    }

    const uptime     = Date.now() - startTime;
    const wasStable  = uptime > 10_000;          // >10 s = stable run
    const nextRetry  = wasStable ? 0 : retryCount + 1;
    const backoffMs  = Math.min(1000 * 2 ** nextRetry, 30_000);

    console.warn(
      `[BB] ${INSTANCE_ID} exited unexpectedly` +
      `  code=${code}  uptime=${(uptime / 1000).toFixed(1)}s` +
      `  → restarting in ${backoffMs / 1000}s (attempt ${nextRetry + 1})`
    );

    if (code === 1 && uptime < 2000) {
      console.error(
        `[BB] ${INSTANCE_ID} crashed within 2 s — likely a startup error.\n` +
        `     Common causes:\n` +
        `       • Port ${PORT} still in use (run: node scripts/free-port.js ${PORT})\n` +
        `       • MongoDB not running (start mongod first)\n` +
        `       • Missing .env file (copy .env.example → .env)\n` +
        `       • Missing dependencies (run: npm install)`
      );
    }

    setTimeout(() => spawnInstance(cfg, nextRetry), backoffMs);
  });
}

// ── Graceful shutdown ────────────────────────────────────────────────────────
function shutdown(sig) {
  if (shuttingDown) return;
  shuttingDown = true;

  console.log(`\n[BB] ${sig} received — shutting down all instances...`);
  liveChildren.forEach((child, id) => {
    try {
      console.log(`[BB]   SIGTERM → ${id} (pid=${child.pid})`);
      child.kill('SIGTERM');
    } catch (_) {}
  });

  // Give children 5 s to exit gracefully, then force-exit
  setTimeout(() => {
    console.log('[BB] Force-exiting after timeout.');
    process.exit(0);
  }, 5000);
}

process.on('SIGINT',  () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

// ── Entry point ──────────────────────────────────────────────────────────────
(async () => {
  const ports = INSTANCES.map(i => i.PORT);
  console.log('');
  console.log('╔════════════════════════════════════════════╗');
  console.log('║  BharatBazaar — Multi-Node Startup         ║');
  console.log('╠════════════════════════════════════════════╣');
  INSTANCES.forEach(i => {
    console.log(`║  ${(i.INSTANCE_ID + ' / ' + i.REGION).padEnd(42)}║`);
    console.log(`║    port: ${i.PORT.padEnd(36)}║`);
  });
  console.log('╠════════════════════════════════════════════╣');
  console.log('║  Ctrl+C to stop all nodes                  ║');
  console.log('╚════════════════════════════════════════════╝');
  console.log('');

  // Spawn all instances (parallel, each does its own port check)
  await Promise.all(INSTANCES.map(cfg => spawnInstance(cfg)));
})();
