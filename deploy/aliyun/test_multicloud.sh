#!/usr/bin/env bash
set -euo pipefail

RCLONE_CONFIG="/var/lib/liuyao-backup/rclone/rclone.conf"
SOURCE_FILE="/var/lib/liuyao-backup/data/六爻排盘备份/六爻排盘_latest.json"
REMOTE_FILE="六爻排盘备份/六爻排盘_latest.json"

echo "LOCAL $(sha256sum "$SOURCE_FILE" | cut -d' ' -f1)"

for remote in nutstore yandex box; do
  echo "UPLOAD_${remote}"
  timeout 90s /usr/local/bin/rclone copyto \
    "$SOURCE_FILE" "${remote}:${REMOTE_FILE}" \
    --config "$RCLONE_CONFIG" \
    --contimeout 10s \
    --timeout 30s \
    --retries 2 \
    --low-level-retries 2

  echo "VERIFY_${remote}"
  case "$remote" in
    nutstore)
      timeout 60s /usr/local/bin/rclone cat \
        "${remote}:${REMOTE_FILE}" \
        --config "$RCLONE_CONFIG" \
        --contimeout 10s \
        --timeout 30s \
        --retries 2 \
        --low-level-retries 2 | sha256sum
      ;;
    yandex)
      /usr/local/bin/rclone md5sum \
        "${remote}:${REMOTE_FILE}" \
        --config "$RCLONE_CONFIG"
      md5sum "$SOURCE_FILE"
      ;;
    box)
      /usr/local/bin/rclone sha1sum \
        "${remote}:${REMOTE_FILE}" \
        --config "$RCLONE_CONFIG"
      sha1sum "$SOURCE_FILE"
      ;;
  esac
done
