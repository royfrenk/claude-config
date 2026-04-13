/**
 * SRE Adapter Interface
 *
 * All deployment-target adapters implement this interface.
 * The bridge daemon loads the appropriate adapter based on .sre/config.yaml
 * and dispatches custom tool calls to these methods.
 */

export interface DeployContext {
  readonly projectRoot: string
  readonly environment: string
  readonly issueId: string | null
  readonly config: SreProjectConfig
  readonly sessionId: string
}

export interface SreProjectConfig {
  readonly target: "vercel-railway" | "raspberry-pi" | "macos-desktop"
  readonly environments: Record<string, EnvironmentConfig>
  readonly connection?: ConnectionConfig
}

export interface ConnectionConfig {
  readonly host: string
  readonly user: string
}

export interface EnvironmentConfig {
  readonly health_endpoints?: string[]
  readonly smoke_tests?: SmokeTestConfig[]
  readonly [key: string]: unknown
}

export interface SmokeTestConfig {
  readonly name: string
  readonly type?: string
  readonly method?: string
  readonly url?: string
  readonly expect_status?: number
  readonly service?: string
  readonly process_name?: string
}

export interface LogBundle {
  readonly source: string
  readonly lines: string[]
  readonly fetchedAt: string
  readonly truncated: boolean
  readonly metadata: Record<string, string>
}

export interface HealthStatus {
  readonly healthy: boolean
  readonly checks: ReadonlyArray<HealthCheckResult>
  readonly checkedAt: string
}

export interface HealthCheckResult {
  readonly name: string
  readonly passed: boolean
  readonly detail: string
}

export interface SmokeTestResult {
  readonly passed: boolean
  readonly tests: ReadonlyArray<SmokeTestCase>
  readonly runAt: string
}

export interface SmokeTestCase {
  readonly name: string
  readonly passed: boolean
  readonly error: string | null
  readonly durationMs: number
}

export interface FailureAnalysis {
  readonly category: FailureCategory
  readonly summary: string
  readonly suggestedAction: string
  readonly relevantLogExcerpts: string[]
}

export type FailureCategory =
  | "build"
  | "runtime"
  | "health"
  | "smoke"
  | "config"
  | "unknown"

export interface SREAdapter {
  readonly targetName: "vercel-railway" | "raspberry-pi" | "macos-desktop"

  fetchLogs(context: DeployContext, source: string, lines: number, filter?: string): Promise<LogBundle[]>

  checkHealth(context: DeployContext, endpoints?: string[]): Promise<HealthStatus>

  runSmokeTests(context: DeployContext, suite: "quick" | "full"): Promise<SmokeTestResult>

  analyzeFailure(
    logs: LogBundle[],
    health: HealthStatus,
    smoke: SmokeTestResult
  ): Promise<FailureAnalysis>
}
