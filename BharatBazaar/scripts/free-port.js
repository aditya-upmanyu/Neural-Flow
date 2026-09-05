#!/usr/bin/env node
/**
 * free-port.js — Cross-platform port-freeing utility
 *
 * Kills any process currently listening on the given port.
 * Works on Windows (netstat + taskkill) and macOS/Linux (lsof + kill).
 *
 * Usage:
 *   node scripts/free-port.js             # frees PORT from env (default 5001)
 *   node scripts/free-port.js 5002        # frees port 5002
 *   node scripts/free-port.js 5001 5002 5003  # frees multiple ports
 */

'use strict';

const { execSync } = require('child_process');
const os           = require('os');

const isWindows = os.platform() === 'win32';

// Ports to free: from CLI args, or PORT env var, or default 5001
const ports = process.argv.slice(2).length > 0
  ? process.argv.slice(2).map(Number).filter(Boolean)
  : [parseInt(process.env.PORT || '5001', 10)];

let anyKilled = false;

for (const port of ports) {
  if (isNaN(port) || port < 1 || port > 65535) {
    console.error(`[free-port] Invalid port: ${port}`);
    continue;
  }

  try {
    const pids = getPidsOnPort(port);
    if (pids.length === 0) {
      // Nothing to do — port is already free
      continue;
    }

    console.log(`[free-port] Killing PID(s) ${pids.join(', ')} on port ${port}...`);
    killPids(pids);
    anyKilled = true;
    console.log(`[free-port] Port ${port} freed.`);
  } catch (err) {
    // Non-fatal — if nothing is on the port, commands return non-zero
    if (!err.message.includes('No such process') && err.status !== 1) {
      console.error(`[free-port] Could not free port ${port}: ${err.message}`);
    }
  }
}

if (anyKilled) {
  // Brief pause so the OS releases the port before the next process binds it
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 300);
}

process.exit(0);

// ── helpers ──────────────────────────────────────────────────────────────────

function getPidsOnPort(port) {
  if (isWindows) {
    // netstat -ano lists all connections; filter to LISTENING on our port
    try {
      const out = execSync(
        `netstat -ano | findstr /R " 0\\.0\\.0\\.0:${port} \\[::\\]:${port} 127\\.0\\.0\\.1:${port}"`,
        { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }
      );
      const pids = new Set();
      out.trim().split('\n').forEach(line => {
        const parts = line.trim().split(/\s+/);
        const state = parts[3];
        const pid   = parseInt(parts[4], 10);
        // Only kill LISTENING processes — leave established connections alone
        if (state === 'LISTENING' && !isNaN(pid) && pid > 0) pids.add(pid);
      });
      return [...pids];
    } catch (_) {
      return []; // findstr returns exit 1 when nothing matches
    }
  } else {
    // macOS / Linux
    try {
      const out = execSync(`lsof -ti tcp:${port}`, { encoding: 'utf8' });
      return out.trim().split('\n').map(Number).filter(Boolean);
    } catch (_) {
      return [];
    }
  }
}

function killPids(pids) {
  if (isWindows) {
    for (const pid of pids) {
      try {
        execSync(`taskkill /PID ${pid} /F`, { stdio: 'pipe' });
      } catch (_) { /* already dead */ }
    }
  } else {
    execSync(`kill -9 ${pids.join(' ')}`, { stdio: 'pipe' });
  }
}
