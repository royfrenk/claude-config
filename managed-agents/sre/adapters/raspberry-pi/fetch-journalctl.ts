/**
 * Fetch logs from Raspberry Pi via SSH + journalctl
 *
 * Uses child_process.exec (NOT ssh2 library) per project conventions.
 * Connection details from .sre/config.yaml connection field.
 */

import { exec } from "child_process"
import { promisify } from "util"
import type { LogBundle } from "../adapter-interface.js"

const execAsync = promisify(exec)

export async function fetchJournalctl(
  host: string,
  user: string,
  serviceName: string,
  lines: number,
  filter?: string
): Promise<LogBundle> {
  // TODO: Implement
  // const cmd = `ssh ${user}@${host} "journalctl -u ${serviceName} -n ${lines} --no-pager"`
  // if (filter) append: ` | grep '${filter}'`
  // const { stdout, stderr } = await execAsync(cmd, { timeout: 30000 })

  throw new Error("Not implemented — stub")
}