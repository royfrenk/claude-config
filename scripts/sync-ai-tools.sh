#!/usr/bin/env bash
#
# sync-ai-tools.sh
#
# Syncs engineering standards from ~/.claude/ (source of truth) to:
#   - ~/.gemini/ (rules, guides, commands in TOML)
#   - ~/.codex/  (AGENTS.md concatenated, guides, skills)
#
# Safe to run multiple times (idempotent).
# Called by change-process Phase 7 or manually.
#
set -euo pipefail

# ─── Configuration ──────────────────────────────────────────────────────────

CLAUDE_DIR="$HOME/.claude"
GEMINI_DIR="$HOME/.gemini"
CODEX_DIR="$HOME/.codex"

# Rules to sync (all of them)
RULES=(
  coding-style.md
  performance.md
  security.md
  stability.md
  task-completion.md
  testing.md
)

# Guides to sync (universal ones only)
GUIDES=(
  api-integration-patterns.md
  code-performance.md
  database-patterns.md
  deployment-protocol.md
  design.md
  frontend-patterns.md
  google-auth.md
  legal.md
  project-state-update.md
  review-submission.md
  roadmap-management.md
  rtl-i18n-checklist.md
  testing-patterns.md
)

# Commands to sync
COMMANDS=(
  change-process.md
  checkpoint.md
  context.md
  create-issue.md
  design.md
  iterate.md
  learning-opportunity.md
  new-project.md
  post-mortem.md
  review-prd.md
  sprint.md
)

# Commands to remove from Gemini (Claude-only, previously ported)
GEMINI_REMOVE=(
  sync-linear.toml
  sync-roadmap.toml
)

# Counters
GEMINI_RULES=0
GEMINI_GUIDES=0
GEMINI_CMDS=0
CODEX_GUIDES=0
CODEX_SKILLS=0

# ─── Helper Functions ───────────────────────────────────────────────────────

log_section() {
  echo ""
  echo "━━━ $1 ━━━"
}

log_ok() {
  echo "  [OK] $1"
}

log_skip() {
  echo "  [SKIP] $1"
}

log_warn() {
  echo "  [WARN] $1"
}

