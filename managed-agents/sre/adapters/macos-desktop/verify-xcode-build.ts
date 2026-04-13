/**
 * Verify Xcode build
 *
 * Runs: xcodebuild with scheme from config
 * Captures build output for log analysis
 */

import { exec } from "child_process"
import { promisify } from "util"
import type { SmokeTestCase } from "../adapter-interface.js"

const execAsync = promisify(exec)

export async function verifyXcodeBuild(
  projectPath: string,
  scheme: string
): Promise<SmokeTestCase> {
  // TODO: Implement
  // const cmd = `cd ${projectPath} && xcodebuild -scheme ${scheme} build 2>&1 | tail -20`
  // const start = Date.now()
  // const { stdout } = await execAsync(cmd, { timeout: 300000 })
  // const durationMs = Date.now() - start
  // const passed = stdout.includes("BUILD SUCCEEDED")
  // return { name: "xcode-build", passed, error: passed ? null : stdout.slice(-500), durationMs }

  throw new Error("Not implemented — stub")
}
