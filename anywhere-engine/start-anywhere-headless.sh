#!/bin/bash
# Launch the Anywhere emulator headless — for 24/7 daily operation (no display needed).
# Use AFTER the one-time Life360 login is done (login needs the windowed variant).
export JAVA_HOME=/opt/homebrew/opt/openjdk@17
export ANDROID_SDK_ROOT=/opt/homebrew/share/android-commandlinetools
export ANDROID_HOME="$ANDROID_SDK_ROOT"
export PATH="$ANDROID_SDK_ROOT/platform-tools:$ANDROID_SDK_ROOT/emulator:$JAVA_HOME/bin:$PATH"
exec emulator -avd Anywhere_API_34 -no-window -no-audio -no-boot-anim -gpu swiftshader_indirect
