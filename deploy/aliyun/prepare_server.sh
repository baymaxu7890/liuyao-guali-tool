#!/usr/bin/env bash
set -euo pipefail

STAGING_ROOT="/root/liuyao-deploy-staging"
BACKUP_ROOT="/docker/liuyao-backup"
RELEASES_ROOT="/www/lytool/releases"
PREPARE_ID="$(date +%Y%m%d-%H%M%S)"
SAFETY_ROOT="/root/liuyao-before-cloud-backup-$PREPARE_ID"

test -f "$STAGING_ROOT/index.mjs"
test -f "$STAGING_ROOT/backup-api.Dockerfile"
test -f "$STAGING_ROOT/sites.conf"
test -f "$STAGING_ROOT/liuyao-dist-cloud.tar.gz"
test -f "/docker/nginx/conf.d/sites.conf"
test -f "/root/start_liuyao_web.sh"
test -f "/www/lytool/index.html"

mkdir -p "$SAFETY_ROOT" "$BACKUP_ROOT" "$RELEASES_ROOT"
cp -a "/docker/nginx/conf.d/sites.conf" "$SAFETY_ROOT/sites.conf"
cp -a "/root/start_liuyao_web.sh" "$SAFETY_ROOT/start_liuyao_web.sh"

install -m 0644 "$STAGING_ROOT/index.mjs" "$BACKUP_ROOT/index.mjs"
install -m 0644 "$STAGING_ROOT/backup-api.Dockerfile" "$BACKUP_ROOT/Dockerfile"
install -m 0600 "$STAGING_ROOT/sites.conf" "/docker/nginx/conf.d/sites.conf.pending"
install -m 0700 "$STAGING_ROOT/setup_secrets.sh" "/root/setup_liuyao_secrets.sh"
install -m 0700 "$STAGING_ROOT/deploy_static.sh" "/root/deploy_lytool_static.sh"
install -m 0700 "$STAGING_ROOT/start_services.sh" "/root/start_liuyao_services_v2.sh.pending"

LEGACY_RELEASE="$RELEASES_ROOT/legacy-$PREPARE_ID"
mkdir -p "$LEGACY_RELEASE"
cp -a "/www/lytool/index.html" "$LEGACY_RELEASE/index.html"
if [[ -d "/www/lytool/assets" ]]; then
  cp -a "/www/lytool/assets" "$LEGACY_RELEASE/assets"
fi
if [[ -f "/www/lytool/vite.svg" ]]; then
  cp -a "/www/lytool/vite.svg" "$LEGACY_RELEASE/vite.svg"
fi

"/root/deploy_lytool_static.sh" "$STAGING_ROOT/liuyao-dist-cloud.tar.gz"

echo "准备工作完成。"
echo "安全副本: $SAFETY_ROOT"
echo "旧版发布: $LEGACY_RELEASE"
echo "新版发布: $(readlink -f /www/lytool/current)"
echo "现有 Nginx 配置及容器尚未切换。"
