#!/usr/bin/env node

/**
 * v0 Platform API — Init Chat from GitHub Repo
 *
 * Creates a v0.dev chat initialized with all files from a GitHub repo,
 * then sends a design prompt. v0 sees the full codebase.
 *
 * Usage:
 *   node ~/.claude/scripts/v0-init-repo.mjs --repo "https://github.com/user/repo" "Design prompt"
 *   node ~/.claude/scripts/v0-init-repo.mjs --repo "https://github.com/user/repo" --project-id "proj_xxx" "Design prompt"
 *   node ~/.claude/scripts/v0-init-repo.mjs --repo "https://github.com/user/repo" --branch "develop" "Design prompt"
 *
 * Environment:
 *   V0_API_KEY — Required.
 *
 * Output:
 *   stdout: v0.dev webUrl (agent-friendly)
 *   stderr: metadata (human-friendly)
 */

import { v0 } from 'v0-sdk'

function parseArgs(argv) {
  const args = argv.slice(2)
  let repo = null
  let branch = null
  let projectId = null
  let prompt = null

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
    } else if (!prompt) {
      prompt = args[i]
    }
  }

  return { repo, branch, projectId, prompt }
}

async function main() {
  const apiKey = process.env.V0_API_KEY
  if (!apiKey) {
    console.error('ERROR: V0_API_KEY environment variable is not set.')
    process.exit(1)
  }

  const { repo, branch, projectId, prompt } = parseArgs(process.argv)

  if (!repo) {
    console.error('ERROR: --repo is required.')
    console.error('Usage: node v0-init-repo.mjs --repo "https://github.com/user/repo" "design prompt"')
    process.exit(1)
  }

  if (!prompt) {
    console.error('ERROR: Design prompt is required.')
    console.error('Usage: node v0-init-repo.mjs --repo "https://github.com/user/repo" "design prompt"')
    process.exit(1)
  }

  console.error('Initializing v0.dev chat from repo...')
  console.error(`  Repo: ${repo}`)
  if (branch) console.error(`  Branch: ${branch}`)
  if (projectId) console.error(`  Project: ${projectId}`)
  console.error(`  Prompt: ${prompt.slice(0, 100)}${prompt.length > 100 ? '...' : ''}`)

  try {
    const initParams = {
      type: 'repo',
      repo: { url: repo, ...(branch ? { branch } : {}) },
      ...(projectId ? { projectId } : {}),
    }

    const chat = await v0.chats.init(initParams)
    const chatId = chat.id

    console.error(`  Chat created: ${chatId}`)
    console.error('  Sending design prompt...')

    const updatedChat = await v0.chats.sendMessage({
      chatId,
      message: prompt,
    })

    const webUrl = updatedChat.webUrl ?? chat.webUrl
    const demoUrl = updatedChat.latestVersion?.demoUrl ?? '(not available yet)'

    console.log(webUrl)

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
