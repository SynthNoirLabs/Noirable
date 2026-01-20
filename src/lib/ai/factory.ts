import 'server-only'
import fs from 'fs'
import path from 'path'
import os from 'os'
import { createOpenAI } from '@ai-sdk/openai'
import { createAnthropic } from '@ai-sdk/anthropic'
import { createGoogleGenerativeAI } from '@ai-sdk/google'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AIProviderInstance = any // Flexible for multiple SDK providers

export function getProvider(): { provider: AIProviderInstance, model: string, type: 'openai' | 'anthropic' | 'google' | 'mock' } {
  const home = os.homedir()
  const authPath = path.join(home, '.local/share/opencode/auth.json')
  let config: Record<string, string | undefined> = {}

  if (fs.existsSync(authPath)) {
    try {
      config = JSON.parse(fs.readFileSync(authPath, 'utf-8'))
    } catch {
      console.warn('Failed to parse auth.json')
    }
  }

  // 1. Check OpenAI (Env or Config)
  let openAIKey = process.env.OPENAI_API_KEY
  if (!openAIKey && config.openai) {
    openAIKey = typeof config.openai === 'string' ? config.openai : config.openai.access
  }
  
  if (openAIKey) {
    return { 
      provider: createOpenAI({ apiKey: openAIKey }), 
      model: 'gpt-4o', 
      type: 'openai' 
    }
  }

  // 2. Check Anthropic (Env or Config)
  let anthropicKey = process.env.ANTHROPIC_API_KEY
  if (!anthropicKey && config.anthropic) {
    anthropicKey = typeof config.anthropic === 'string' ? config.anthropic : config.anthropic.access
  }

  if (anthropicKey) {
    return { 
      provider: createAnthropic({ apiKey: anthropicKey }), 
      model: 'claude-3-5-sonnet-latest', 
      type: 'anthropic' 
    }
  }

  // 3. Check Google/Gemini (Env or Config)
  let googleKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY
  if (!googleKey && config.google) {
    googleKey = typeof config.google === 'string' ? config.google : config.google.access
  }

  if (googleKey) {
    return { 
      provider: createGoogleGenerativeAI({ apiKey: googleKey }), 
      model: 'gemini-1.5-pro', 
      type: 'google' 
    }
  }

  // 4. Fallback to Mock in Dev
  if (process.env.NODE_ENV === 'development') {
    return { provider: null, model: 'mock', type: 'mock' }
  }

  throw new Error('No valid API key found for OpenAI, Anthropic, or Google.')
}