/**
 * Trigger /iterate suggestion
 *
 * When SRE detects a deployment failure, this creates a suggestion
 * for the EM to run /iterate with failure context.
 *
 * NEVER auto-executes /iterate. Creates a structured suggestion
 * that the EM presents to the user or acts on per auto-iterate policy.
 */

import type { FailureAnalysis } from "../adapter-interface.js"

export interface IterateSuggestion {
  readonly environment: string
  readonly issueId: string | null
  readonly failureCategory: string
  readonly summary: string
  readonly suggestedAction: string
  readonly logExcerpts: string[]
  readonly createdAt: string
}

export function createIterateSuggestion(
  environment: string,
  issueId: string | null,
  analysis: FailureAnalysis
): IterateSuggestion {
  if (environment === "production") {
    throw new Error(
      "NEVER suggest /iterate on production. Escalate to user immediately."
    )
  }

  return {
    environment,
    issueId,
    failureCategory: analysis.category,
    summary: analysis.summary,
    suggestedAction: analysis.suggestedAction,
    logExcerpts: analysis.relevantLogExcerpts,
    createdAt: new Date().toISOString(),
  }
}

export function formatIterateSuggestion(suggestion: IterateSuggestion): string {
  const lines = [
    `## SRE Failure Report`,
    ``,
    `**Environment:** ${suggestion.environment}`,
    `**Issue:** ${suggestion.issueId ?? "N/A"}`,
    `**Category:** ${suggestion.failureCategory}`,
    `**Summary:** ${suggestion.summary}`,
    ``,
    `**Suggested Action:** ${suggestion.suggestedAction}`,
  ]

  if (suggestion.logExcerpts.length > 0) {
    lines.push(``, `**Relevant Logs:**`, "```")
    for (const excerpt of suggestion.logExcerpts) {
      lines.push(excerpt)
    }
    lines.push("```")
  }

  lines.push(``, `**Recommendation:** Run \`/iterate\` to address this failure.`)

  return lines.join("\n")
}
