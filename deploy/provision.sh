#!/usr/bin/env bash
set -euo pipefail

if [[ $(id -u) -ne 0 ]]; then
  echo "Run this script as root." >&2
  exit 1
fi

export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get install -y ca-certificates curl docker.io docker-compose-v2 rsync ufw
systemctl enable --now docker

if ! swapon --show=NAME --noheadings | grep -q .; then
  fallocate -l 1G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  grep -q '^/swapfile ' /etc/fstab || echo '/swapfile none swap sw 0 0' >>/etc/fstab
fi

if ! id deploy >/dev/null 2>&1; then
  useradd --create-home --shell /bin/bash deploy
fi
getent group jansarthi >/dev/null 2>&1 || groupadd --system jansarthi
usermod -aG docker,jansarthi deploy
install -d -m 700 -o deploy -g deploy /home/deploy/.ssh
install -d -m 755 -o deploy -g deploy /opt/jansarthi
install -d -m 750 -o root -g jansarthi /etc/jansarthi

ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

echo "Base droplet provisioning complete. Install the deploy public key next."
