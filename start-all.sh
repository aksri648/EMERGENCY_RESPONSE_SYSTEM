#!/usr/bin/env bash
# start-all.sh — boot all four ARIA services in parallel.
#
#   backend   → http://localhost:3000  (Express + WS /ws)
#   agent     → LiveKit Cloud worker
#   dashboard → http://localhost:5173  (Vite)
#   client    → Expo Metro bundler (scan QR with Expo Go, or press i / a)
#
# Ctrl+C stops all four. Output is prefixed + color-coded per service.
# Use ./start.sh instead if you only want backend + agent (the original).

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

C_RESET=$'\033[0m'
C_BACKEND=$'\033[36m'    # cyan
C_AGENT=$'\033[33m'      # yellow
C_DASHBOARD=$'\033[32m'  # green
C_CLIENT=$'\033[35m'     # magenta

cleanup() {
  echo
  echo "[start-all] shutting down…"
  jobs -p 2>/dev/null | xargs -r kill 2>/dev/null || true
  sleep 1
  jobs -p 2>/dev/null | xargs -r kill -9 2>/dev/null || true
}
trap cleanup EXIT INT TERM

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || { echo "[start-all] missing required command: $1"; exit 1; }
}

require_cmd node
require_cmd npm
require_cmd python3

# --- Backend ----------------------------------------------------------------
echo "[start-all] starting backend…"
(
  cd "$ROOT/backend/backend"
  if [ ! -d node_modules ]; then
    echo "[backend] node_modules missing — run: npm install"
    exit 1
  fi
  if [ ! -f .env ]; then
    echo "[backend] WARNING: .env not found (copy from .env.example)"
  fi
  if [ ! -f src/data/orgs.json ]; then
    echo "[backend] seeding orgs.json…"
    npm run seed
  fi
  npm run dev 2>&1 | sed "s/^/$(printf "${C_BACKEND}[backend]${C_RESET}   ")/"
) &

# --- Agent ------------------------------------------------------------------
echo "[start-all] starting agent…"
(
  cd "$ROOT/backend/agent"
  if [ -d .venv ]; then
    # shellcheck disable=SC1091
    source .venv/bin/activate
  fi
  python3 agent.py dev 2>&1 | sed "s/^/$(printf "${C_AGENT}[agent]${C_RESET}     ")/"
) &

# --- Dashboard --------------------------------------------------------------
echo "[start-all] starting dashboard…"
(
  cd "$ROOT/backend/dashboard"
  if [ ! -d node_modules ]; then
    echo "[dashboard] node_modules missing — run: npm install"
    exit 1
  fi
  if [ ! -f .env ]; then
    echo "[dashboard] WARNING: .env not found (VITE_BACKEND_URL will default to http://localhost:3000)"
  fi
  npm run dev 2>&1 | sed "s/^/$(printf "${C_DASHBOARD}[dashboard]${C_RESET} ")/"
) &

# --- Client -----------------------------------------------------------------
echo "[start-all] starting client…"
(
  cd "$ROOT/client"
  if [ ! -d node_modules ]; then
    echo "[client] node_modules missing — run: npm install"
    exit 1
  fi
  if [ ! -f .env ]; then
    echo "[client] WARNING: .env not found (EXPO_PUBLIC_BACKEND_URL will default to http://localhost:3000)"
  fi
  npx expo start 2>&1 | sed "s/^/$(printf "${C_CLIENT}[client]${C_RESET}     ")/"
) &

echo
echo "[start-all] all four services launched."
echo "  backend   → http://localhost:3000  (REST + WS /ws)"
echo "  dashboard → http://localhost:5173"
echo "  client    → scan QR with Expo Go  (or press i / a in this terminal)"
echo "  agent     → idle LiveKit worker, joins rooms as they're created"
echo
echo "Press Ctrl+C to stop all services."
echo

wait
