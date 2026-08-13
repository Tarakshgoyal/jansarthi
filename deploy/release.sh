#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 1 ]]; then
  echo "Usage: $0 <container-image>" >&2
  exit 2
fi

cd /opt/jansarthi
image="$1"
candidate_env="$(mktemp)"
trap 'rm -f "$candidate_env"' EXIT
printf 'API_IMAGE=%s\n' "$image" >"$candidate_env"

previous_image=""
if [[ -f release.env ]]; then
  previous_image="$(sed -n 's/^API_IMAGE=//p' release.env)"
fi

docker compose --env-file "$candidate_env" pull
docker compose --env-file "$candidate_env" run --rm --no-deps api alembic upgrade head
docker compose --env-file "$candidate_env" up -d

ready=false
for _ in {1..30}; do
  if docker compose --env-file "$candidate_env" exec -T api \
    python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/ready', timeout=5)" \
    >/dev/null 2>&1; then
    ready=true
    break
  fi
  sleep 2
done

if [[ "$ready" != true ]]; then
  docker compose --env-file "$candidate_env" logs --tail=100 api >&2 || true
  if [[ -n "$previous_image" ]]; then
    docker compose --env-file release.env up -d api
  fi
  echo "Deployment failed readiness; previous API image restored." >&2
  exit 1
fi

install -m 600 "$candidate_env" release.env
docker image prune -f >/dev/null
echo "Deployed $image"
