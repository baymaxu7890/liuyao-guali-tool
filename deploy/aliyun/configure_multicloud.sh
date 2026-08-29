#!/usr/bin/env bash
set -euo pipefail

BACKUP_ROOT="/var/lib/liuyao-backup"
RCLONE_ROOT="$BACKUP_ROOT/rclone"
RCLONE_CONFIG="$RCLONE_ROOT/rclone.conf"
ENV_FILE="/etc/liuyao-backup/env"

mkdir -p "$RCLONE_ROOT" "$BACKUP_ROOT/data"
chmod 700 "$RCLONE_ROOT" "$BACKUP_ROOT/data"

run_rclone() {
  rclone "$@" --config "$RCLONE_CONFIG"
}

configure_nutstore() {
  local username app_password
  read -r -p "坚果云账号: " username
  read -r -s -p "坚果云第三方应用密码: " app_password
  echo
  run_rclone config create nutstore webdav \
    url https://dav.jianguoyun.com/dav/ \
    vendor other \
    user "$username" \
    pass "$app_password" \
    --obscure
  unset app_password
}

configure_oauth() {
  local provider="$1"
  echo "即将配置 $provider。请保持此终端打开，并在浏览器完成授权。"
  if [[ "$provider" == "box" ]]; then
    rclone config create "$provider" "$provider" \
      token_url https://api.box.com/oauth2/token \
      config_is_local true \
      --config "$RCLONE_CONFIG"
    return
  fi
  rclone config create "$provider" "$provider" \
    config_is_local true \
    --config "$RCLONE_CONFIG"
}

enable_configured_targets() {
  local targets
  targets="$(run_rclone listremotes | sed 's/:$//' | paste -sd, -)"
  if [[ -z "$targets" ]]; then
    echo "尚未配置任何云盘。" >&2
    exit 1
  fi
  if [[ ! -f "$ENV_FILE" ]]; then
    echo "缺少 $ENV_FILE，请先运行 /root/setup_liuyao_secrets.sh。" >&2
    exit 1
  fi
  if grep -q '^RCLONE_TARGETS=' "$ENV_FILE"; then
    sed -i "s/^RCLONE_TARGETS=.*/RCLONE_TARGETS=$targets/" "$ENV_FILE"
  else
    printf 'RCLONE_TARGETS=%s\n' "$targets" >> "$ENV_FILE"
  fi
  chmod 600 "$ENV_FILE" "$RCLONE_CONFIG"
  chown -R liuyao-backup:liuyao-backup "$BACKUP_ROOT"
  echo "已启用目标: $targets"
}

test_targets() {
  local remote
  while IFS= read -r remote; do
    [[ -z "$remote" ]] && continue
    echo "测试 ${remote}六爻排盘备份"
    run_rclone mkdir "${remote}六爻排盘备份"
    run_rclone lsd "$remote"
  done < <(run_rclone listremotes)
}

case "${1:-}" in
  nutstore) configure_nutstore ;;
  yandex) configure_oauth yandex ;;
  box) configure_oauth box ;;
  list) run_rclone listremotes ;;
  test) test_targets ;;
  enable) enable_configured_targets ;;
  *)
    echo "用法: $0 {nutstore|yandex|box|list|test|enable}"
    exit 1
    ;;
esac
