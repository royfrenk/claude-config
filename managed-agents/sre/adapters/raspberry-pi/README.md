# Raspberry Pi Adapter

Monitors services on Raspberry Pi via SSH over LAN.

## Constraints

- **SSH via `child_process.exec`** — no ssh2 library (project convention)
- **LAN-only** — Pi is on local network, not publicly accessible
- **SSH key auth** — no password authentication
- **Deploy kickoff is NOT SRE's job** — SRE only monitors after deployment

## Connection

From `.sre/config.yaml`:
```yaml
connection:
  host: "pibot"       # hostname or IP
  user: "royfrenk"    # SSH username
```

## Log Sources

| Source | Command |
|--------|---------|
| runtime | `ssh host "journalctl -u service -n N --no-pager"` |
| build | `ssh host "cat /home/user/Repos/Project/build.log"` (if exists) |
| system | `ssh host "journalctl -n N --no-pager"` (all units) |

## Health Checks

1. **systemd service status:** `ssh host "systemctl is-active service"`
2. **HTTP health endpoint:** `fetch("http://pibot.local:PORT/health")` (from Mac, LAN)

## Smoke Tests

| Type | How |
|------|-----|
| `systemd` | `ssh host "systemctl is-active service"` — expects "active" |
| HTTP GET | `fetch(url)` from Mac — expects configured status code |
