#!/usr/bin/env bash
# =============================================================================
# scripts/start-local.sh
# Starts all Proptii services locally:
#   1. Redis Cache & Queue          → localhost:6379
#   2. v2-backend (NestJS)          → http://localhost:3002
#   3. proptii-search (Scraper/Agg) → http://localhost:3001
#   4. Frontend (Vite Dev Server)   → http://localhost:5173
#
# Usage:
#   bash scripts/start-local.sh
#   npm run start:local
# =============================================================================

set -e

# ── Colours ──────────────────────────────────────────────────────────────────
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BOLD='\033[1m'
MAGENTA='\033[0;35m'
RESET='\033[0m'

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

# ── PID tracking ──────────────────────────────────────────────────────────────
PIDS=()

cleanup() {
  echo ""
  echo -e "${YELLOW}⏹  Shutting down all local Proptii services...${RESET}"
  for pid in "${PIDS[@]}"; do
    if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
      kill "$pid" 2>/dev/null || true
    fi
  done
  wait 2>/dev/null || true
  echo -e "${GREEN}✅  All services stopped.${RESET}"
  exit 0
}

trap cleanup SIGINT SIGTERM EXIT

divider() {
  echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
}

header() {
  divider
  echo -e "${BOLD}  $1${RESET}"
  divider
}

header "🚀 Starting Full Local Proptii Development Stack"

# ── 1. Redis Check ────────────────────────────────────────────────────────────
echo -e "${CYAN}[redis]${RESET}          Checking Redis service..."
if redis-cli ping &>/dev/null; then
  echo -e "${GREEN}✅  Redis is running on localhost:6379${RESET}"
else
  echo -e "${YELLOW}⚠️  Redis not responding. Attempting to start local redis-server...${RESET}"
  if command -v redis-server &>/dev/null; then
    redis-server --daemonize yes 2>/dev/null || sudo systemctl start redis-server 2>/dev/null || true
    sleep 1
    if redis-cli ping &>/dev/null; then
      echo -e "${GREEN}✅  Redis started successfully.${RESET}"
    else
      echo -e "${YELLOW}⚠️  Could not start Redis automatically. Queues may run in fallback mode.${RESET}"
    fi
  else
    echo -e "${YELLOW}⚠️  redis-server command not found. Queues will run in fallback mode.${RESET}"
  fi
fi

# ── 2. Free Ports If Occupied ─────────────────────────────────────────────────
free_port() {
  local port=$1
  local name=$2
  local pid=$(lsof -ti :"$port" 2>/dev/null || true)
  if [ -n "$pid" ]; then
    echo -e "${YELLOW}⚠️  Port $port ($name) is currently used by PID $pid. Releasing port...${RESET}"
    kill -9 $pid 2>/dev/null || true
    sleep 0.5
  fi
}

free_port 3002 "v2-backend"
free_port 3001 "proptii-search"
free_port 5173 "frontend"

# ── 3. Start v2-backend ───────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}[backend]${RESET}        Starting v2-backend (NestJS) on port 3002..."
(
  cd "$ROOT_DIR/v2-backend"
  export PORT=3002
  export NODE_ENV=development
  npm run dev
) &
PIDS+=($!)
sleep 2

# ── 4. Start proptii-search ───────────────────────────────────────────────────
echo -e "${YELLOW}[search]${RESET}         Starting proptii-search on port 3001..."
(
  cd "$ROOT_DIR/proptii-search"
  export PORT=3001
  export NODE_ENV=development
  npm run dev
) &
PIDS+=($!)
sleep 2

# ── 5. Start Frontend (Vite) ──────────────────────────────────────────────────
echo -e "${CYAN}[frontend]${RESET}       Starting Frontend (Vite) on port 5173..."
(
  cd "$ROOT_DIR"
  export VITE_USE_REMOTE_API=false
  export VITE_SEARCH_BACKEND_URL="http://localhost:3001"
  export VITE_API_URL="http://127.0.0.1:3002/api"
  export VITE_NEST_API_ENDPOINT="http://127.0.0.1:3002"
  export VITE_API_ENDPOINT="http://127.0.0.1:3002"
  npm run dev
) &
PIDS+=($!)

echo ""
divider
echo -e "${BOLD}  All local services are running! Press Ctrl+C to stop everything.${RESET}"
divider
echo ""
echo -e "  ${CYAN}Frontend UI:${RESET}       ${BOLD}http://localhost:5173${RESET}"
echo -e "  ${GREEN}v2-backend API:${RESET}    ${BOLD}http://localhost:3002/api${RESET}"
echo -e "  ${GREEN}Swagger Docs:${RESET}      ${BOLD}http://localhost:3002/api/docs${RESET}"
echo -e "  ${YELLOW}Search Service:${RESET}    ${BOLD}http://localhost:3001${RESET}"
echo -e "  ${MAGENTA}Redis:${RESET}             ${BOLD}localhost:6379${RESET}"
echo ""
divider

# Keep script running and wait for all background processes
wait
