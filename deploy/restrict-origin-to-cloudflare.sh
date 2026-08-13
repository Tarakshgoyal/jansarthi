#!/usr/bin/env bash
set -euo pipefail

if [[ $(id -u) -ne 0 ]]; then
  echo "Run this script as root." >&2
  exit 1
fi

ipv4_ranges="$(curl --fail --silent --show-error https://www.cloudflare.com/ips-v4)"
ipv6_ranges="$(curl --fail --silent --show-error https://www.cloudflare.com/ips-v6)"
[[ -n "$ipv4_ranges" && -n "$ipv6_ranges" ]]

ufw --force delete allow 80/tcp >/dev/null 2>&1 || true
ufw --force delete allow 443/tcp >/dev/null 2>&1 || true

while IFS= read -r cidr; do
  [[ -n "$cidr" ]] || continue
  ufw allow proto tcp from "$cidr" to any port 80,443 comment 'Cloudflare origin'
done <<<"$ipv4_ranges"

while IFS= read -r cidr; do
  [[ -n "$cidr" ]] || continue
  ufw allow proto tcp from "$cidr" to any port 80,443 comment 'Cloudflare origin'
done <<<"$ipv6_ranges"

ufw reload
ufw status numbered
