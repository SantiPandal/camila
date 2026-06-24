#!/bin/bash
# Finishes the Android toolchain on the Mac mini so the Anywhere_API_34 AVD can boot.
# openjdk@17 is already installed (keg-only); we just point JAVA_HOME at it.
set -e
export JAVA_HOME=/opt/homebrew/opt/openjdk@17
export PATH="$JAVA_HOME/bin:$PATH"
export ANDROID_SDK_ROOT=/opt/homebrew/share/android-commandlinetools
export ANDROID_HOME="$ANDROID_SDK_ROOT"

echo "java: $(java -version 2>&1 | head -1)"
echo "sdk root: $ANDROID_SDK_ROOT"

echo ">> accepting licenses…"
yes | sdkmanager --sdk_root="$ANDROID_SDK_ROOT" --licenses >/dev/null 2>&1 || true

echo ">> installing platform-tools, emulator, system image (the ~1.5GB part)…"
sdkmanager --sdk_root="$ANDROID_SDK_ROOT" \
  "platform-tools" "emulator" \
  "system-images;android-34;google_apis_playstore;arm64-v8a"

echo ">> verifying…"
"$ANDROID_SDK_ROOT/platform-tools/adb" version | head -1
ls -d "$ANDROID_SDK_ROOT/emulator/emulator" && echo "emulator bin present"
ls -d "$ANDROID_SDK_ROOT/system-images/android-34/google_apis_playstore/arm64-v8a" && echo "image present"
echo "=== INSTALL DONE ==="
