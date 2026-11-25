#!/usr/bin/env bash
# Run as root on a dedicated Debian 12 demo VM. Inputs are uploaded privately.
set -euo pipefail
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq curl ca-certificates xz-utils caddy iptables
if ! swapon --show | grep -q /swapfile; then
  fallocate -l 4G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile >/dev/null
  swapon /swapfile
fi
curl -fsSL https://nodejs.org/dist/latest-v24.x/SHASUMS256.txt -o /tmp/node-shasums
node_archive=$(awk '$2 ~ /^node-v24.*-linux-x64.tar.xz$/ {print $2}' /tmp/node-shasums)
test -n "$node_archive"
curl -fsSL "https://nodejs.org/dist/latest-v24.x/$node_archive" -o "/tmp/$node_archive"
(cd /tmp && grep " $node_archive$" node-shasums | sha256sum --check --status)
tar -xJf "/tmp/$node_archive" -C /usr/local --strip-components=1
id mithaiflow >/dev/null 2>&1 || useradd --system --create-home --home-dir /opt/mithaiflow mithaiflow
install -d -o mithaiflow -g mithaiflow /opt/mithaiflow/app /var/lib/mithaiflow
tar -xzf "$1" -C /opt/mithaiflow/app
install -o mithaiflow -g mithaiflow -m 600 "$2" /opt/mithaiflow/app/.env
vm_ip=$(curl -fsS -H 'Metadata-Flavor: Google' http://metadata.google.internal/computeMetadata/v1/instance/network-interfaces/0/access-configs/0/external-ip)
demo_host="mithaiflow.${vm_ip}.sslip.io"
sed -i "s|^APP_BASE_URL=.*|APP_BASE_URL=https://${demo_host}|" /opt/mithaiflow/app/.env
chown -R mithaiflow:mithaiflow /opt/mithaiflow/app
cd /opt/mithaiflow/app
runuser -u mithaiflow -- npm ci --no-audit --no-fund
runuser -u mithaiflow -- npm run setup
runuser -u mithaiflow -- env NEXT_TELEMETRY_DISABLED=1 NODE_OPTIONS=--max-old-space-size=1536 npm run build
cat >/etc/systemd/system/mithaiflow.service <<'UNIT'
[Unit]
Description=MithaiFlow hackathon demo
After=network-online.target
[Service]
User=mithaiflow
Group=mithaiflow
WorkingDirectory=/opt/mithaiflow/app
Environment=NODE_ENV=production
Environment=NEXT_TELEMETRY_DISABLED=1
ExecStart=/usr/local/bin/npm run start
Restart=on-failure
RestartSec=5
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/var/lib/mithaiflow /opt/mithaiflow/app/.next
UMask=0077
[Install]
WantedBy=multi-user.target
UNIT
cat >/etc/caddy/Caddyfile <<CADDY
${demo_host} {
  request_body {
    max_size 2MB
  }
  reverse_proxy 127.0.0.1:3000
}
CADDY
caddy validate --config /etc/caddy/Caddyfile
systemctl daemon-reload
systemctl enable --now mithaiflow
systemctl restart caddy
# Bound total internet egress to 512 MiB, including sponsor API calls.
# Loopback, metadata and management SSH through IAP remain available.
iptables -N MITHAIFLOW_EGRESS
iptables -A MITHAIFLOW_EGRESS -o lo -j RETURN
iptables -A MITHAIFLOW_EGRESS -p tcp --sport 22 -j RETURN
iptables -A MITHAIFLOW_EGRESS -d 169.254.169.254 -j RETURN
iptables -A MITHAIFLOW_EGRESS -m quota --quota 536870912 -j RETURN
iptables -A MITHAIFLOW_EGRESS -j DROP
iptables -A OUTPUT -j MITHAIFLOW_EGRESS
echo "Demo URL: https://${demo_host}"
