#!/usr/bin/env node

/**
 * v0 Platform API -- Send Follow-Up Message to Existing Chat
 *
 * Posts a new message to an existing v0.dev chat, so you can iterate
 * on a design without starting a new chat.
 *
 * Zero dependencies -- uses Node built-in fetch (Node 18+).
 *
 * Usage:
 *   node ~/.claude/scripts/v0-send-message.mjs --chat-id "nCxJb1i9fp2" "Refine the hero with these changes..."
 *
 * Environment:
 *   V0_API_KEY -- Required.
 */

const V0_API_BASE = 'https://api.v0.dev/v1'

function parseArgs(argv) {
  const args = argv.slice(2)
  let chatId = null
  const promptParts = []

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--chat-id' && i + 1 < args.length) {
      chatId = args[i + 1]
      i += 1
    } else {
      promptParts.push(args[i])
    }
  }

  const message = promptParts.join(' ') || null
  return { chatId, message }
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
    process.exit(1)
  }

  const { chatId, message } = parseArgs(process.argv)

  if (!chatId) {
    console.error('ERROR: --chat-id is required.')
    process.exit(1)
  }

  if (!message) {
    console.error('ERROR: message is required (positional argument).')
    process.exit(1)
  }

  console.error('Sending follow-up message to v0 chat...')
  console.error(`  Chat ID: ${chatId}`)
  console.error(`  Message: ${message.slice(0, 120)}${message.length > 120 ? '...' : ''}`)

  try {
    const result = await v0Fetch(`/chats/${chatId}/messages`, { message })

    const data = result.data ?? result
    const webUrl = data.webUrl ?? `https://v0.dev/chat/${chatId}`
    const demoUrl = data.latestVersion?.demoUrl ?? '(not available yet)'

    console.log(webUrl)

    console.error('')
    console.error('--- Message Sent ---')
    console.error(`  Chat ID:  ${chatId}`)
    console.error(`  Web URL:  ${webUrl}`)
    console.error(`  Demo URL: ${demoUrl}`)
    console.error('')
    console.error('Open the Web URL to review v0\'s response.')
  } catch (error) {
    console.error(`ERROR: Failed to send message: ${error.message}`)
    if (error.message.includes('401') || error.message.includes('auth')) {
      console.error('Check V0_API_KEY is valid.')
    }
    process.exit(1)
  }
}

main()
