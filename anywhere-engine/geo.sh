#!/bin/bash
# ./geo.sh <lat> <lng>  — set the Anywhere emulator's GPS (manual test helper).
# Finds the emulator running the Anywhere_API_34 AVD by name (serial varies by boot order).
export ANDROID_SDK_ROOT=/opt/homebrew/share/android-commandlinetools
export PATH="$ANDROID_SDK_ROOT/platform-tools:$ANDROID_SDK_ROOT/emulator:$PATH"
LAT="$1"; LNG="$2"
if [ -z "$LAT" ] || [ -z "$LNG" ]; then echo "usage: ./geo.sh <lat> <lng>"; exit 1; fi
S=""
for s in $(adb devices | grep emulator | awk '{print $1}'); do
  n=$(adb -s "$s" emu avd name 2>/dev/null | head -1 | tr -d '\r')
  if [ "$n" = "Anywhere_API_34" ]; then S="$s"; break; fi
done
if [ -z "$S" ]; then echo "Anywhere_API_34 emulator not running"; exit 1; fi
# NOTE: geo fix order is <longitude> <latitude>
adb -s "$S" emu geo fix "$LNG" "$LAT" 8 && echo "set $S -> lat=$LAT lng=$LNG"
