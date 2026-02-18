# External Model Delegation Guide

## Purpose

When Claude's iterations get stuck on a bug (3+ failed attempts or manual request), delegate to an external AI model for a fresh perspective. The external model reads a context file, suggests a fix, and the delegate agent implements it.

**This is NOT a replacement for Claude's Developer agent.** It is a fallback for when iteration is stuck.

---

## Supported Models

| Model Name | Provider | API | Default Variant | Env Variable | Cost |
|------------|----------|-----|-----------------|--------------|------|
| `codex` | OpenAI | CLI (`openai api`) | `gpt-4o` | `OPENAI_API_KEY` | ~$0.01-0.10/call |
| `gemini` | Google | REST API (curl) | `gemini-2.5-pro` | `GEMINI_API_KEY` | ~$0.01-0.15/call |

**Override model variant:** Set `EXTERNAL_MODEL_OVERRIDE` env var before calling.

```bash
# Example: use gpt-4o-mini instead of gpt-4o
EXTERNAL_MODEL_OVERRIDE=gpt-4o-mini ~/.claude/scripts/external-model-call.sh codex docs/external-model-context.md
```

---

## Adding a New Model

To add support for a new model:

1. **Edit `~/.claude/scripts/external-model-call.sh`:**
   - Add a new `case` block for the model name
   - Implement the API call (prefer curl over language-specific SDKs)
   - Extract the response text and write to `$RESPONSE_FILE`

2. **Update this guide:**
   - Add row to Supported Models table
   - Document any model-specific quirks
   - Add troubleshooting entry

3. **No other files need changes** — the agent and command are model-agnostic.

---

## Flow

```
/iterate detects trigger (circuit breaker OR --model flag)
    |
    v
Spawn external-model-delegate agent
    |
    v
Agent reads: sprint file, spec file, relevant source files
    |
    v
Agent generates: docs/external-model-context.md
    |
    v
Agent calls: ~/.claude/scripts/external-model-call.sh <model> <context-file>
    |
    v
Script writes: docs/external-model-response.md
    |
    v
Agent reads response, implements the suggested fix
    |
    v
Agent runs verification (build, types, lint, tests)
    |
    v
Agent reports back to /iterate
    |
    v
/iterate continues normal flow (Reviewer gate, deploy)
```

---

## Context File Best Practices

The quality of the external model's suggestion depends heavily on the context file.

**Always include:**
- Bug description (what's wrong, what should happen)
- Failed approaches (what was tried and why it didn't work)
- The actual source files where the bug lives (full file if <200 lines)
- Acceptance criteria from the spec file

**Include when relevant:**
- Related files (imports, shared types, API contracts)
- Error messages or stack traces
- Test files that are failing

**Omit:**
- Unrelated source files
- Build configuration (unless the bug is build-related)
- Documentation files
- Sprint management details

**Size target:** Under 30K tokens. If over, trim non-essential files to relevant sections only.

---

## Temporary Files

| File | Created By | Deleted When |
|------|-----------|--------------|
| `docs/external-model-context.md` | Delegate agent | After fix is reviewed and merged |
| `docs/external-model-response.md` | Script | After fix is reviewed and merged |

These are working files. They should NOT be committed to git. Add to `.gitignore` if not already covered.

---

## Troubleshooting

### "OPENAI_API_KEY not set"

```bash
# Add to ~/.zshrc
export OPENAI_API_KEY="sk-proj-..."
source ~/.zshrc
```

### "GEMINI_API_KEY not set"

```bash
# Add to ~/.zshrc
export GEMINI_API_KEY="..."
source ~/.zshrc
```

### "Unsupported model: xyz"

Only models listed in the Supported Models table are available. To add a new one, see "Adding a New Model" above.

### External model gives unhelpful suggestion

This happens. The delegate agent reports back to /iterate, and you can:
- Try a different model: `/iterate --model codex`
- Return to normal iteration (Claude tries again with fresh context)
- Provide more guidance to narrow down the issue

### Context file too large

If the script warns about token count:
1. Delegate agent should trim to most relevant sections
2. Use line ranges instead of full files for large files
3. Summarize utility/helper files instead of including verbatim

### Gemini API returns error

Common causes:
- Invalid API key (regenerate at console.cloud.google.com)
- Model not available in your region
- Rate limit exceeded (wait and retry)

### OpenAI API returns error

Common causes:
- Expired API key (check at platform.openai.com)
- Insufficient credits
- Rate limit exceeded (wait and retry)

---

## Cost Tracking

The delegate agent's report includes which model was called. /iterate logs this in the sprint file iteration log.

**Estimated costs per call:**

| Model | Input (30K tokens) | Output (4K tokens) | Total |
|-------|--------------------|--------------------|-------|
| gpt-4o | ~$0.08 | ~$0.04 | ~$0.12 |
| gpt-4o-mini | ~$0.005 | ~$0.002 | ~$0.007 |
| gemini-2.5-pro | ~$0.04 | ~$0.04 | ~$0.08 |

**Expected frequency:** 0-2 calls per sprint (only when stuck).

---

## Related Documentation

- `~/.claude/commands/iterate.md` — Command that triggers delegation
- `~/.claude/agents/external-model-delegate.md` — Agent that executes delegation
- `~/.claude/scripts/external-model-call.sh` — Script that calls external APIs
- `~/.claude/guides/codex-peer-review.md` — Similar pattern (external model for review)
