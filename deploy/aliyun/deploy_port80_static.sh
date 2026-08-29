#!/usr/bin/env bash
set -euo pipefail

ARCHIVE="${1:-}"
RELEASES_ROOT="/www/lytool-port80/releases"
CURRENT_LINK="/www/lytool-port80/current"
PUBLIC_LINK="/www/tool"

if [[ -z "$ARCHIVE" || ! -f "$ARCHIVE" ]]; then
  echo "用法: $0 /absolute/path/to/lytool-port80-dist.tar.gz" >&2
  exit 1
fi

RELEASE_NAME="$(date +%Y%m%d-%H%M%S)"
RELEASE_DIR="$RELEASES_ROOT/$RELEASE_NAME"

mkdir -p "$RELEASE_DIR"
tar -xzf "$ARCHIVE" -C "$RELEASE_DIR"
test -f "$RELEASE_DIR/index.html"

ln -sfn "releases/$RELEASE_NAME" "/www/lytool-port80/current.next"
mv -Tf "/www/lytool-port80/current.next" "$CURRENT_LINK"
ln -sfn "lytool-port80/current" "/www/tool.next"
mv -Tf "/www/tool.next" "$PUBLIC_LINK"

echo "80 端口版本已发布: $RELEASE_DIR"
echo "访问路径: /tool/"
