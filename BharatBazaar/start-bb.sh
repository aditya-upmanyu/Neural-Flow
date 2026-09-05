#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────────────────────
# start-bb.sh  —  Detached startup for all 3 BharatBazaar instances
# Usage:  bash start-bb.sh [--logs]          starts in background
#         bash start-bb.sh --foreground      starts in foreground (ctrl+c to stop)
#
# Ports cleared:  5001 (BB-NODE-1), 5002 (BB-NODE-2), 5003 (BB-NODE-3)
# Log file:       /tmp/bharatbazaar.log
# PID file:       /tmp/bharatbazaar.pid
# ──────────────────────────────────────────────────────────────────────────────

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
mkdir -p "$SCRIPT_DIR/.bb"
LOG_FILE="$SCRIPT_DIR/.bb/bharatbazaar.log"
PID_FILE="$SCRIPT_DIR/.bb/bharatbazaar.pid"
BB_PORTS=(5001 5002 5003)

# ── Parse args ────────────────────────────────────────────────────────────────
FOREGROUND=false
SHOW_LOGS=false
for arg in "$@"; do
  case "$arg" in
    --foreground) FOREGROUND=true ;;
    --logs)       SHOW_LOGS=true  ;;
  esac
done

# ── Kill anything already on the BB ports ─────────────────────────────────────
echo "[start-bb] Clearing ports ${BB_PORTS[*]}..."
for port in "${BB_PORTS[@]}"; do
  pids=$(lsof -ti tcp:"$port" 2>/dev/null)
  if [ -n "$pids" ]; then
    echo "[start-bb]   Killing PID(s) $pids on port $port"
    echo "$pids" | xargs kill -9 2>/dev/null || true
  fi
done
sleep 0.5

# ── If a stale supervisor PID exists, kill it ─────────────────────────────────
if [ -f "$PID_FILE" ]; then
  OLD_PID=$(cat "$PID_FILE")
  if kill -0 "$OLD_PID" 2>/dev/null; then
    echo "[start-bb] Stopping previous supervisor (pid=$OLD_PID)..."
    kill "$OLD_PID" 2>/dev/null || true
    sleep 1
  fi
  rm -f "$PID_FILE"
fi

# ── Launch ────────────────────────────────────────────────────────────────────
cd "$SCRIPT_DIR"

if [ "$FOREGROUND" = true ]; then
  echo "[start-bb] Starting in FOREGROUND (ctrl+c to stop)..."
  node scripts/startInstances.js
else
  echo "[start-bb] Starting in BACKGROUND — log: $LOG_FILE"
  nohup node scripts/startInstances.js >> "$LOG_FILE" 2>&1 &
  SUPERVISOR_PID=$!
  echo "$SUPERVISOR_PID" > "$PID_FILE"
  echo "[start-bb] Supervisor started (pid=$SUPERVISOR_PID)"

  # ── Health check (wait up to 10s for all 3 ports) ────────────────────────
  echo "[start-bb] Waiting for BB nodes to become ready..."
  ALL_UP=false
  for i in $(seq 1 10); do
    sleep 1
    UP=0
    for port in "${BB_PORTS[@]}"; do
      curl -sf "http://localhost:${port}/api/health" -o /dev/null 2>/dev/null && UP=$((UP + 1))
    done
    echo "[start-bb]   $i/10 — $UP/3 nodes up"
    if [ "$UP" -eq 3 ]; then
      ALL_UP=true
      break
    fi
  done

  if [ "$ALL_UP" = true ]; then
    echo "[start-bb] ✓ All 3 BharatBazaar nodes are READY"
  else
    echo "[start-bb] ⚠  Not all nodes came up in 10s — check $LOG_FILE"
  fi

  if [ "$SHOW_LOGS" = true ]; then
    echo "[start-bb] Tailing log (ctrl+c to detach)..."
    tail -f "$LOG_FILE"
  fi
fi
