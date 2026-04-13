# SRE Managed Agent

Site Reliability Engineer for deployment monitoring and failure analysis.

## Architecture

```
Developer pushes code
    |
Bridge Daemon (Mac-side, Node/TS, sprint-scoped)
    |-- Reads .sre/config.yaml from project root
    |-- Creates Anthropic Session (POST /v1/sessions)
    |-- Connects to SSE event stream
    |-- Dispatches custom tool calls to target-specific adapter
    |
SRE Agent (Anthropic-hosted, target-agnostic)
    |-- fetch_logs, check_health, run_smoke_tests
    |-- analyze_failure, suggest_iterate
    |
Reports back -> sprint file + EM
```

## Session Types

### Deploy Session (Active)
- Created after each Developer push
- Short-lived (minutes)
- Low cost (~$0.05-0.50)

### Watch Session (Deferred)
- Always-on monitoring per environment
- Deferred until Deploy Session cost data proves the value

## Per-Project Opt-In

SRE activates only when `.sre/config.yaml` exists in the project root.

### Config Schema: Vercel + Railway

```yaml
# .sre/config.yaml
target: vercel-railway
environments:
  staging:
    vercel_project_id: "prj_xxxx"
    railway_project_id: "xxxxxxxx-xxxx"
    railway_service_id: "xxxxxxxx-xxxx"
    health_endpoints:
      - "https://staging.example.com/api/health"
    smoke_tests:
      - name: "API responds"
        method: GET
        url: "https://staging.example.com/api/episodes"
        expect_status: 200
  production:
    vercel_project_id: "prj_xxxx"
    railway_project_id: "xxxxxxxx-xxxx"
    railway_service_id: "xxxxxxxx-xxxx"
    health_endpoints:
      - "https://example.com/api/health"
    smoke_tests:
      - name: "API responds"
        method: GET
        url: "https://example.com/api/episodes"
        expect_status: 200
```

### Config Schema: Raspberry Pi

```yaml
# .sre/config.yaml
target: raspberry-pi
connection:
  host: "pibot"
  user: "royfrenk"
  # SSH key auth assumed (no password)
environments:
  production:
    service_name: "joshua"
    repo_path: "/home/royfrenk/Repos/Joshua"
    health_endpoints:
      - "http://pibot.local:3000/health"
    smoke_tests:
      - name: "Service active"
        type: systemd
        service: "joshua"
      - name: "HTTP responds"
        method: GET
        url: "http://pibot.local:3000/health"
        expect_status: 200
```

### Config Schema: macOS Desktop

```yaml
# .sre/config.yaml
target: macos-desktop
environments:
  dev:
    build_system: swift  # or xcode
    project_path: "desktop/MyApp"
    scheme: "MyApp"
    bundle_id: "com.example.myapp"
    smoke_tests:
      - name: "Build succeeds"
        type: swift-build
      - name: "App launches"
        type: process-check
        process_name: "MyApp"
```

## Adapters

All adapters implement the `SREAdapter` interface defined in `adapters/adapter-interface.ts`.

| Adapter | Directory | How It Works |
|---------|-----------|-------------|
| vercel-railway | `adapters/vercel-railway/` | Vercel API + Railway API + HTTP health checks |
| raspberry-pi | `adapters/raspberry-pi/` | SSH via child_process.exec, journalctl, systemctl |
| macos-desktop | `adapters/macos-desktop/` | Swift/Xcode build verification, process checks |

## Bridge Daemon

The bridge daemon (`bridge/daemon.ts`) is a Node/TypeScript process that:

1. Reads `.sre/config.yaml` to determine which adapter to load
2. Creates an Anthropic Session for the SRE agent
3. Connects to the SSE event stream
4. When the SRE agent calls a custom tool (fetch_logs, check_health, etc.):
   - Bridge intercepts the tool call
   - Routes it to the appropriate adapter method
   - Returns the adapter's result back to the session

### Lifecycle

- **Started by:** `/sprint` at sprint start (if `.sre/config.yaml` exists)
- **Stopped by:** `/sprint` at sprint end
- **One bridge per project** — if multiple projects have SRE configs, each gets its own bridge

## Cost Reporting

Every SRE session outputs a cost block that the bridge daemon parses and writes to the sprint file:

```
=== SRE SESSION COST ===
session_id: sess_xxxx
environment: staging
duration_seconds: 45
input_tokens: 12000
output_tokens: 3500
estimated_cost_usd: 0.12
=== END SRE SESSION COST ===
```

Sprint wrap-up aggregates all session costs into an "SRE Monitoring Costs" section.

## Provisioning

### One-Time Setup

1. Create the Anthropic Agent resource from `agent-config.yaml`:
   ```bash
   anthropic agents create --from agent-config.yaml
   # Returns: agent_id: agt_xxxx
   ```

2. Store the agent_id somewhere accessible to the bridge (env var or config file)

3. Install bridge dependencies:
   ```bash
   cd ~/.claude/managed-agents/sre/bridge
   npm install
   ```

### Per-Project Setup

1. Create `.sre/config.yaml` in the project root (see schemas above)
2. The bridge daemon will auto-detect and load the appropriate adapter
