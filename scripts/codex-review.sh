#!/bin/bash
set -euo pipefail

# OpenAI Codex Peer Review Script
# Usage: codex-review.sh <staging-url> <commit-range> <spec-file>
#
# Sends sprint changes to OpenAI API for peer review
# Returns: Formatted recommendations for Reviewer to evaluate

# Configuration: Override model via environment variable
# Examples: gpt-4, gpt-4-turbo, o1-preview, o1-mini
# Usage: MODEL=gpt-4-turbo codex-review.sh <args>
MODEL="${MODEL:-gpt-4}"

STAGING_URL="${1:-}"
COMMIT_RANGE="${2:-main..develop}"
SPEC_FILE="${3:-}"

if [[ -z "$STAGING_URL" ]]; then
    echo "Error: staging-url required"
    echo "Usage: $0 <staging-url> <commit-range> <spec-file>"
    exit 1
fi

if [[ -z "$OPENAI_API_KEY" ]]; then
    echo "Error: OPENAI_API_KEY environment variable not set"
    echo "Set it in your shell profile: export OPENAI_API_KEY='sk-...'"
    exit 1
fi

echo "🤖 Requesting OpenAI peer review..."
echo "Model: $MODEL"
echo "Commit range: $COMMIT_RANGE"
echo "Spec file: $SPEC_FILE"
echo ""

# Get diff of sprint changes
DIFF=$(git diff "$COMMIT_RANGE" --no-color)

if [[ -z "$DIFF" ]]; then
    echo "No changes found in range $COMMIT_RANGE"
    exit 1
fi

# Read spec file context (if provided)
SPEC_CONTEXT=""
if [[ -n "$SPEC_FILE" && -f "$SPEC_FILE" ]]; then
    SPEC_CONTEXT=$(cat "$SPEC_FILE")
fi

# Construct prompt for OpenAI
PROMPT="You are a senior code reviewer providing a peer review perspective.

Review these changes from a completed sprint. Focus on:
- Code quality and maintainability
- Security vulnerabilities
- Performance issues
- Architecture concerns
- Edge cases not handled

Context from technical spec:
\`\`\`
$SPEC_CONTEXT
\`\`\`

Sprint changes:
\`\`\`diff
$DIFF
\`\`\`

Provide specific, actionable recommendations in this format:
- [file:line] [issue] → [suggested fix]

Only include recommendations that materially improve the code. Omit stylistic preferences."

# Call OpenAI API
RESPONSE=$(curl -s https://api.openai.com/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -d "{
    \"model\": \"$MODEL\",
    \"messages\": [{\"role\": \"user\", \"content\": $(jq -Rs . <<< "$PROMPT")}],
    \"temperature\": 0.3
  }")

# Extract recommendations from response
RECOMMENDATIONS=$(echo "$RESPONSE" | jq -r '.choices[0].message.content // empty')

if [[ -z "$RECOMMENDATIONS" ]]; then
    echo "Error: Failed to get recommendations from OpenAI"
    echo "API Response: $RESPONSE"
    exit 1
fi

echo "✅ OpenAI peer review complete"
echo ""
echo "$RECOMMENDATIONS"
