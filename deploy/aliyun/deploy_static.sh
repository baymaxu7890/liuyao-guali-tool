#!/usr/bin/env bash
set -euo pipefail

ARCHIVE="${1:-}"
RELEASES_ROOT="/www/lytool/releases"
CURRENT_LINK="/www/lytool/current"

if [[ -z "$ARCHIVE" || ! -f "$ARCHIVE" ]]; then
  echo "用法: $0 /absolute/path/to/lytool-dist.tar.gz" >&2
  exit 1
fi

RELEASE_NAME="$(date +%Y%m%d-%H%M%S)"
RELEASE_DIR="$RELEASES_ROOT/$RELEASE_NAME"

mkdir -p "$RELEASE_DIR"
tar -xzf "$ARCHIVE" -C "$RELEASE_DIR"
test -f "$RELEASE_DIR/index.html"

ln -sfn "releases/$RELEASE_NAME" "/www/lytool/current.next"
mv -Tf "/www/lytool/current.next" "$CURRENT_LINK"

echo "已发布: $RELEASE_DIR"
echo "当前版本: $(readlink -f "$CURRENT_LINK")"
