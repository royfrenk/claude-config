#!/usr/bin/env node

/**
 * v0 Platform API — Create Feature Chat in Existing Project
 *
 * Creates a v0.dev chat within an existing project, so v0 sees
 * the project's files and context.
 *
 * Usage:
 *   node ~/.claude/scripts/v0-feature-chat.mjs --project-id "proj_xxx" "Add a settings page"
 *   node ~/.claude/scripts/v0-feature-chat.mjs --project-id "proj_xxx" --system "Custom system prompt" "Feature prompt"
 *
 * Environment:
 *   V0_API_KEY — Required.
 */

import { v0 } from 'v0-sdk'

function parseArgs(argv) {
  const args = argv.slice(2)
  let projectId = null
  let system = null
  let prompt = null

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--project-id' && i + 1 < args.length) {
      projectId = args[i + 1]
      i += 1
    } else if (args[i] === '--system' && i + 1 < args.length) {
      system = args[i + 1]
      i += 1
    } else if (!prompt) {
      prompt = args[i]
    }
  }

  return { projectId, system, prompt }
}

async function main() {
  const apiKey = process.env.V0_API_KEY
  if (!apiKey) {
    console.error('ERROR: V0_API_KEY environment variable is not set.')
    process.exit(1)
  }

  const { projectId, system, prompt } = parseArgs(process.argv)

  if (!projectId) {
    console.error('ERROR: --project-id is required.')
    console.error('Usage: node v0-feature-chat.mjs --project-id "proj_xxx" "feature description"')
    process.exit(1)
  }

  if (!prompt) {
    console.error('ERROR: Feature description is required.')
    console.error('Usage: node v0-feature-chat.mjs --project-id "proj_xxx" "feature description"')
    process.exit(1)
  }

  console.error('Creating v0.dev feature chat...')
  console.error(`  Project: ${projectId}`)
  console.error(`  Prompt: ${prompt.slice(0, 100)}${prompt.length > 100 ? '...' : ''}`)
  if (system) console.error(`  System: ${system.slice(0, 80)}...`)

  try {
    const params = {
      message: prompt,
      projectId,
      ...(system ? { system } : {}),
    }

    const chat = await v0.chats.create(params)

    const webUrl = chat.webUrl
    const demoUrl = chat.latestVersion?.demoUrl ?? '(not available yet)'

    console.log(webUrl)

    console.error('')
    console.error('--- v0.dev Feature Chat Created ---')
    console.error(`  Chat ID:    ${chat.id}`)
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
