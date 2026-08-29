#!/usr/bin/env bash
set -euo pipefail

BACKUP_ROOT="/var/lib/liuyao-backup"
CONFIG_ROOT="/etc/liuyao-backup"
NGINX_SECRET_ROOT="/docker/nginx/secrets"
EXISTING_TARGETS=""

if [[ -f "$CONFIG_ROOT/env" ]]; then
  EXISTING_TARGETS="$(sed -n 's/^RCLONE_TARGETS=//p' "$CONFIG_ROOT/env" | head -n 1)"
fi

mkdir -p "$BACKUP_ROOT/data" "$BACKUP_ROOT/rclone" "$CONFIG_ROOT" "$NGINX_SECRET_ROOT"
umask 077

read -r -p "备份接口用户名 [liuyao]: " BACKUP_API_USERNAME
BACKUP_API_USERNAME="${BACKUP_API_USERNAME:-liuyao}"
read -r -s -p "请设置备份接口登录密码: " BACKUP_API_PASSWORD
echo

printf '%s\n' \
  "HOST=172.17.0.1" \
  "PORT=3000" \
  "MAX_BACKUP_BYTES=20971520" \
  "LOCAL_BACKUP_ROOT=$BACKUP_ROOT/data" \
  "RCLONE_TARGETS=$EXISTING_TARGETS" \
  "RCLONE_CONFIG=$BACKUP_ROOT/rclone/rclone.conf" \
  "RCLONE_BACKUP_DIRECTORY=六爻排盘备份" \
  > "$CONFIG_ROOT/env"

BACKUP_API_HASH="$(printf '%s\n' "$BACKUP_API_PASSWORD" | openssl passwd -apr1 -stdin)"
printf '%s:%s\n' "$BACKUP_API_USERNAME" "$BACKUP_API_HASH" \
  > "$NGINX_SECRET_ROOT/backup.htpasswd"

chmod 600 "$CONFIG_ROOT/env"
chown root:101 "$NGINX_SECRET_ROOT/backup.htpasswd"
chmod 640 "$NGINX_SECRET_ROOT/backup.htpasswd"
chown -R liuyao-backup:liuyao-backup "$BACKUP_ROOT"
unset BACKUP_API_PASSWORD BACKUP_API_HASH

echo "接口密码已保存。云盘授权由 /root/configure_liuyao_multicloud.sh 单独管理。"
