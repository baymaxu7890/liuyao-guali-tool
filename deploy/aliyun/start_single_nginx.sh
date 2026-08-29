#!/usr/bin/env bash
set -euo pipefail

IMAGE_NAME="nginx:alpine"
CONTAINER_NAME="liuyao-all-web"
WWW_ROOT="/www"
NGINX_ROOT="/docker/nginx"

test -f "$WWW_ROOT/liu-yao/index.html"
test -f "$WWW_ROOT/lytool/current/index.html"
test -f "$NGINX_ROOT/conf.d/sites.conf"
test -f "$NGINX_ROOT/secrets/backup.htpasswd"

docker run --rm \
  -v "$WWW_ROOT:/usr/share/nginx/html:ro" \
  -v "$NGINX_ROOT/conf.d:/etc/nginx/conf.d:ro" \
  -v "$NGINX_ROOT/secrets:/etc/nginx/secrets:ro" \
  "$IMAGE_NAME" nginx -t

docker rm -f "$CONTAINER_NAME" >/dev/null 2>&1 || true
docker run -d \
  --name "$CONTAINER_NAME" \
  --restart unless-stopped \
  --memory="128m" \
  --memory-swap="256m" \
  -p 80:80 \
  -p 888:888 \
  -v "$WWW_ROOT:/usr/share/nginx/html:ro" \
  -v "$NGINX_ROOT/conf.d:/etc/nginx/conf.d:ro" \
  -v "$NGINX_ROOT/secrets:/etc/nginx/secrets:ro" \
  "$IMAGE_NAME"

echo "Nginx 已启动：80 端口原项目，888 端口综合排盘工具。"
