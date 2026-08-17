#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 1 ]]; then
  echo "Usage: $0 <container-image>" >&2
  exit 2
fi

cd /opt/jansarthi
image="$1"
candidate_env="$(mktemp)"
site_backup="$(mktemp)"
site_config="/etc/caddy/sites/jansarthi.caddy"
site_existed=false
trap 'rm -f "$candidate_env" "$site_backup"' EXIT
printf 'API_IMAGE=%s\n' "$image" >"$candidate_env"

if [[ -f "$site_config" ]]; then
  cp "$site_config" "$site_backup"
  site_existed=true
fi

restore_caddy_config() {
  if [[ "$site_existed" == true ]]; then
    install -m 644 "$site_backup" "$site_config"
  else
    rm -f "$site_config"
  fi
  systemctl reload caddy || true
}

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

install -d -m 755 /etc/caddy/sites
install -m 644 Caddyfile "$site_config"
if ! caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile; then
  restore_caddy_config
  echo "Deployment failed Caddy validation; previous site configuration restored." >&2
  exit 1
fi
if ! systemctl reload caddy; then
  restore_caddy_config
  echo "Deployment failed Caddy reload; previous site configuration restored." >&2
  exit 1
fi

install -m 600 "$candidate_env" release.env
docker image prune -f >/dev/null
echo "Deployed $image"
