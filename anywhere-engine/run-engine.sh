#!/bin/bash
# launchd entrypoint. Resolves node (nvm-friendly) + Android env, then runs the engine.
set -uo pipefail

export ANDROID_SDK_ROOT="${ANDROID_SDK_ROOT:-/opt/homebrew/share/android-commandlinetools}"
export ANDROID_HOME="${ANDROID_HOME:-$ANDROID_SDK_ROOT}"
export JAVA_HOME="${JAVA_HOME:-/opt/homebrew/opt/openjdk@17}"
HERE="$(cd "$(dirname "$0")" && pwd)"

# Prefer an explicit node, else nvm's default, else PATH node.
if [ -n "${ANYWHERE_NODE:-}" ] && [ -x "$ANYWHERE_NODE" ]; then
  NODE="$ANYWHERE_NODE"
elif [ -s "$HOME/.nvm/nvm.sh" ]; then
  # shellcheck disable=SC1091
  . "$HOME/.nvm/nvm.sh" >/dev/null 2>&1
  NODE="$(command -v node)"
else
  NODE="$(command -v node)"
fi

export PATH="$ANDROID_SDK_ROOT/platform-tools:$ANDROID_SDK_ROOT/emulator:$JAVA_HOME/bin:/opt/homebrew/bin:/usr/bin:/bin:$PATH"
echo "[$(date '+%F %T')] starting anywhere engine with $NODE"
exec "$NODE" "$HERE/server.js"
