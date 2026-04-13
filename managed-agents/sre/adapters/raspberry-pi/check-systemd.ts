/**
 * Check systemd service status on Raspberry Pi via SSH
 *
 * Runs: ssh host "systemctl is-active service"
 * Returns: "active", "inactive", "failed", etc.
 */

import { exec } from "child_process"
import { promisify } from "util"
import type { HealthCheckResult } from "../adapter-interface.js"

const execAsync = promisify(exec)

export async function checkSystemd(
  host: string,
  user: string,
  serviceName: string
): Promise<HealthCheckResult> {
  // TODO: Implement
  // const cmd = `ssh ${user}@${host} "systemctl is-active ${serviceName}"`
  // const { stdout } = await execAsync(cmd, { timeout: 10000 })
  // const status = stdout.trim()
  // return { name: `systemd:${serviceName}`, passed: status === "active", detail: status }

  throw new Error("Not implemented — stub")
}