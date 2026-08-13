#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CORE="$ROOT/jansarthi-core"
APP="$ROOT/jansarthi-app"
MAESTRO="${MAESTRO:-$HOME/.maestro/bin/maestro}"
API_PORT="${E2E_API_PORT:-8002}"
METRO_PORT="${E2E_METRO_PORT:-8081}"
API_LOG="${TMPDIR:-/tmp}/jansarthi-e2e-api.log"
METRO_LOG="${TMPDIR:-/tmp}/jansarthi-e2e-metro.log"

export POSTGRES_DATABASE="jansarthi_e2e"
export MINIO_BUCKET="jansarthi-e2e"
export DEV_MODE="true"
export DEBUG="false"
export OTP_REQUEST_COOLDOWN_SECONDS="0"
export E2E_API_URL="http://127.0.0.1:$API_PORT"
export EXPO_PUBLIC_API_URL="$E2E_API_URL"
export MAESTRO_CLI_NO_ANALYTICS=1
export MAESTRO_CLI_ANALYSIS_NOTIFICATION_DISABLED=true

command -v xcrun >/dev/null
test -x "$MAESTRO"

if lsof -nP -iTCP:"$API_PORT" -sTCP:LISTEN >/dev/null; then
  echo "Port $API_PORT is already in use; choose E2E_API_PORT." >&2
  exit 1
fi
if lsof -nP -iTCP:"$METRO_PORT" -sTCP:LISTEN >/dev/null; then
  echo "Port $METRO_PORT is already in use; choose E2E_METRO_PORT." >&2
  exit 1
fi

"$CORE/.venv/bin/python" "$ROOT/e2e/prepare_e2e.py"

"$CORE/.venv/bin/uvicorn" app.main:app --app-dir "$CORE" --host 127.0.0.1 --port "$API_PORT" >"$API_LOG" 2>&1 &
API_PID=$!
(cd "$APP" && CI=1 bunx expo start --clear --dev-client --localhost --port "$METRO_PORT" >"$METRO_LOG" 2>&1) &
METRO_PID=$!
cleanup() {
  local metro_listener
  metro_listener="$(lsof -tiTCP:"$METRO_PORT" -sTCP:LISTEN 2>/dev/null || true)"
  kill "$API_PID" "$METRO_PID" ${metro_listener:-} 2>/dev/null || true
  wait "$API_PID" "$METRO_PID" 2>/dev/null || true
}
trap cleanup EXIT

for _ in {1..120}; do
  curl --silent --fail "$E2E_API_URL/health" >/dev/null 2>&1 && \
    curl --silent --fail "http://127.0.0.1:$METRO_PORT/status" >/dev/null 2>&1 && break
  sleep 0.25
done
curl --silent --fail "$E2E_API_URL/health" >/dev/null
curl --silent --fail "http://127.0.0.1:$METRO_PORT/status" >/dev/null

xcrun simctl location booted set 30.3165,78.0322
DEV_URL="jansarthi://expo-development-client/?url=http%3A%2F%2F127.0.0.1%3A$METRO_PORT"
xcrun simctl openurl booted "$DEV_URL"
sleep 5

"$MAESTRO" test "$ROOT/e2e/maestro/01_citizen_create.yaml"
"$MAESTRO" test "$ROOT/e2e/maestro/02_representative_acknowledge.yaml"
"$MAESTRO" test "$ROOT/e2e/maestro/03_pwd_start.yaml"
"$CORE/.venv/bin/python" "$ROOT/e2e/complete_mobile_issue.py"
"$MAESTRO" test "$ROOT/e2e/maestro/04_representative_review.yaml"
"$MAESTRO" test "$ROOT/e2e/maestro/05_citizen_verify.yaml"

echo "Full iOS simulator flow passed."
