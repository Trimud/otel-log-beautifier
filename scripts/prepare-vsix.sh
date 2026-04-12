#!/usr/bin/env bash
# Prepare a clean staging directory for vsix packaging.
# This avoids npm workspaces + vsce interaction issues by isolating the extension.
#
# Usage: ./scripts/prepare-vsix.sh <target>
# Example: ./scripts/prepare-vsix.sh darwin-arm64

set -e

TARGET="${1:-darwin-arm64}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PTY_SOURCE="$ROOT/node_modules/node-pty"
STAGE="$ROOT/packages/vscode/.vsix-stage"

if [ ! -d "$PTY_SOURCE" ]; then
  echo "Error: node-pty not found at $PTY_SOURCE. Run 'npm install' first." >&2
  exit 1
fi

# On Linux, node-pty doesn't ship prebuilds — it compiles from source via
# node-gyp. The compiled output lives in build/Release/, not prebuilds/.
# Synthesize a prebuild directory from the build output so the rest of the
# script works uniformly.
if [ ! -d "$PTY_SOURCE/prebuilds/$TARGET" ]; then
  if [[ "$TARGET" == linux-* ]] && [ -f "$PTY_SOURCE/build/Release/pty.node" ]; then
    echo "No prebuild for $TARGET, synthesizing from build/Release/"
    mkdir -p "$PTY_SOURCE/prebuilds/$TARGET"
    cp "$PTY_SOURCE/build/Release/pty.node" "$PTY_SOURCE/prebuilds/$TARGET/pty.node"
    if [ -f "$PTY_SOURCE/build/Release/spawn-helper" ]; then
      cp "$PTY_SOURCE/build/Release/spawn-helper" "$PTY_SOURCE/prebuilds/$TARGET/spawn-helper"
      chmod +x "$PTY_SOURCE/prebuilds/$TARGET/spawn-helper"
    fi
  else
    echo "Error: No prebuild for target '$TARGET' in $PTY_SOURCE/prebuilds/" >&2
    echo "Available: $(ls "$PTY_SOURCE/prebuilds/" 2>/dev/null | tr '\n' ' ')" >&2
    if [ -d "$PTY_SOURCE/build/Release" ]; then
      echo "build/Release/ contents: $(ls "$PTY_SOURCE/build/Release/" 2>/dev/null | tr '\n' ' ')" >&2
    fi
    exit 1
  fi
fi

echo "Staging vsix for target: $TARGET"

# Clean and recreate staging directory
rm -rf "$STAGE"
mkdir -p "$STAGE"

# Copy extension files
cp "$ROOT/packages/vscode/README.md" "$STAGE/README.md"
cp "$ROOT/packages/vscode/LICENSE" "$STAGE/LICENSE"
cp "$ROOT/packages/vscode/icon.png" "$STAGE/icon.png"
cp -r "$ROOT/packages/vscode/dist" "$STAGE/dist"

# Use a helper node script (avoids Windows MSYS path translation issues
# with `node -e` inline commands containing bash paths)
node "$ROOT/scripts/stage-package-json.mjs" "$ROOT/packages/vscode/package.json" "$STAGE/package.json"

# Create a stub .vscodeignore (none of the source exclusions apply to the stage)
cat > "$STAGE/.vscodeignore" <<EOF
**/*.map
node_modules/node-pty/src/**
node_modules/node-pty/deps/**
node_modules/node-pty/third_party/**
node_modules/node-pty/scripts/**
node_modules/node-pty/typings/**
node_modules/node-pty/binding.gyp
node_modules/node-pty/README.md
EOF


# Copy node-pty (only runtime files + target platform prebuild)
mkdir -p "$STAGE/node_modules/node-pty/lib"
mkdir -p "$STAGE/node_modules/node-pty/prebuilds/$TARGET"

cp -r "$PTY_SOURCE/lib/"* "$STAGE/node_modules/node-pty/lib/"
[ -f "$PTY_SOURCE/LICENSE" ] && cp "$PTY_SOURCE/LICENSE" "$STAGE/node_modules/node-pty/LICENSE"
cp -r "$PTY_SOURCE/prebuilds/$TARGET/"* "$STAGE/node_modules/node-pty/prebuilds/$TARGET/"

# Strip build-time deps from node-pty's package.json
node "$ROOT/scripts/stage-pty-package-json.mjs" "$PTY_SOURCE/package.json" "$STAGE/node_modules/node-pty/package.json"

# spawn-helper must be executable
if [ -f "$STAGE/node_modules/node-pty/prebuilds/$TARGET/spawn-helper" ]; then
  chmod +x "$STAGE/node_modules/node-pty/prebuilds/$TARGET/spawn-helper"
fi

# Remove test files and sourcemaps from node-pty (not needed at runtime)
find "$STAGE/node_modules/node-pty/lib" -name "*.test.js" -delete 2>/dev/null || true
find "$STAGE/node_modules/node-pty/lib" -name "*.test.js.map" -delete 2>/dev/null || true
find "$STAGE/node_modules/node-pty/lib" -name "*.map" -delete 2>/dev/null || true

SIZE=$(du -sh "$STAGE" | awk '{print $1}')
echo "Staged vsix ($SIZE) at $STAGE"
