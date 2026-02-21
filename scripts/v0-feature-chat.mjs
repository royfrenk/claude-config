#!/usr/bin/env node

/**
 * v0 Platform API -- Create Feature Chat in Existing Project
 *
 * Creates a v0.dev chat within an existing project, so v0 sees
 * the project's files and context.
 *
 * Zero dependencies -- uses Node built-in fetch (Node 18+).
 *
 * Usage:
 *   node ~/.claude/scripts/v0-feature-chat.mjs --project-id "proj_xxx" "Add a settings page"
 *   node ~/.claude/scripts/v0-feature-chat.mjs --project-id "proj_xxx" --system "Custom system prompt" "Feature prompt"
 *
 * Environment:
 *   V0_API_KEY -- Required.
 *
 * Output:
 *   stdout: v0.dev webUrl (agent-friendly)
 *   stderr: metadata (human-friendly)
 */

const V0_API_BASE = 'https://api.v0.dev/v1'

function parseArgs(argv) {
  const args = argv.slice(2)
  let projectId = null
  let system = null
  const promptParts = []

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--project-id' && i + 1 < args.length) {
      projectId = args[i + 1]
      i += 1
    } else if (args[i] === '--system' && i + 1 < args.length) {
      system = args[i + 1]
      i += 1
    } else {
      promptParts.push(args[i])
    }
  }

  const prompt = promptParts.join(' ') || null
  return { projectId, system, prompt }
}

async function v0Fetch(path, body) {
  const apiKey = process.env.V0_API_KEY

  const response = await fetch(`${V0_API_BASE}${path}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const text = await response.text().catch(() => 'no response body')
    throw new Error(`v0 API ${response.status}: ${text}`)
  }

  return response.json()
}

async function main() {
  const apiKey = process.env.V0_API_KEY
  if (!apiKey) {
    console.error('ERROR: V0_API_KEY environment variable is not set.')
    console.error('Add to ~/.zshrc:  export V0_API_KEY="v0_..."')
    process.exit(1)
  }

  const { projectId, system, prompt } = parseArgs(process.argv)

  if (!projectId) {
    console.error('ERROR: --project-id is required.')
    console.error('Usage: node v0-feature-chat.mjs --project-id "proj_xxx" "feature description"')
    process.exit(1)
  }

  if (!prompt) {
    console.error('ERROR: Feature description is required (positional argument).')
    console.error('Usage: node v0-feature-chat.mjs --project-id "proj_xxx" "feature description"')
    process.exit(1)
  }

  console.error('Creating v0.dev feature chat...')
  console.error(`  Project: ${projectId}`)
  console.error(`  Prompt: ${prompt.slice(0, 120)}${prompt.length > 120 ? '...' : ''}`)
  if (system) console.error(`  System: ${system.slice(0, 80)}...`)

  try {
    const body = {
      message: prompt,
      projectId,
      ...(system ? { system } : {}),
    }

    const result = await v0Fetch('/chats', body)

    // Response may be { data: { id, webUrl, ... } } or { id, webUrl, ... }
    const chat = result.data ?? result
    const chatId = chat.id

    if (!chatId) {
      console.error('ERROR: No chat ID in response.')
      console.error('Response:', JSON.stringify(result, null, 2))
      process.exit(1)
    }

    const webUrl = chat.webUrl ?? `https://v0.dev/chat/${chatId}`
    const demoUrl = chat.latestVersion?.demoUrl ?? '(not available yet)'

    // stdout: just the URL (for agent consumption)
    console.log(webUrl)

    // stderr: human-friendly summary
    console.error('')
    console.error('--- v0.dev Feature Chat Created ---')
    console.error(`  Chat ID:    ${chatId}`)
    console.error(`  Project ID: ${projectId}`)
    console.error(`  Web URL:    ${webUrl}`)
    console.error(`  Demo URL:   ${demoUrl}`)
    console.error('')
    console.error('Open the Web URL in your browser to iterate visually.')
    console.error('When done, tell the agent: "v0 is ready"')
  } catch (error) {
    console.error(`ERROR: Failed to create v0 chat: ${error.message}`)
    if (error.message.includes('401') || error.message.includes('auth')) {
      console.error('Check that your V0_API_KEY is valid and has Platform API access.')
    }
    process.exit(1)
  }
}

main()
