#!/usr/bin/env bash
set -euo pipefail
VERSION=4.7.2
mkdir -p "$RUNNER_TEMP/godot" "$HOME/.local/share/godot/export_templates/$VERSION.stable" public/aquarium
curl --fail --location --retry 3 "https://downloads.godotengine.org/?version=$VERSION&flavor=stable&slug=linux.x86_64.zip" -o "$RUNNER_TEMP/godot/editor.zip"
curl --fail --location --retry 3 "https://downloads.godotengine.org/?version=$VERSION&flavor=stable&slug=export_templates.tpz" -o "$RUNNER_TEMP/godot/templates.zip"
unzip -q "$RUNNER_TEMP/godot/editor.zip" -d "$RUNNER_TEMP/godot"
unzip -q "$RUNNER_TEMP/godot/templates.zip" -d "$RUNNER_TEMP/godot"
cp "$RUNNER_TEMP/godot/templates/web_"*.zip "$HOME/.local/share/godot/export_templates/$VERSION.stable/"
GODOT="$RUNNER_TEMP/godot/Godot_v$VERSION-stable_linux.x86_64"
chmod +x "$GODOT"
"$GODOT" --headless --path godot --editor --import 2>&1 | tee "$RUNNER_TEMP/import.log"
if grep -E 'SCRIPT ERROR|Parse Error|Failed to load script' "$RUNNER_TEMP/import.log"; then exit 1; fi
cp -R legacy/. public/
cp -R web/. public/
"$GODOT" --headless --path godot --export-release Web ../public/aquarium/index.html 2>&1 | tee "$RUNNER_TEMP/export.log"
if grep -E 'SCRIPT ERROR|Parse Error|Failed to load script' "$RUNNER_TEMP/export.log"; then exit 1; fi
test -s public/aquarium/index.wasm
test -s public/aquarium/index.pck
touch public/.nojekyll
