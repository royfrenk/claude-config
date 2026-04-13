/**
 * HTTP health check for Raspberry Pi service over LAN
 *
 * Runs from Mac (not via SSH) since the Pi is on the local network.
 * Uses native fetch or child_process curl.
 */

import type { HealthCheckResult } from "../adapter-interface.js"

export async function curlHealth(
  url: string,
  timeoutMs: number = 10000
): Promise<HealthCheckResult> {
  // TODO: Implement
  // const controller = new AbortController()
  // const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
  // const response = await fetch(url, { signal: controller.signal })
  // clearTimeout(timeoutId)
  // return { name: `http:${url}`, passed: response.ok, detail: `${response.status}` }

  throw new Error("Not implemented — stub")
}