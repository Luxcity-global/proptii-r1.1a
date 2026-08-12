#!/usr/bin/env bash
# =============================================================================
# start-dev.sh
# Starts the full Proptii development stack:
#
#   1. Azure Functions API     → http://localhost:7071  (api/)
#   2. proptii-search          → http://localhost:3001  (proptii-search/)
#   3. proptii-backend (NestJS)→ http://localhost:3000  (proptii-backend/)
#   4. Frontend (Vite)         → http://localhost:5173  (root)
#
# Usage:
#   bash scripts/start-dev.sh           # start everything
#   bash scripts/start-dev.sh --no-search   # skip proptii-search
#   bash scripts/start-dev.sh --api-only    # only the Azure Functions API
# =============================================================================

set -euo pipefail

# ── Colours ──────────────────────────────────────────────────────────────────
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BOLD='\033[1m'
RESET='\033[0m'

# ── Flags ─────────────────────────────────────────────────────────────────────
START_SEARCH=true
START_BACKEND=true
START_FRONTEND=true
START_API=true

for arg in "$@"; do
  case $arg in
    --no-search)   START_SEARCH=false ;;
    --no-backend)  START_BACKEND=false ;;
    --no-frontend) START_FRONTEND=false ;;
    --api-only)
      START_SEARCH=false
      START_BACKEND=false
      START_FRONTEND=false
      ;;
  esac
done

# ── PID tracking ──────────────────────────────────────────────────────────────
PIDS=()

cleanup() {
  echo ""
  echo -e "${YELLOW}⏹  Shutting down all services...${RESET}"
  for pid in "${PIDS[@]}"; do
    kill "$pid" 2>/dev/null || true
  done
  wait 2>/dev/null || true
  echo -e "${GREEN}✅  All services stopped.${RESET}"
  exit 0
}

trap cleanup SIGINT SIGTERM

# ── Helpers ───────────────────────────────────────────────────────────────────
divider() {
  echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
}

header() {
  divider
  echo -e "${BOLD}  $1${RESET}"
  divider
}

check_dir() {
  if [ ! -d "$1" ]; then
    echo -e "${RED}❌  Directory '$1' not found — skipping.${RESET}"
    return 1
  fi
  return 0
}

# ── Build Azure Functions API ─────────────────────────────────────────────────
if [ "$START_API" = true ]; then
  header "🔧  Building Azure Functions API (api/)"
  echo -e "${YELLOW}▶  npm run build${RESET}"
  (cd api && npm run build)
  echo -e "${GREEN}✅  Build complete${RESET}"
  echo ""
fi

# ── Start services ────────────────────────────────────────────────────────────
header "🚀  Starting Proptii Development Stack"

# 0. Azurite (Blob Storage Emulator)
if [ "$START_API" = true ]; then
  echo -e "${CYAN}[storage]${RESET}        Starting Azurite Emulator → ${BOLD}http://127.0.0.1:10000${RESET}"
  mkdir -p /tmp/azurite
  if command -v azurite &>/dev/null; then
    azurite --silent --location /tmp/azurite --debug /tmp/azurite-debug.log &
    PIDS+=($!)
    sleep 2
  elif command -v npx &>/dev/null; then
    npx azurite --silent --location /tmp/azurite --debug /tmp/azurite-debug.log &
    PIDS+=($!)
    sleep 2
  else
    echo -e "${YELLOW}⚠️  Azurite not found. Attachments might fail if cloud storage isn't configured.${RESET}"
  fi
fi

# 1. Azure Functions API
if [ "$START_API" = true ] && check_dir "api"; then
  echo -e "${CYAN}[api]${RESET}            Starting Azure Functions → ${BOLD}http://localhost:7071${RESET}"

  # Resolve the func binary — try npx first, then global, then local node_modules
  FUNC_BIN=""
  if command -v func &>/dev/null; then
    FUNC_BIN="func"
  elif [ -f "api/node_modules/.bin/func" ]; then
    FUNC_BIN="./node_modules/.bin/func"
  fi

  if [ -z "$FUNC_BIN" ]; then
    echo -e "${RED}❌  Azure Functions Core Tools (func) not found.${RESET}"
    echo -e "    Install it: ${YELLOW}npm install -g azure-functions-core-tools@4 --unsafe-perm true${RESET}"
    echo -e "    Or on Ubuntu: ${YELLOW}sudo apt-get install azure-functions-core-tools-4${RESET}"
    echo -e "    Skipping Azure Functions API — other services will still start."
  else
    (cd api && $FUNC_BIN start) &
    PIDS+=($!)
    sleep 2
  fi
fi

# 2. proptii-search
if [ "$START_SEARCH" = true ] && check_dir "proptii-search"; then
  echo -e "${YELLOW}[search]${RESET}         Starting proptii-search  → ${BOLD}http://localhost:3001${RESET}"
  (cd proptii-search && npm run dev) &
  PIDS+=($!)
  sleep 1
fi

# 3. v2-backend (NestJS)
if [ "$START_BACKEND" = true ] && check_dir "v2-backend"; then
  echo -e "${GREEN}[backend]${RESET}        Starting v2-backend      → ${BOLD}http://localhost:3000${RESET}"
  (cd v2-backend && node dist/main.js) &
  PIDS+=($!)
  sleep 1
fi

# 4. Frontend (Vite)
if [ "$START_FRONTEND" = true ]; then
  echo -e "${CYAN}[frontend]${RESET}       Starting Vite frontend   → ${BOLD}http://localhost:5173${RESET}"
  npm run dev &
  PIDS+=($!)
fi

# ── Status ────────────────────────────────────────────────────────────────────
echo ""
divider
echo -e "${BOLD}  All services started. Press Ctrl+C to stop everything.${RESET}"
divider
echo ""
echo -e "  ${CYAN}Frontend${RESET}          http://localhost:5173"
echo -e "  ${CYAN}Azure Functions${RESET}   http://localhost:7071"
[ "$START_SEARCH" = true ]  && echo -e "  ${CYAN}Search service${RESET}    http://localhost:3001"
[ "$START_BACKEND" = true ] && echo -e "  ${CYAN}NestJS backend${RESET}    http://localhost:3000"
echo ""
echo -e "  ${YELLOW}Health check:${RESET}     curl http://localhost:7071/api/health"
echo ""
divider

# ── Wait ──────────────────────────────────────────────────────────────────────
wait
