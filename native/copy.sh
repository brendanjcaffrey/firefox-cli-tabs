#!/usr/bin/env bash

SCRIPT_PATH=$(readlink -f "$0")
SCRIPT_DIR=$(dirname -- "$SCRIPT_PATH")
USER=$(whoami)
INPUT_PATH="$SCRIPT_DIR/manifest.json"
NATIVE_HOST_NAME=$(jq -r .name < "$SCRIPT_DIR/../native/manifest.json")
OUTPUT_PATH="/Users/$USER/Library/Application Support/Mozilla/NativeMessagingHosts/$NATIVE_HOST_NAME.json"
ALLOWED_EXTENSION=$(jq -r .browser_specific_settings.gecko.id < "$SCRIPT_DIR/../extension/manifest.json")

echo "Copying from $INPUT_PATH to $OUTPUT_PATH"
echo "Script directory: $SCRIPT_DIR"
echo "Using allowed extension: $ALLOWED_EXTENSION"

sed "s|SCRIPT_DIR|$SCRIPT_DIR|" "$INPUT_PATH" | sed "s|ALLOWED_EXTENSION|$ALLOWED_EXTENSION|" > "$OUTPUT_PATH"
chmod 644 "$OUTPUT_PATH"
