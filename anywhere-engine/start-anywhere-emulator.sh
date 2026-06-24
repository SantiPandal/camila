#!/bin/bash
# Launch the Anywhere emulator WITH a window — for the one-time Life360 login.
# Run this ON the Mac mini (directly, or via Screen Sharing) so the window appears
# in your GUI session. Daily use is headless (see -headless variant).
export JAVA_HOME=/opt/homebrew/opt/openjdk@17
export ANDROID_SDK_ROOT=/opt/homebrew/share/android-commandlinetools
export ANDROID_HOME="$ANDROID_SDK_ROOT"
export PATH="$ANDROID_SDK_ROOT/platform-tools:$ANDROID_SDK_ROOT/emulator:$JAVA_HOME/bin:$PATH"
exec emulator -avd Anywhere_API_34 -no-audio -gpu auto
