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

# Validate required arguments
if [[ -z "$STAGING_URL" ]]; then
    echo "Error: staging-url required"
    echo "Usage: $0 <staging-url> <commit-range> <spec-file>"
    exit 1
fi

# Validate API key
if [[ -z "$OPENAI_API_KEY" ]]; then
    echo "Error: OPENAI_API_KEY environment variable not set"
    echo ""
    echo "Set it in your shell profile (~/.zshrc or ~/.bashrc):"
    echo "  export OPENAI_API_KEY='sk-proj-...'"
    echo ""
    echo "Or create ~/.claude/credentials and source it from your shell profile."
    exit 1
fi

echo "🤖 Requesting OpenAI peer review..."
echo "Model: $MODEL"
echo "Commit range: $COMMIT_RANGE"
echo "Spec file: $SPEC_FILE"
echo ""

# Validate commit range
COMMITS_AHEAD=$(git rev-list --count "$COMMIT_RANGE" 2>/dev/null || echo "0")

if [[ "$COMMITS_AHEAD" -eq 0 ]]; then
    echo "⚠️ WARNING: No commits in range $COMMIT_RANGE"
    echo "develop appears to be even with or behind main."
    echo ""
    echo "This shouldn't happen in normal workflow."
    echo "Please verify branches and try again."
    exit 1
fi

# Get diff of sprint changes
DIFF=$(git diff "$COMMIT_RANGE" --no-color)

if [[ -z "$DIFF" ]]; then
    echo "No changes found in range $COMMIT_RANGE"
    exit 1
fi

# Calculate diff size and estimate cost
DIFF_SIZE=$(echo "$DIFF" | wc -c | tr -d ' ')
ESTIMATED_TOKENS=$((DIFF_SIZE / 4))

# Warn if diff is very large
MAX_SIZE=100000  # ~25k tokens (safe for gpt-4)

if [[ "$DIFF_SIZE" -gt "$MAX_SIZE" ]]; then
    ESTIMATED_COST=$(echo "scale=4; $ESTIMATED_TOKENS * 0.00003" | bc 2>/dev/null || echo "unknown")
    echo "⚠️ WARNING: Large diff detected"
    echo "Diff size: $DIFF_SIZE bytes (~$ESTIMATED_TOKENS tokens)"
    echo "Estimated cost: ~\$$ESTIMATED_COST (gpt-4 pricing)"
    echo ""
    echo "Consider reviewing smaller commit ranges."
    echo ""
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Aborted by user"
        exit 1
    fi
fi

# Secrets detection (BLOCKING)
echo "🔍 Scanning for secrets..."

SECRETS_FOUND=$(echo "$DIFF" | grep -E "(sk-[a-zA-Z0-9]{20,}|api[_-]?key[[:space:]]*[:=]|password[[:space:]]*[:=]|secret[[:space:]]*[:=]|token[[:space:]]*[:=])" || true)

if [[ -n "$SECRETS_FOUND" ]]; then
    echo "❌ BLOCKING: Potential secrets detected in diff"
    echo ""
    echo "Detected patterns:"
    echo "$SECRETS_FOUND"
    echo ""
    echo "DO NOT PROCEED. Remove secrets before running Codex review."
    echo "Use environment variables for secrets instead of hardcoding."
    exit 1
fi

echo "✅ No secrets detected"
echo ""

# Circuit breaker check (if sprint file provided)
if [[ -n "$SPEC_FILE" ]]; then
    SPRINT_DIR=$(dirname "$SPEC_FILE")/../sprints
    if [[ -d "$SPRINT_DIR" ]]; then
        SPRINT_FILE=$(find "$SPRINT_DIR" -name "*.active.md" 2>/dev/null | head -1)
        if [[ -f "$SPRINT_FILE" ]] && grep -q "Codex review:.*✅" "$SPRINT_FILE"; then
            echo "⚠️ WARNING: Codex review already completed for this sprint"
            echo "Found in: $SPRINT_FILE"
            echo ""
            read -p "Run again anyway? (y/N) " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                echo "Aborted - Codex review already complete"
                exit 0
            fi
        fi
    fi
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
echo "📡 Calling OpenAI API..."
RESPONSE=$(curl -s https://api.openai.com/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -d "{
    \"model\": \"$MODEL\",
    \"messages\": [{\"role\": \"user\", \"content\": $(jq -Rs . <<< "$PROMPT")}],
    \"temperature\": 0.3
  }")

# Check for API errors
if echo "$RESPONSE" | jq -e '.error' > /dev/null 2>&1; then
    echo "❌ OpenAI API Error:"
    echo "$RESPONSE" | jq -r '.error.message'
    exit 1
fi

# Extract recommendations from response
RECOMMENDATIONS=$(echo "$RESPONSE" | jq -r '.choices[0].message.content // empty')

if [[ -z "$RECOMMENDATIONS" ]]; then
    echo "❌ Error: Failed to get recommendations from OpenAI"
    echo "API Response: $RESPONSE"
    exit 1
fi

echo "✅ OpenAI peer review complete"
echo ""
echo "$RECOMMENDATIONS"
