#!/usr/bin/env bash
set -euo pipefail

# Build release locale per tutte le architetture (arm64-v8a, armeabi-v7a, x86, x86_64).
# Il limite del percorso CMake vale solo su Windows (vedi il .bat).
# APK: android/app/build/outputs/apk/release/app-release.apk

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [ -z "${JAVA_HOME:-}" ]; then
    for candidate in \
        "$HOME/.gradle/jdks"/*/ \
        /usr/lib/jvm/*/ \
        /opt/android-studio/jbr \
        /usr/lib/android-studio/jbr \
        /snap/android-studio/*/jbr; do
        if [ -x "$candidate/bin/java" ] && "$candidate/bin/java" -version 2>&1 | grep -qE '"((1[0-9]|2[0-1]|9|1\.8)\.)'; then
            export JAVA_HOME="${candidate%/}"
            break
        fi
    done
fi

if [ -z "${JAVA_HOME:-}" ] || [ ! -x "$JAVA_HOME/bin/java" ]; then
    echo "JAVA_HOME non configurato e nessun JDK compatibile (17-21) trovato." >&2
    exit 1
fi

export PATH="$JAVA_HOME/bin:$PATH"

if [ -z "${ANDROID_HOME:-}" ]; then
    for candidate in \
        "$HOME/Android/Sdk" \
        /usr/lib/android-sdk \
        /opt/android-sdk; do
        if [ -d "$candidate" ]; then
            export ANDROID_HOME="$candidate"
            export ANDROID_SDK_ROOT="$candidate"
            break
        fi
    done
fi

if [ -z "${ANDROID_HOME:-}" ] || [ ! -d "$ANDROID_HOME/platform-tools" ]; then
    echo "ANDROID_HOME non configurato e SDK Android non trovato." >&2
    echo "Installa l'SDK Android o esporta ANDROID_HOME." >&2
    exit 1
fi

cd "$DIR/../android"
./gradlew assembleRelease "$@"

echo
echo "✅ Build completata. APK: android/app/build/outputs/apk/release/app-release.apk"
