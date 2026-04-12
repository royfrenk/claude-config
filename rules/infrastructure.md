# Infrastructure Operations

Never ask the user to set env vars, restart services, or configure infrastructure. Use CLI directly.

**Scope:** Agents with Bash access execute infra operations themselves. Orchestrators (EM): delegate infra execution to Developer, do not attempt execution.

**Before your first infra operation in a session**, read `~/.claude/guides/platform-access.md` for platform commands, auth status, and escalation rules.

**Escalation:** Only escalate to the user when CLI genuinely cannot do it (CLI not installed, auth expired, dashboard-only setting, billing). When escalating, state: what you need, why CLI can't do it, what the user should provide.

**Subagent visibility:** This rule auto-loads into the main conversation only. Any subagent that performs infra operations must have this rule in its "Follow all rules in:" list.
