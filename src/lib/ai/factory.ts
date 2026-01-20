import 'server-only'
import fs from 'fs'
import path from 'path'
import os from 'os'
import { createOpenAI } from '@ai-sdk/openai'
import { createAnthropic } from '@ai-sdk/anthropic'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { createOpenAICompatible } from '@ai-sdk/openai-compatible'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AIProviderInstance = any // Flexible for multiple SDK providers

export function getProvider(): { provider: AIProviderInstance, model: string, type: 'openai' | 'anthropic' | 'google' | 'openai-compatible' | 'mock' } {
  const home = os.homedir()
  const authPath = path.join(home, '.local/share/opencode/auth.json')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let config: any = {}

  if (fs.existsSync(authPath)) {
    try {
      config = JSON.parse(fs.readFileSync(authPath, 'utf-8'))
    } catch {
      console.warn('Failed to parse auth.json')
    }
  }

  // 1. Check OpenAI Compatible (Prioritize Custom Proxy)
  const openAIBaseUrl = process.env.OPENAI_BASE_URL
  if (openAIBaseUrl) {
    // Check for a key, but default to 'dummy' if using a local proxy that doesn't need one
    let compatKey = process.env.OPENAI_API_KEY
    if (!compatKey && config.openai) {
       compatKey = typeof config.openai === 'string' ? config.openai : config.openai.access
    }

    return {
      provider: createOpenAICompatible({
        name: 'cliproxy',
        baseURL: openAIBaseUrl,
        apiKey: compatKey || 'dummy',
      }),
      model: process.env.AI_MODEL || 'gpt-5.2(auto)',
      type: 'openai-compatible'
    }
  }

  // 2. Check OpenAI (Env or Config)
  let openAIKey = process.env.OPENAI_API_KEY
  if (!openAIKey && config.openai) {
    openAIKey = typeof config.openai === 'string' ? config.openai : config.openai.access
  }
  
  if (openAIKey) {
    return { 
      provider: createOpenAI({ apiKey: openAIKey }), 
      model: process.env.AI_MODEL || 'gpt-4o', 
      type: 'openai' 
    }
  }

  // 3. Check Anthropic (Env or Config)
  let anthropicKey = process.env.ANTHROPIC_API_KEY
  if (!anthropicKey && config.anthropic) {
    anthropicKey = typeof config.anthropic === 'string' ? config.anthropic : config.anthropic.access
  }

  if (anthropicKey) {
    return { 
      provider: createAnthropic({ apiKey: anthropicKey }), 
      model: process.env.AI_MODEL || 'claude-3-5-sonnet-latest', 
      type: 'anthropic' 
    }
  }

  // 4. Check Google/Gemini (Env or Config)
  let googleKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY
  if (!googleKey && config.google) {
    googleKey = typeof config.google === 'string' ? config.google : config.google.access
  }

  if (googleKey) {
    return { 
      provider: createGoogleGenerativeAI({ apiKey: googleKey }), 
      model: process.env.AI_MODEL || 'gemini-1.5-pro', 
      type: 'google' 
    }
  }

  // 5. Fallback to Mock in Dev
  if (process.env.NODE_ENV === 'development') {
    return { provider: null, model: 'mock', type: 'mock' }
  }

  throw new Error('No valid API key found for OpenAI, Anthropic, or Google.')
}
