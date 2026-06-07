#!/usr/bin/env bash
# Starts ARIA backend + agent locally. Dashboard and client are run separately.
# Logs are tailed to your terminal; Ctrl+C kills both children.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

cleanup() {
  echo
  echo "[start.sh] shutting down…"
  jobs -p | xargs -r kill 2>/dev/null || true
}
trap cleanup EXIT INT TERM

# --- Backend -----------------------------------------------------------------
echo "[start.sh] starting backend…"
(
  cd "$ROOT/backend/backend"
  if [ ! -f src/data/orgs.json ]; then
    echo "[backend] seeding orgs.json…"
    npm run seed
  fi
  npm run dev 2>&1 | sed 's/^/[backend] /'
) &

# --- Agent -------------------------------------------------------------------
echo "[start.sh] starting agent…"
(
  cd "$ROOT/backend/agent"
  if [ -d .venv ]; then
    # shellcheck disable=SC1091
    source .venv/bin/activate
  fi
  python agent.py dev 2>&1 | sed 's/^/[agent]   /'
) &

wait
