# Platform Access Registry

Single authoritative source for CLI infrastructure operations. For deploy-specific commands (push, rollback), see `~/.claude/guides/deployment-protocol.md`.

## Platforms

| Platform | CLI Command | Auth | Last Verified |
|----------|-------------|------|---------------|
| Railway | `railway` | Logged in (royfrenk@gmail.com) | 2026-04-12 |
| Vercel | `vercel` | Logged in | 2026-04-12 |
| Supabase | Direct DB via `asyncpg` | Creds in `backend/.env` | 2026-04-12 |
| Pi (SSH) | `ssh royfrenk@pibot.tail6eaf43.ts.net` | Tailscale auth | 2026-04-12 |
| Cloudflare | `cloudflared` (on Pi) | Tunnel service on Pi | 2026-04-12 |

## Dynamic Verification

Before assuming CLI access, verify:

```bash
which railway && railway whoami
which vercel && vercel whoami
ssh -o ConnectTimeout=5 royfrenk@pibot.tail6eaf43.ts.net "echo ok"
```

If a command is not found, check if it can be installed (`brew install`, `npm i -g`, etc.) before escalating.

## Common Operations

### Railway

| Operation | Command |
|-----------|---------|
| List env vars | `railway variables` |
| Set env var | `railway variables set KEY=VALUE` |
| List services | `railway service list` |
| Restart service | `railway service restart` |
| Redeploy | `railway redeploy` |
| View logs | `railway logs` |
| Check status | `railway status` |

### Vercel

| Operation | Command |
|-----------|---------|
| List env vars | `vercel env ls` |
| Add env var | `vercel env add KEY` |
| View logs | `vercel logs <URL>` |
| Inspect deployment | `vercel inspect <URL>` |
| Issue SSL cert | `vercel certs issue <domain>` |
| Add domain | `vercel domains add <domain>` |

### Supabase (Direct DB)

Access via `asyncpg` with connection string from `backend/.env` (`DATABASE_URL`). Use `statement_cache_size=0` for pooler connections.

```bash
# Quick query from backend directory
cd backend && source venv/bin/activate
python -c "import asyncio; from app.db import get_db; ..."
```

### Pi (SSH)

| Operation | Command |
|-----------|---------|
| Connect | `ssh royfrenk@pibot.tail6eaf43.ts.net` |
| Connect (local) | `ssh royfrenk@pibot.local` |
| YT relay status | `ssh ... "systemctl status yt-transcript-relay"` |
| YT relay restart | `ssh ... "sudo systemctl restart yt-transcript-relay"` |
| Tunnel status | `ssh ... "systemctl status cloudflared-tunnel"` |
| Tunnel URL | `ssh ... "journalctl -u cloudflared-tunnel -n 20"` |

### Cloudflare (via Pi)

Cloudflare tunnel runs on the Pi as a systemd service. Manage via SSH:

```bash
ssh royfrenk@pibot.tail6eaf43.ts.net "sudo systemctl restart cloudflared-tunnel"
```

Note: Quick tunnel URL changes on restart — check `journalctl` output for new URL.

## Escalation Protocol

**When to escalate to the user:**
- CLI tool not installed AND cannot be installed (e.g., requires admin access)
- Auth expired and re-auth requires browser OAuth flow
- Dashboard-only settings (no CLI equivalent)
- Billing changes
- Production destructive operations (per deployment protocol)

**Escalation format:**
1. State exactly what you need done
2. Explain why CLI cannot do it
3. Specify what the user should provide (key, token, approval)

Example: "I need to set RESEND_API_KEY on Railway. I can run `railway variables set RESEND_API_KEY=<value>` but I don't have the API key itself. Please provide the Resend API key and I'll set it."

## Adding New Platform Access

When a new platform CLI becomes available:
1. Verify CLI is installed and authenticated
2. Add it to the platform table above
3. Add a Common Operations section with key commands
4. Set "Last Verified" date

## SRE Exemption

SRE agent uses its own `.sre/config.yaml` for health checks and log commands. This guide covers provisioning and config operations that SRE does not perform.
