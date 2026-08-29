#!/usr/bin/env bash
set -euo pipefail

WEB_IMAGE="nginx:alpine"
WEB_CONTAINER="liuyao-all-web"
BACKUP_IMAGE="liuyao-backup-api:local"
BACKUP_CONTAINER="liuyao-backup-api"
NETWORK="liuyao-internal"
WWW_ROOT="/www"
NGINX_ROOT="/docker/nginx"
BACKUP_ROOT="/docker/liuyao-backup"
RCLONE_ROOT="$BACKUP_ROOT/rclone"
DATA_ROOT="$BACKUP_ROOT/data"

test -f "$WWW_ROOT/liu-yao/index.html"
test -f "$WWW_ROOT/lytool/current/index.html"
test -f "$NGINX_ROOT/conf.d/sites.conf"
test -f "$NGINX_ROOT/secrets/backup.htpasswd"
test -f "$BACKUP_ROOT/.env"
test -f "$BACKUP_ROOT/index.mjs"
test -f "$BACKUP_ROOT/Dockerfile"
mkdir -p "$RCLONE_ROOT" "$DATA_ROOT"

docker network inspect "$NETWORK" >/dev/null 2>&1 || docker network create "$NETWORK" >/dev/null
docker build -t "$BACKUP_IMAGE" "$BACKUP_ROOT"

docker rm -f "$BACKUP_CONTAINER" >/dev/null 2>&1 || true
docker run -d \
  --name "$BACKUP_CONTAINER" \
  --restart unless-stopped \
  --network "$NETWORK" \
  --memory="96m" \
  --memory-swap="192m" \
  --env-file "$BACKUP_ROOT/.env" \
  -v "$RCLONE_ROOT:/config/rclone" \
  -v "$DATA_ROOT:/data" \
  "$BACKUP_IMAGE" >/dev/null

docker run --rm \
  --network "$NETWORK" \
  -v "$WWW_ROOT:/usr/share/nginx/html:ro" \
  -v "$NGINX_ROOT/conf.d:/etc/nginx/conf.d:ro" \
  -v "$NGINX_ROOT/secrets:/etc/nginx/secrets:ro" \
  "$WEB_IMAGE" nginx -t

docker rm -f "$WEB_CONTAINER" >/dev/null 2>&1 || true
docker run -d \
  --name "$WEB_CONTAINER" \
  --restart unless-stopped \
  --network "$NETWORK" \
  --memory="128m" \
  --memory-swap="256m" \
  -p 80:80 \
  -p 888:888 \
  -v "$WWW_ROOT:/usr/share/nginx/html:ro" \
  -v "$NGINX_ROOT/conf.d:/etc/nginx/conf.d:ro" \
  -v "$NGINX_ROOT/secrets:/etc/nginx/secrets:ro" \
  "$WEB_IMAGE" >/dev/null

docker ps --filter "name=$WEB_CONTAINER" --filter "name=$BACKUP_CONTAINER" \
  --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'
