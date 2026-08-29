#!/usr/bin/env bash
set -euo pipefail

STAGING_ROOT="/root/liuyao-deploy-staging"
APP_ROOT="/opt/liuyao-backup"
STATE_ROOT="/var/lib/liuyao-backup"
CONFIG_ROOT="/etc/liuyao-backup"

test -x /usr/local/bin/node
test -x /usr/local/bin/rclone
test -f "$STAGING_ROOT/index.mjs"
test -f "$STAGING_ROOT/liuyao-backup.service"

if ! id liuyao-backup >/dev/null 2>&1; then
  useradd --system --home-dir "$STATE_ROOT" --shell /sbin/nologin liuyao-backup
fi

install -d -m 0755 "$APP_ROOT"
install -d -m 0700 -o liuyao-backup -g liuyao-backup "$STATE_ROOT" "$STATE_ROOT/data" "$STATE_ROOT/rclone"
install -d -m 0750 "$CONFIG_ROOT"
install -m 0644 "$STAGING_ROOT/index.mjs" "$APP_ROOT/index.mjs"
install -m 0644 "$STAGING_ROOT/liuyao-backup.service" /etc/systemd/system/liuyao-backup.service

systemctl daemon-reload
echo "systemd 服务已安装但尚未启动。完成云盘授权后再启用。"
