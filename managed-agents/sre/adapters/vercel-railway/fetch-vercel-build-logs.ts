/**
 * Fetch Vercel build logs via Vercel API
 *
 * Uses: GET /v6/deployments/{deploymentId}/events
 * Requires: VERCEL_TOKEN environment variable
 */

import type { LogBundle } from "../adapter-interface.js"

export async function fetchVercelBuildLogs(
  projectId: string,
  lines: number,
  filter?: string
): Promise<LogBundle> {
  // TODO: Implement
  // 1. Get latest deployment: GET /v6/deployments?projectId={projectId}&limit=1
  // 2. Get deployment events: GET /v6/deployments/{id}/events
  // 3. Filter and truncate to `lines`
  // 4. Apply grep filter if provided

  throw new Error("Not implemented — stub")
}