# Apply universal text substitutions for a target platform.
# Usage: adapt_content <content> <target: gemini|codex>
adapt_for_target() {
  local content="$1"
  local target="$2"

  local target_dir
  if [ "$target" = "gemini" ]; then
    target_dir="~/.gemini"
  else
    target_dir="~/.codex"
  fi

  # Path substitutions
  content=$(echo "$content" | sed \
    -e "s|~/.claude/rules/|${target_dir}/rules/|g" \
    -e "s|~/.claude/guides/|${target_dir}/guides/|g" \
    -e "s|~/.claude/commands/|${target_dir}/commands/|g" \
    -e "s|\`~/.claude/agents/[a-z-]*.md\`|the relevant workflow documentation|g" \
    -e "s|~/.claude/agents/[a-z-]*.md|the relevant workflow documentation|g" \
    -e "s|~/.claude/|${target_dir}/|g" \
  )

  # Claude tool name substitutions (only when used as tool references)
  # Be careful not to replace these words in normal prose
  content=$(echo "$content" | sed \
    -e 's/| Find file by name | Glob |/| Find file by name | File search tool |/g' \
    -e 's/| Find code pattern | Grep |/| Find code pattern | Content search tool |/g' \
    -e 's/| Read specific code | Read with line range |/| Read specific code | File reader with line range |/g' \
    -e 's/| Understand full file | Read (no range) |/| Understand full file | File reader (full file) |/g' \
  )

  # Hook references -> generic
  content=$(echo "$content" | sed \
    -e 's/Hook: warns at/Warning threshold:/g' \
    -e 's/Hook: warns on/Warning on:/g' \
    -e 's/Hook: blocks at/Hard limit:/g' \
    -e 's/Hooks automatically:/Automated checks should:/g' \
    -e 's/Hooks automatically scan for:/Before committing, scan for:/g' \
    -e 's/Hooks automatically/Automated checks/g' \
    -e 's/(PostToolUse hook on Edit\/Write)//g' \
    -e 's/(PostToolUse hook on Write)//g' \
  )

  # Agent references -> generic descriptions
  content=$(echo "$content" | sed \
    -e 's/Subagents (Explorer, Plan-Writer) have \*\*separate context\*\*\. They can:/During exploration phases, you can:/g' \
    -e 's/\*\*Leverage this:\*\* Let Explorer do heavy exploration\./Focus exploration on targeted searches to conserve context\./g' \
    -e 's/See: Eval-Writer agent for creating evals/See quality eval documentation for creating evals/g' \
    -e 's/Explorer agent/exploration phase/g' \
    -e 's/Developer agent/implementation phase/g' \
    -e 's/Reviewer agent/code review phase/g' \
    -e 's/the Developer/the implementer/g' \
    -e 's/the Reviewer/the code reviewer/g' \
  )

  # Context window -> generic
  content=$(echo "$content" | sed \
    -e 's/Claude has a 200K token context window\. Use it wisely\./Use context efficiently. Minimize unnecessary file reads./g' \
  )

  # MCP Hygiene section -> one-liner (use awk for multiline, macOS sed can't do it)
  content=$(echo "$content" | awk '
    /## MCP Hygiene/ { print "## Integration Hygiene"; print ""; print "Disable unused integrations to save context tokens."; skip=1; next }
    skip && /^## / { skip=0 }
    skip { next }
    { print }
  ')

  # MCP tool call references
  content=$(echo "$content" | sed \
    -e 's/mcp__linear__[a-z_]*/Linear API call/g' \
  )

  # Subagent spawning instructions -> single-agent
  content=$(echo "$content" | sed \
    -e 's/spawn a subagent/handle the work directly/g' \
    -e 's/Spawn a subagent/Handle the work directly/g' \
    -e 's/Use the Task tool with:/Execute the following phases yourself:/g' \
    -e 's/subagent_type: "general-purpose"/Phase: general implementation/g' \
    -e 's/subagent_type: "explorer"/Phase: codebase exploration/g' \
  )

  # "All agents must follow" -> generic
  content=$(echo "$content" | sed \
    -e 's/All agents must follow these/Follow these/g' \
    -e 's/All agents must follow/Follow/g' \
  )

  echo "$content"
}

# Strip YAML frontmatter from a markdown file's content
strip_frontmatter() {
  local content="$1"
  # If content starts with ---, remove everything up to and including the closing ---
  if echo "$content" | head -1 | grep -q '^---$'; then
    echo "$content" | awk '
      BEGIN { in_front=0; found_end=0 }
      NR==1 && /^---$/ { in_front=1; next }
      in_front && /^---$/ { in_front=0; found_end=1; next }
      in_front { next }
      { print }
    '
  else
    echo "$content"
  fi
}

# Extract description from YAML frontmatter
extract_description() {
  local file="$1"
  local desc
  desc=$(sed -n '/^---$/,/^---$/p' "$file" | grep '^description:' | sed 's/^description: *//' | sed 's/^"//' | sed 's/"$//')
  if [ -z "$desc" ]; then
    # Fallback: use first heading
    desc=$(grep '^# ' "$file" | head -1 | sed 's/^# //')
  fi
  echo "$desc"
}

# Convert a Claude command to Gemini TOML format
convert_to_toml() {
  local source_file="$1"
  local target_file="$2"
  local desc
  desc=$(extract_description "$source_file")

  local content
  content=$(cat "$source_file")
  content=$(strip_frontmatter "$content")
  content=$(adapt_for_target "$content" "gemini")

  # Replace $ARGUMENTS with {{args}}
  content=$(echo "$content" | sed 's/\$ARGUMENTS/{{args}}/g')

  # Escape triple quotes in content (unlikely but safe)
  content=$(echo "$content" | sed 's/"""/\\"\\"\\"/g')

  # Write TOML
  {
    echo "description = \"${desc}\""
    echo ""
    echo "prompt = \"\"\""
    echo "Parse any arguments provided: {{args}}"
    echo ""
    echo "$content"
    echo "\"\"\""
  } > "$target_file"
}

# Convert a Claude command to Codex SKILL.md format
convert_to_skill() {
  local source_file="$1"
  local skill_dir="$2"
  local name
  name=$(basename "$skill_dir")
  local desc
  desc=$(extract_description "$source_file")

  local content
  content=$(cat "$source_file")
  content=$(strip_frontmatter "$content")
  content=$(adapt_for_target "$content" "codex")

  # Replace $ARGUMENTS with "user's arguments"
  content=$(echo "$content" | sed "s/\\\$ARGUMENTS/the user's arguments/g")

  mkdir -p "$skill_dir"

  # Write SKILL.md
  {
    echo "---"
    echo "name: ${name}"
    echo "description: ${desc}"
    echo "---"
    echo ""
    echo "$content"
  } > "${skill_dir}/SKILL.md"
}

# Apply single-agent transformation to sprint/iterate commands.
# Replaces multi-agent orchestration with sequential single-agent phases.
apply_single_agent_transform() {
  local content="$1"

  # Replace EM agent delegation with self-execution
  content=$(echo "$content" | sed \
    -e 's/### 3\. Delegate to EM Agent/### 3. Execute Sprint Phases/g' \
    -e 's/Spawn EM agent.*:/Execute the following phases yourself for each issue:/g' \
    -e 's/EM agent handles:/You handle all phases:/g' \
    -e 's/\*\*EM is now coordinating the sprint\.\.\.\*\*/Execute these phases now for each issue in sequence./g' \
    -e 's/EM will check each issue/Check each issue/g' \
    -e 's/EM updates sprint file/Update sprint file/g' \
    -e 's/EM presents sprint wrap-up/Present sprint wrap-up/g' \
    -e 's/EM validates all safety checks/Validate all safety checks/g' \
    -e 's/EM invokes Developer/Proceed/g' \
    -e 's/EM renames sprint file/Rename sprint file/g' \
    -e 's/EM uses linear-sync/Use Linear integration/g' \
    -e 's/When EM completes/When you complete/g' \
    -e 's/EM agent/you/g' \
    -e 's/Spawn Explorer/Run exploration phase/g' \
    -e 's/Spawn Plan-Writer/Write implementation plan/g' \
    -e 's/Spawn Developer/Implement/g' \
    -e 's/Spawn Design-Reviewer.*and Code Reviewer/Run self-review using the review checklist/g' \
    -e 's/Invoke Code Reviewer/Run self-review/g' \
    -e 's/Invoke Design-Reviewer/Run design self-review/g' \
    -e 's/Invoke Reviewer/Run self-review/g' \
    -e 's/invoke Reviewer/run self-review/g' \
    -e 's/invoke reviewers/run self-review/g' \
    -e 's/Reviewer posts/Self-review produces/g' \
    -e 's/Wait for Reviewer/Complete self-review/g' \
    -e 's/Submit to Reviewer/Run self-review/g' \
    -e 's/Submit to Code Reviewer/Run code self-review/g' \
    -e 's/Reviewer approval/self-review pass/g' \
    -e 's/Reviewer response/self-review result/g' \
  )

  # Add self-review checklist if not already present
  if ! echo "$content" | grep -q "Self-Review Checklist"; then
    content="${content}

---

## Self-Review Checklist

Before deploying any changes, verify ALL of these:

### Code Quality
- [ ] No TypeScript errors (\`npm run build\` passes)
- [ ] No lint warnings
- [ ] All tests pass
- [ ] No console.log statements
- [ ] No hardcoded secrets or API keys
- [ ] Error handling is explicit (no empty catch blocks)
- [ ] Functions are under 50 lines
- [ ] Files are under 800 lines

### Security
- [ ] User inputs validated at boundaries
- [ ] No SQL injection vectors (parameterized queries only)
- [ ] Error messages do not leak internal details
- [ ] No hardcoded credentials

### Architecture
- [ ] Immutable patterns used (no object/array mutation)
- [ ] Files organized by feature, not by type
- [ ] Naming conventions followed (kebab-case files, camelCase functions)
- [ ] No unnecessary re-renders (memoization where needed)

### Deployment
- [ ] Changes committed with descriptive message
- [ ] Pushed to develop branch
- [ ] Staging URL accessible and functional
- [ ] No errors in deployment logs
"
  fi

  echo "$content"
}

# ─── Main ───────────────────────────────────────────────────────────────────

echo "========================================"
echo "  Cross-Tool Sync: Claude -> Gemini + Codex"
echo "  $(date '+%Y-%m-%d %H:%M:%S')"
echo "========================================"

# ─── Verify source directories ──────────────────────────────────────────────

if [ ! -d "$CLAUDE_DIR/rules" ]; then
  echo "ERROR: $CLAUDE_DIR/rules/ not found"
  exit 1
fi

if [ ! -d "$CLAUDE_DIR/guides" ]; then
  echo "ERROR: $CLAUDE_DIR/guides/ not found"
  exit 1
fi

if [ ! -d "$CLAUDE_DIR/commands" ]; then
  echo "ERROR: $CLAUDE_DIR/commands/ not found"
  exit 1
fi

# ─── Create target directories ──────────────────────────────────────────────

mkdir -p "$GEMINI_DIR/rules"
mkdir -p "$GEMINI_DIR/guides"
mkdir -p "$GEMINI_DIR/commands"
mkdir -p "$CODEX_DIR/guides"
mkdir -p "$CODEX_DIR/skills"

# ─── Sync Rules ─────────────────────────────────────────────────────────────

log_section "RULES"

# Temporary staging for Codex AGENTS.md concatenation
CODEX_AGENTS_STAGING=$(mktemp)
echo "# Engineering Standards" > "$CODEX_AGENTS_STAGING"
echo "" >> "$CODEX_AGENTS_STAGING"
echo "These rules apply to ALL projects. Follow them in every session." >> "$CODEX_AGENTS_STAGING"
echo "" >> "$CODEX_AGENTS_STAGING"

for rule in "${RULES[@]}"; do
  source_file="$CLAUDE_DIR/rules/$rule"
  if [ ! -f "$source_file" ]; then
    log_warn "Source not found: $source_file"
    continue
  fi

  # Gemini: adapted copy
  gemini_content=$(adapt_for_target "$(cat "$source_file")" "gemini")
  echo "$gemini_content" > "$GEMINI_DIR/rules/$rule"
  log_ok "Gemini rules/$rule"
  GEMINI_RULES=$((GEMINI_RULES + 1))

  # Codex: append to staging file
  codex_content=$(adapt_for_target "$(cat "$source_file")" "codex")
  {
    echo "---"
    echo ""
    echo "$codex_content"
    echo ""
  } >> "$CODEX_AGENTS_STAGING"
done

# ─── Sync Guides ────────────────────────────────────────────────────────────

log_section "GUIDES"

for guide in "${GUIDES[@]}"; do
  source_file="$CLAUDE_DIR/guides/$guide"
  if [ ! -f "$source_file" ]; then
    log_warn "Source not found: $source_file"
    continue
  fi

  # Gemini
  gemini_content=$(adapt_for_target "$(cat "$source_file")" "gemini")
  echo "$gemini_content" > "$GEMINI_DIR/guides/$guide"
  log_ok "Gemini guides/$guide"
  GEMINI_GUIDES=$((GEMINI_GUIDES + 1))

  # Codex
  codex_content=$(adapt_for_target "$(cat "$source_file")" "codex")
  echo "$codex_content" > "$CODEX_DIR/guides/$guide"
  log_ok "Codex guides/$guide"
  CODEX_GUIDES=$((CODEX_GUIDES + 1))
done

# ─── Generate GEMINI.md ─────────────────────────────────────────────────────

log_section "GEMINI.md"

{
  echo "# Global Engineering Standards"
  echo ""
  echo "These rules and guides apply to ALL projects. Follow them in every session."
  echo ""
  echo "## Rules (Mandatory)"
  echo ""
  for rule in "${RULES[@]}"; do
    echo "@rules/$rule"
  done
  echo ""
  echo "## Guides (Reference when relevant)"
  echo ""
  echo "Read the relevant guide BEFORE working in that domain:"
  echo ""
  echo "- Database work: @guides/database-patterns.md"
  echo "- Frontend work: @guides/frontend-patterns.md"
  echo "- API integration: @guides/api-integration-patterns.md"
  echo "- Google Auth: @guides/google-auth.md"
  echo "- Testing: @guides/testing-patterns.md"
  echo "- Code performance: @guides/code-performance.md"
  echo "- Deployment: @guides/deployment-protocol.md"
  echo "- Design: @guides/design.md"
  echo "- Legal: @guides/legal.md"
  echo "- RTL/i18n: @guides/rtl-i18n-checklist.md"
  echo "- Review format: @guides/review-submission.md"
  echo "- Roadmap: @guides/roadmap-management.md"
  echo "- PROJECT_STATE updates: @guides/project-state-update.md"
} > "$GEMINI_DIR/GEMINI.md"

log_ok "Generated ~/.gemini/GEMINI.md"

# ─── Generate Codex AGENTS.md ───────────────────────────────────────────────

log_section "CODEX AGENTS.md"

# Add guides reference section
{
  echo "---"
  echo ""
  echo "## Reference Guides"
  echo ""
  echo "The following guides are available at ~/.codex/guides/. Read the relevant guide"
  echo "BEFORE working in that domain:"
  echo ""
  echo "- Database work: ~/.codex/guides/database-patterns.md"
  echo "- Frontend work: ~/.codex/guides/frontend-patterns.md"
  echo "- API integration: ~/.codex/guides/api-integration-patterns.md"
  echo "- Google Auth: ~/.codex/guides/google-auth.md"
  echo "- Testing: ~/.codex/guides/testing-patterns.md"
  echo "- Code performance: ~/.codex/guides/code-performance.md"
  echo "- Deployment: ~/.codex/guides/deployment-protocol.md"
  echo "- Design: ~/.codex/guides/design.md"
  echo "- Legal: ~/.codex/guides/legal.md"
  echo "- RTL/i18n: ~/.codex/guides/rtl-i18n-checklist.md"
  echo "- Review format: ~/.codex/guides/review-submission.md"
  echo "- Roadmap: ~/.codex/guides/roadmap-management.md"
  echo "- PROJECT_STATE updates: ~/.codex/guides/project-state-update.md"
} >> "$CODEX_AGENTS_STAGING"

cp "$CODEX_AGENTS_STAGING" "$CODEX_DIR/AGENTS.md"
rm -f "$CODEX_AGENTS_STAGING"
log_ok "Generated ~/.codex/AGENTS.md ($(wc -c < "$CODEX_DIR/AGENTS.md" | tr -d ' ') bytes)"

# ─── Update Codex config.toml ──────────────────────────────────────────────

log_section "CODEX config.toml"

if [ -f "$CODEX_DIR/config.toml" ]; then
  if ! grep -q 'project_doc_max_bytes' "$CODEX_DIR/config.toml"; then
    # Add after the personality line or at end of top-level keys
    sed -i '' '/^personality/a\
project_doc_max_bytes = 131072
' "$CODEX_DIR/config.toml"
    log_ok "Added project_doc_max_bytes = 131072"
  else
    log_ok "project_doc_max_bytes already set"
  fi
else
  log_warn "config.toml not found at $CODEX_DIR/config.toml"
fi

# ─── Sync Commands ──────────────────────────────────────────────────────────

log_section "COMMANDS"

for cmd in "${COMMANDS[@]}"; do
  source_file="$CLAUDE_DIR/commands/$cmd"
  cmd_name=$(basename "$cmd" .md)

  if [ ! -f "$source_file" ]; then
    log_warn "Source not found: $source_file"
    continue
  fi

  # Read source content and apply single-agent transform for sprint/iterate
  local_content=$(cat "$source_file")
  if [ "$cmd_name" = "sprint" ] || [ "$cmd_name" = "iterate" ]; then
    local_content=$(apply_single_agent_transform "$local_content")
  fi

  # For change-process: remove Phase 7 reference (Gemini/Codex don't sync to themselves)
  if [ "$cmd_name" = "change-process" ]; then
    local_content=$(echo "$local_content" | sed '/## Phase 7: Sync to Gemini and Codex/,/^\*\*If sync script is not found/d')
  fi

  # Write temp file with transformed content for conversion functions
  TEMP_CMD=$(mktemp)
  echo "$local_content" > "$TEMP_CMD"

  # Gemini: TOML
  convert_to_toml "$TEMP_CMD" "$GEMINI_DIR/commands/${cmd_name}.toml"
  log_ok "Gemini commands/${cmd_name}.toml"
  GEMINI_CMDS=$((GEMINI_CMDS + 1))

  # Codex: SKILL.md (skip create-issue, it already exists and was manually crafted)
  if [ "$cmd_name" = "create-issue" ] && [ -f "$CODEX_DIR/skills/create-issue/SKILL.md" ]; then
    log_skip "Codex skills/create-issue (manually maintained)"
  else
    convert_to_skill "$TEMP_CMD" "$CODEX_DIR/skills/$cmd_name"
    log_ok "Codex skills/${cmd_name}/SKILL.md"
    CODEX_SKILLS=$((CODEX_SKILLS + 1))
  fi

  rm -f "$TEMP_CMD"
done

# ─── Remove Claude-Only Commands from Gemini ────────────────────────────────

log_section "CLEANUP"

for toml in "${GEMINI_REMOVE[@]}"; do
  target="$GEMINI_DIR/commands/$toml"
  if [ -f "$target" ]; then
    rm "$target"
    log_ok "Removed Gemini commands/$toml (Claude-only)"
  fi
done

# ─── Summary ────────────────────────────────────────────────────────────────

echo ""
echo "========================================"
echo "  Sync Complete"
echo "========================================"
echo ""
echo "  Gemini (~/.gemini/):"
echo "    Rules:    $GEMINI_RULES files"
echo "    Guides:   $GEMINI_GUIDES files"
echo "    Commands: $GEMINI_CMDS files"
echo "    GEMINI.md: regenerated"
echo ""
echo "  Codex (~/.codex/):"
echo "    AGENTS.md: regenerated ($(wc -c < "$CODEX_DIR/AGENTS.md" | tr -d ' ') bytes)"
echo "    Guides:   $CODEX_GUIDES files"
echo "    Skills:   $CODEX_SKILLS files"
echo ""
echo "  Skipped (Claude-only):"
echo "    Commands: audit, sync-linear, sync-roadmap, v0-feature, v0-new-project"
echo "    Guides:   agent-teams, autonomous-sprint, codex-peer-review,"
echo "              external-model-delegation, parallel-review, retroactive-review,"
echo "              screenshot-orchestration, v0-design-workflow, visual-verification"
echo ""
echo "Done."
