#!/usr/bin/env bash
set -euo pipefail

# External Model Call Script
# Usage: external-model-call.sh <model-name> <context-file>
# Output: Writes response to docs/external-model-response.md
#
# Supported models:
#   codex   - OpenAI (uses OPENAI_API_KEY, model: gpt-4o)
#   gemini  - Google Gemini (uses GEMINI_API_KEY, model: gemini-2.5-pro)
#
# Environment variables:
#   OPENAI_API_KEY   - Required for codex
#   GEMINI_API_KEY   - Required for gemini
#   EXTERNAL_MODEL_OVERRIDE - Override the specific model variant (optional)

MODEL_NAME="${1:?Usage: external-model-call.sh <model-name> <context-file>}"
CONTEXT_FILE="${2:?Usage: external-model-call.sh <model-name> <context-file>}"
RESPONSE_FILE="docs/external-model-response.md"

# Normalize model name to lowercase
MODEL_NAME=$(echo "$MODEL_NAME" | tr '[:upper:]' '[:lower:]')

# Validate context file exists
if [ ! -f "$CONTEXT_FILE" ]; then
  echo "ERROR: Context file not found: $CONTEXT_FILE"
  exit 1
fi

# Read context file
CONTEXT=$(cat "$CONTEXT_FILE")

# Token estimate (rough: 1 token ~ 4 chars)
CHAR_COUNT=${#CONTEXT}
TOKEN_ESTIMATE=$((CHAR_COUNT / 4))

if [ "$TOKEN_ESTIMATE" -gt 50000 ]; then
  echo "WARNING: Context file is ~${TOKEN_ESTIMATE} tokens. This may exceed model limits or be expensive."
  echo "Consider trimming the context file before proceeding."
fi

echo "Model: $MODEL_NAME"
echo "Context: $CONTEXT_FILE (~${TOKEN_ESTIMATE} tokens)"
echo ""

case "$MODEL_NAME" in
  codex|openai)
    # Validate API key
    if [ -z "${OPENAI_API_KEY:-}" ]; then
      echo "ERROR: OPENAI_API_KEY environment variable not set"
      echo "Set it in your shell profile: export OPENAI_API_KEY='sk-...'"
      exit 1
    fi

    OPENAI_MODEL="${EXTERNAL_MODEL_OVERRIDE:-gpt-4o}"
    echo "Calling OpenAI ($OPENAI_MODEL)..."

    # Use OpenAI CLI
    RESPONSE=$(openai api chat.completions.create \
      -m "$OPENAI_MODEL" \
      -g system "You are a senior software engineer. Read the bug report and context below, then suggest a precise fix. Include exact code changes (before/after). Be specific about file names and line references." \
      -g user "$CONTEXT" \
      -M 4096 \
      -t 0.2 2>&1)

    if [ $? -ne 0 ]; then
      echo "ERROR: OpenAI API call failed"
      echo "$RESPONSE"
      exit 1
    fi

    echo "$RESPONSE" > "$RESPONSE_FILE"
    ;;

  gemini|google)
    # Validate API key
    if [ -z "${GEMINI_API_KEY:-}" ]; then
      echo "ERROR: GEMINI_API_KEY environment variable not set"
      echo "Set it in your shell profile: export GEMINI_API_KEY='...'"
      exit 1
    fi

    GEMINI_MODEL="${EXTERNAL_MODEL_OVERRIDE:-gemini-2.5-pro}"
    echo "Calling Gemini ($GEMINI_MODEL)..."

    # Use curl to call Gemini REST API directly (avoids Python path issues)
    ESCAPED_CONTEXT=$(echo "$CONTEXT" | python3 -c "import sys,json; print(json.dumps(sys.stdin.read()))")

    RESPONSE=$(curl -s -X POST \
      "https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}" \
      -H "Content-Type: application/json" \
      -d "{
        \"system_instruction\": {
          \"parts\": [{
            \"text\": \"You are a senior software engineer. Read the bug report and context below, then suggest a precise fix. Include exact code changes (before/after). Be specific about file names and line references.\"
          }]
        },
        \"contents\": [{
          \"parts\": [{
            \"text\": ${ESCAPED_CONTEXT}
          }]
        }],
        \"generationConfig\": {
          \"temperature\": 0.2,
          \"maxOutputTokens\": 8192
        }
      }" 2>&1)

    if [ $? -ne 0 ]; then
      echo "ERROR: Gemini API call failed"
      echo "$RESPONSE"
      exit 1
    fi

    # Extract text from Gemini response JSON
    EXTRACTED=$(echo "$RESPONSE" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    if 'error' in data:
        print('ERROR: ' + data['error'].get('message', 'Unknown error'))
        sys.exit(1)
    parts = data['candidates'][0]['content']['parts']
    print(''.join(p.get('text', '') for p in parts))
except (KeyError, IndexError) as e:
    print('ERROR: Failed to parse Gemini response: ' + str(e))
    print('Raw response: ' + json.dumps(data, indent=2)[:500])
    sys.exit(1)
" 2>&1)

    if [ $? -ne 0 ]; then
      echo "ERROR: Failed to parse Gemini response"
      echo "$EXTRACTED"
      exit 1
    fi

    echo "$EXTRACTED" > "$RESPONSE_FILE"
    ;;

  *)
    echo "ERROR: Unsupported model: $MODEL_NAME"
    echo ""
    echo "Supported models:"
    echo "  codex   - OpenAI (gpt-4o)"
    echo "  gemini  - Google Gemini (gemini-2.5-pro)"
    echo ""
    echo "To add a new model, update:"
    echo "  ~/.claude/scripts/external-model-call.sh"
    echo "  ~/.claude/guides/external-model-delegation.md"
    exit 1
    ;;
esac

echo ""
echo "Response written to: $RESPONSE_FILE"
echo "Done."
