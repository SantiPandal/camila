#!/bin/bash
# Install the Anywhere engine as a durable service on the Mac mini:
#   1. symlink the `anywhere` CLI onto PATH (/opt/homebrew/bin/anywhere)
#   2. install + (re)load the launchd LaunchAgent so it survives crashes/reboots
# Idempotent — safe to re-run. Run from this directory (the repo's durable checkout).
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
LABEL="com.santipandal.anywhere-engine"
PLIST_SRC="$HERE/launchd/$LABEL.plist"
PLIST_DST="$HOME/Library/LaunchAgents/$LABEL.plist"
BIN=/opt/homebrew/bin/anywhere

chmod +x "$HERE/anywhere" "$HERE/run-engine.sh" "$HERE"/*.sh 2>/dev/null || true

echo "→ symlinking CLI: $BIN → $HERE/anywhere"
ln -sf "$HERE/anywhere" "$BIN"

echo "→ installing LaunchAgent: $PLIST_DST"
mkdir -p "$HOME/Library/LaunchAgents"
cp "$PLIST_SRC" "$PLIST_DST"

# reload: boot out the old instance (ignore if not loaded), then bootstrap fresh
launchctl bootout "gui/$(id -u)/$LABEL" 2>/dev/null || true
launchctl bootstrap "gui/$(id -u)" "$PLIST_DST"
launchctl kickstart -k "gui/$(id -u)/$LABEL"

echo "✓ installed. Check: launchctl list | grep anywhere-engine ; anywhere list"
