/**
 * SRE Bridge Daemon
 *
 * Node/TypeScript daemon that bridges between Anthropic Managed Agent sessions
 * and local SRE adapters. Started by /sprint at sprint start, stopped at sprint end.
 *
 * Lifecycle:
 * 1. Read .sre/config.yaml from project root
 * 2. Load appropriate adapter (vercel-railway, raspberry-pi, macos-desktop)
 * 3. When Developer pushes: create Anthropic Session for SRE agent
 * 4. Connect to SSE event stream
 * 5. Dispatch custom tool calls to adapter methods
 * 6. Parse cost block from session output
 * 7. Write results to sprint file
 */

import { readFileSync } from "fs"
import { resolve } from "path"
import * as yaml from "js-yaml"
import type {
  SreProjectConfig,
  DeployContext,
  LogBundle,
  HealthStatus,
  SmokeTestResult,
} from "../adapters/adapter-interface.js"
import { loadAdapter } from "./adapter-loader.js"

interface DaemonConfig {
  readonly projectRoot: string
  readonly agentId: string
  readonly sreConfig: SreProjectConfig
}

function loadSreConfig(projectRoot: string): SreProjectConfig {
  const configPath = resolve(projectRoot, ".sre", "config.yaml")
  const raw = readFileSync(configPath, "utf-8")
  const parsed = yaml.load(raw) as SreProjectConfig

  if (!parsed.target) {
    throw new Error(`.sre/config.yaml missing required field: target`)
  }

  const validTargets = ["vercel-railway", "raspberry-pi", "macos-desktop"] as const
  if (!validTargets.includes(parsed.target)) {
    throw new Error(
      `.sre/config.yaml has invalid target: "${parsed.target}". ` +
      `Expected one of: ${validTargets.join(", ")}`
    )
  }

  return parsed
}

async function handleToolCall(
  toolName: string,
  toolInput: Record<string, unknown>,
  context: DeployContext,
  adapter: Awaited<ReturnType<typeof loadAdapter>>
): Promise<unknown> {
  switch (toolName) {
    case "fetch_logs": {
      const source = (toolInput.source as string) ?? "runtime"
      const lines = (toolInput.lines as number) ?? 100
      const filter = toolInput.filter as string | undefined
      return adapter.fetchLogs(context, source, lines, filter)
    }
    case "check_health": {
      const endpoints = toolInput.endpoints as string[] | undefined
      return adapter.checkHealth(context, endpoints)
    }
    case "run_smoke_tests": {
      const suite = (toolInput.suite as "quick" | "full") ?? "quick"
      return adapter.runSmokeTests(context, suite)
    }
    case "analyze_failure": {
      // analyze_failure uses previously collected data
      // In a real implementation, we'd cache logs/health/smoke from prior calls
      const emptyLogs: LogBundle[] = []
      const emptyHealth: HealthStatus = {
        healthy: false,
        checks: [],
        checkedAt: new Date().toISOString(),
      }
      const emptySmoke: SmokeTestResult = {
        passed: false,
        tests: [],
        runAt: new Date().toISOString(),
      }
      return adapter.analyzeFailure(emptyLogs, emptyHealth, emptySmoke)
    }
    case "suggest_iterate": {
      // This is handled by the shared trigger-iterate-suggestion module
      // Bridge passes the suggestion back to the sprint file
      return {
        suggestion_created: true,
        failure_summary: toolInput.failure_summary,
        failure_category: toolInput.failure_category,
        suggested_action: toolInput.suggested_action,
      }
    }
    default:
      throw new Error(`Unknown tool: ${toolName}`)
  }
}

function parseCostBlock(sessionOutput: string): Record<string, string> | null {
  const startMarker = "=== SRE SESSION COST ==="
  const endMarker = "=== END SRE SESSION COST ==="
  const startIdx = sessionOutput.indexOf(startMarker)
  const endIdx = sessionOutput.indexOf(endMarker)

  if (startIdx === -1 || endIdx === -1) {
    return null
  }

  const block = sessionOutput.slice(startIdx + startMarker.length, endIdx).trim()
  const result: Record<string, string> = {}

  for (const line of block.split("\n")) {
    const colonIdx = line.indexOf(":")
    if (colonIdx > 0) {
      const key = line.slice(0, colonIdx).trim()
      const value = line.slice(colonIdx + 1).trim()
      result[key] = value
    }
  }

  return result
}

// Entry point — called when bridge is started
export async function startDaemon(config: DaemonConfig): Promise<void> {
  const { projectRoot, agentId, sreConfig } = config
  const adapter = await loadAdapter(sreConfig)

  console.log(`[SRE Bridge] Started for ${adapter.targetName}`)
  console.log(`[SRE Bridge] Project: ${projectRoot}`)
  console.log(`[SRE Bridge] Agent ID: ${agentId}`)
  console.log(`[SRE Bridge] Waiting for deploy session requests...`)

  // TODO: Implement SSE connection to Anthropic Sessions API
  // 1. POST /v1/sessions with agent_id to create session
  // 2. Connect to SSE stream
  // 3. On tool_call events, call handleToolCall()
  // 4. POST tool results back to session
  // 5. On session end, parse cost block from output
  // 6. Write cost + results to sprint file
}

// CLI entry point
const projectRoot = process.argv[2]
if (projectRoot) {
  const sreConfig = loadSreConfig(projectRoot)
  const agentId = process.env.SRE_AGENT_ID ?? ""

  if (!agentId) {
    console.error("[SRE Bridge] SRE_AGENT_ID environment variable required")
    process.exit(1)
  }

  startDaemon({ projectRoot, agentId, sreConfig }).catch((error) => {
    console.error("[SRE Bridge] Fatal error:", error)
    process.exit(1)
  })
}

export { loadSreConfig, handleToolCall, parseCostBlock }
