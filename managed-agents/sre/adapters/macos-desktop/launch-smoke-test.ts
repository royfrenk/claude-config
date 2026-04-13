/**
 * Smoke test: verify app process launches
 *
 * Uses pgrep to check if the process is running after build.
 */

import { exec } from "child_process"
import { promisify } from "util"
import type { SmokeTestCase } from "../adapter-interface.js"

const execAsync = promisify(exec)

export async function launchSmokeTest(
  processName: string
): Promise<SmokeTestCase> {
  // TODO: Implement
  // const start = Date.now()
  // try {
  //   await execAsync(`pgrep -x "${processName}"`, { timeout: 5000 })
  //   return { name: `process:${processName}`, passed: true, error: null, durationMs: Date.now() - start }
  // } catch {
  //   return { name: `process:${processName}`, passed: false, error: "Process not found", durationMs: Date.now() - start }
  // }

  throw new Error("Not implemented — stub")
}
