#!/usr/bin/env node

/**
 * v0 Platform API -- Init Chat from GitHub Repo
 *
 * Creates a v0.dev chat initialized with all files from a GitHub repo,
 * then sends a design prompt. v0 sees the full codebase.
 *
 * Zero dependencies -- uses Node built-in fetch (Node 18+).
 *
 * Usage:
 *   node ~/.claude/scripts/v0-init-repo.mjs --repo "https://github.com/user/repo" "Design prompt"
 *   node ~/.claude/scripts/v0-init-repo.mjs --repo "https://github.com/user/repo" --project-id "proj_xxx" "Design prompt"
 *   node ~/.claude/scripts/v0-init-repo.mjs --repo "https://github.com/user/repo" --branch "develop" "Design prompt"
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
  let repo = null
  let branch = null
  let projectId = null
  const promptParts = []

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--repo' && i + 1 < args.length) {
      repo = args[i + 1]
      i += 1
    } else if (args[i] === '--branch' && i + 1 < args.length) {
      branch = args[i + 1]
      i += 1
    } else if (args[i] === '--project-id' && i + 1 < args.length) {
      projectId = args[i + 1]
      i += 1
    } else {
      promptParts.push(args[i])
    }
  }

  const prompt = promptParts.join(' ') || null
  return { repo, branch, projectId, prompt }
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

  const { repo, branch, projectId, prompt } = parseArgs(process.argv)

  if (!repo) {
    console.error('ERROR: --repo is required.')
    console.error('Usage: node v0-init-repo.mjs --repo "https://github.com/user/repo" "design prompt"')
    process.exit(1)
  }

  if (!prompt) {
    console.error('ERROR: Design prompt is required (positional argument).')
    console.error('Usage: node v0-init-repo.mjs --repo "https://github.com/user/repo" "design prompt"')
    process.exit(1)
  }

  console.error('Initializing v0.dev chat from repo...')
  console.error(`  Repo: ${repo}`)
  if (branch) console.error(`  Branch: ${branch}`)
  if (projectId) console.error(`  Project: ${projectId}`)
  console.error(`  Prompt: ${prompt.slice(0, 120)}${prompt.length > 120 ? '...' : ''}`)

  try {
    // Step 1: Init chat from repo
    const initBody = {
      type: 'repo',
      repo: { url: repo, ...(branch ? { branch } : {}) },
      ...(projectId ? { projectId } : {}),
    }

    const initResult = await v0Fetch('/chats', initBody)

    // Response may be { data: { id, webUrl, ... } } or { id, webUrl, ... }
    const chat = initResult.data ?? initResult
    const chatId = chat.id

    if (!chatId) {
      console.error('ERROR: No chat ID in response.')
      console.error('Response:', JSON.stringify(initResult, null, 2))
      process.exit(1)
    }

    console.error(`  Chat created: ${chatId}`)
    console.error('  Sending design prompt...')

    // Step 2: Send the design prompt as a message
    const messageResult = await v0Fetch(`/chats/${chatId}/messages`, {
      message: prompt,
    })

    const updatedChat = messageResult.data ?? messageResult

    // Extract URLs -- try multiple response shapes
    const webUrl = updatedChat.webUrl
      ?? chat.webUrl
      ?? `https://v0.dev/chat/${chatId}`

    const demoUrl = updatedChat.latestVersion?.demoUrl
      ?? chat.latestVersion?.demoUrl
      ?? '(not available yet)'

    // stdout: just the URL (for agent consumption)
    console.log(webUrl)

    // stderr: human-friendly summary
    console.error('')
    console.error('--- v0.dev Chat Created (repo-aware) ---')
    console.error(`  Chat ID:    ${chatId}`)
    console.error(`  Web URL:    ${webUrl}`)
    console.error(`  Demo URL:   ${demoUrl}`)
    if (projectId) console.error(`  Project ID: ${projectId}`)
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
