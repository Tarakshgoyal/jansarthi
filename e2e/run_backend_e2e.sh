#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CORE="$ROOT/jansarthi-core"
PORT="${E2E_API_PORT:-8002}"

export POSTGRES_DATABASE="jansarthi_e2e"
export MINIO_BUCKET="jansarthi-e2e"
export DEV_MODE="true"
export DEBUG="false"
export OTP_REQUEST_COOLDOWN_SECONDS="0"
export E2E_API_URL="http://127.0.0.1:$PORT"

"$CORE/.venv/bin/python" "$ROOT/e2e/prepare_e2e.py"

cd "$CORE"
"$CORE/.venv/bin/uvicorn" app.main:app --host 127.0.0.1 --port "$PORT" >"${TMPDIR:-/tmp}/jansarthi-e2e-api.log" 2>&1 &
API_PID=$!
trap 'kill "$API_PID" 2>/dev/null || true; wait "$API_PID" 2>/dev/null || true' EXIT

for _ in {1..60}; do
  if curl --silent --fail "$E2E_API_URL/health" >/dev/null; then
    break
  fi
  sleep 0.25
done

curl --silent --fail "$E2E_API_URL/health" >/dev/null || {
  cat "${TMPDIR:-/tmp}/jansarthi-e2e-api.log"
  exit 1
}

"$CORE/.venv/bin/python" "$ROOT/e2e/api_flow.py"
