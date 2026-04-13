/**
 * Raspberry Pi SRE Adapter
 *
 * Monitors services on Raspberry Pi via SSH.
 * Uses child_process.exec for SSH commands (no ssh2 library).
 * Supports journalctl for logs, systemctl for service health,
 * and HTTP requests for LAN health checks.
 */

import type {
  SREAdapter,
  DeployContext,
  LogBundle,
  HealthStatus,
  SmokeTestResult,
  FailureAnalysis,
} from "../adapter-interface.js"

export class RaspberryPiAdapter implements SREAdapter {
  readonly targetName = "raspberry-pi" as const

  async fetchLogs(
    context: DeployContext,
    source: string,
    lines: number,
    filter?: string
  ): Promise<LogBundle[]> {
    // TODO: Implement using fetchJournalctl
    // ssh host "journalctl -u service -n lines --no-pager"
    // Optional: pipe through grep filter
    throw new Error("Not implemented — stub adapter")
  }

  async checkHealth(
    context: DeployContext,
    endpoints?: string[]
  ): Promise<HealthStatus> {
    // TODO: Implement
    // 1. Check systemd service status via checkSystemd
    // 2. Check HTTP health endpoints via curlHealth
    // 3. Return aggregate health status
    throw new Error("Not implemented — stub adapter")
  }

  async runSmokeTests(
    context: DeployContext,
    suite: "quick" | "full"
  ): Promise<SmokeTestResult> {
    // TODO: Implement
    // - type=systemd: ssh host "systemctl is-active service"
    // - type=http: curl health endpoint from Mac (LAN)
    throw new Error("Not implemented — stub adapter")
  }

  async analyzeFailure(
    logs: LogBundle[],
    health: HealthStatus,
    smoke: SmokeTestResult
  ): Promise<FailureAnalysis> {
    // TODO: Implement
    // Pi-specific failure patterns:
    // - "ENOSPC" -> disk full
    // - "ECONNREFUSED" -> service not running
    // - "MODULE_NOT_FOUND" -> missing dependency (npm install needed)
    throw new Error("Not implemented — stub adapter")
  }
}
