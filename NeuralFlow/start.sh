#!/usr/bin/env bash
# NeuralFlow V3 — Single startup script for hackathon demo
# Starts: NeuralFlow backend + BharatBazaar (3 instances) + opens frontend
# Usage: ./start.sh [--no-bb]   (--no-bb: skip BharatBazaar, use Internal Demo only)

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
NF_DIR="$SCRIPT_DIR"

# ── Resolve BharatBazaar directory ──────────────────────────────────────────
# Priority: 1) BB_DIR env var  2) sibling directory relative to this repo  3) fail clearly
if [ -n "${BB_DIR:-}" ] && [ -d "$BB_DIR" ]; then
  : # BB_DIR provided via environment and exists
elif [ -d "$SCRIPT_DIR/../BharatBazaar/BharatBazaar" ]; then
  BB_DIR="$SCRIPT_DIR/../BharatBazaar/BharatBazaar"
elif [ -d "$HOME/Desktop/BharatBazaar/BharatBazaar" ]; then
  BB_DIR="$HOME/Desktop/BharatBazaar/BharatBazaar"
else
  BB_DIR=""
fi

# ── Colour helpers ────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; CYAN='\033[0;36m'
YELLOW='\033[1;33m'; NC='\033[0m'
info()    { echo -e "${CYAN}[NFV3]${NC} $*"; }
success() { echo -e "${GREEN}[NFV3]${NC} $*"; }
warn()    { echo -e "${YELLOW}[NFV3]${NC} $*"; }
die()     { echo -e "${RED}[NFV3] FATAL:${NC} $*"; exit 1; }

START_BB=true
[[ "${1:-}" == "--no-bb" ]] && START_BB=false

# ── Check if services are already running & healthy ───────────────────────────
NF_ALREADY_UP=false
if curl -s --max-time 1 http://localhost:3001/api/health > /dev/null 2>&1; then
  NF_ALREADY_UP=true
  NF_PID=$(cat "$NF_DIR/backend.pid" 2>/dev/null || lsof -ti :3001 2>/dev/null || echo "active")
  success "NeuralFlow backend is already healthy on :3001 (PID $NF_PID)"
fi

BB_ALREADY_UP=false
if [ "$START_BB" = true ]; then
  ok=0
  for port in 5001 5002 5003; do
    curl -s --max-time 1 http://localhost:$port/api/health > /dev/null 2>&1 && ok=$((ok+1))
  done
  if [ $ok -eq 3 ]; then
    BB_ALREADY_UP=true
    success "All 3 BharatBazaar instances already healthy (ports 5001, 5002, 5003)"
  fi
fi

# ── Clean up stale processes only if services are NOT healthy ────────────────
if [ "$NF_ALREADY_UP" = false ] || { [ "$START_BB" = true ] && [ "$BB_ALREADY_UP" = false ]; }; then
  info "Clearing stale processes on required ports..."
  PORTS_TO_CHECK="4000 4001 4002 4003 5100"
  [ "$NF_ALREADY_UP" = false ] && PORTS_TO_CHECK="3001 $PORTS_TO_CHECK"
  [ "$BB_ALREADY_UP" = false ] && PORTS_TO_CHECK="$PORTS_TO_CHECK 5001 5002 5003"
  
  for port in $PORTS_TO_CHECK; do
    pid=$(lsof -ti :$port 2>/dev/null || true)
    if [ -n "$pid" ]; then
      kill -9 $pid 2>/dev/null || true
      warn "Killed stale process on :$port (PID $pid)"
    fi
  done
  pkill -9 -f "appNode.js" 2>/dev/null || true
  sleep 1
fi

# ── Start BharatBazaar (3 instances) if not already up ───────────────────────
BB_PID=""
if [ "$START_BB" = true ] && [ "$BB_ALREADY_UP" = false ]; then
  if [ -z "$BB_DIR" ] || [ ! -d "$BB_DIR" ]; then
    warn "BharatBazaar not found — skipping external integration"
    warn "Set BB_DIR=/path/to/BharatBazaar/BharatBazaar and re-run for External mode"
    START_BB=false
  else
    info "Starting BharatBazaar (BB-NODE-1/2/3 on ports 5001/5002/5003)..."
    cd "$BB_DIR"
    node scripts/startInstances.js &
    BB_PID=$!
    cd "$NF_DIR"
    # Wait for BB nodes to be ready
    for i in $(seq 1 10); do
      sleep 1
      ok=0
      for port in 5001 5002 5003; do
        curl -s --max-time 1 http://localhost:$port/api/health > /dev/null 2>&1 && ok=$((ok+1))
      done
      if [ $ok -eq 3 ]; then
        success "All 3 BharatBazaar instances ready"
        break
      fi
      [ $i -eq 10 ] && warn "BharatBazaar not fully ready after 10s — continuing anyway"
    done
  fi
fi

# ── Start NeuralFlow backend if not already up ───────────────────────────────
if [ "$NF_ALREADY_UP" = false ]; then
  info "Starting NeuralFlow backend on :3001..."
  cd "$NF_DIR/backend"
  node src/server.js &
  NF_PID=$!
  cd "$NF_DIR"

  # Wait for NF to be ready
  for i in $(seq 1 15); do
    sleep 1
    if curl -s --max-time 1 http://localhost:3001/api/health > /dev/null 2>&1; then
      success "NeuralFlow backend ready (PID $NF_PID)"
      break
    fi
    [ $i -eq 15 ] && die "NeuralFlow backend failed to start within 15s"
  done
fi

# ── Print status ──────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  NeuralFlow V3 — Ready for Demo${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
echo -e "  Dashboard:        ${CYAN}http://localhost:5173${NC}  (run: npm run dev)"
echo -e "  NF Backend:       ${CYAN}http://localhost:3001${NC}"
echo -e "  Internal Router:  ${CYAN}http://localhost:4000${NC}"
echo -e "  External Router:  ${CYAN}http://localhost:5100${NC}"
if [ "$START_BB" = true ]; then
  echo -e "  BharatBazaar:     ${CYAN}http://localhost:5100/customerhome.html${NC}"
fi
echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"

# ── Wait and handle shutdown ──────────────────────────────────────────────────
cleanup() {
  echo ""
  info "Shutting down..."
  # Only kill processes spawned by THIS script instance
  if [ "$NF_ALREADY_UP" = false ] && [ -n "$NF_PID" ]; then
    kill $NF_PID 2>/dev/null || true
    pkill -f "appNode.js" 2>/dev/null || true
  fi
  if [ "$BB_ALREADY_UP" = false ] && [ -n "$BB_PID" ]; then
    kill $BB_PID 2>/dev/null || true
  fi
  success "Services stopped."
}
trap cleanup SIGINT SIGTERM

# Keep script running to show logs / allow Ctrl+C
if [ "$NF_ALREADY_UP" = false ] && [ -n "$NF_PID" ]; then
  wait $NF_PID 2>/dev/null || true
else
  # Attached to existing instance — keep shell alive until user interrupts
  while true; do
    sleep 2
    if ! curl -s --max-time 1 http://localhost:3001/api/health > /dev/null 2>&1; then
      warn "NeuralFlow backend is no longer responding on :3001"
      break
    fi
  done
fi
