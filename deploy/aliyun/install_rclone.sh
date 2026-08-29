#!/usr/bin/env bash
set -euo pipefail

VERSION="1.75.0"
ARCHIVE="rclone-v${VERSION}-linux-amd64.zip"
TEMP_ROOT="$(mktemp -d /tmp/rclone-install.XXXXXX)"

cleanup() {
  rm -rf "$TEMP_ROOT"
}
trap cleanup EXIT

cd "$TEMP_ROOT"
curl -fsSLO "https://downloads.rclone.org/v${VERSION}/${ARCHIVE}"
curl -fsSLO "https://downloads.rclone.org/v${VERSION}/SHA256SUMS"
grep "${ARCHIVE}$" SHA256SUMS | sha256sum -c -
unzip -q "$ARCHIVE"
install -m 0755 "rclone-v${VERSION}-linux-amd64/rclone" /usr/local/bin/rclone

/usr/local/bin/rclone version | head -4
