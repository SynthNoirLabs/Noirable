import 'server-only'
import fs from 'fs'
import path from 'path'
import os from 'os'
import { createOpenAI } from '@ai-sdk/openai'

export function getProvider() {
  let apiKey = process.env.OPENAI_API_KEY

  if (!apiKey) {
    // Try local opencode config
    try {
      const home = os.homedir()
      // Try common paths
      const paths = [
        path.join(home, '.config', 'opencode', 'auth.json'),
        path.join(home, '.local', 'share', 'opencode', 'auth.json')
      ]

      for (const p of paths) {
        if (fs.existsSync(p)) {
          const content = fs.readFileSync(p, 'utf-8')
          const config = JSON.parse(content)
          if (config.keys?.openai) {
            apiKey = config.keys.openai
            break
          }
        }
      }
    } catch (e) {
      // Ignore read errors
    }
  }

  if (!apiKey) {
    throw new Error('No API key found. Please set OPENAI_API_KEY or login via CLI.')
  }

  return createOpenAI({
    apiKey,
  })
}
