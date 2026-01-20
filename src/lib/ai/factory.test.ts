import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { getProvider } from './factory'
import fs from 'fs'

vi.mock('server-only', () => ({}))

describe('ProviderFactory', () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.resetModules()
    process.env = { ...originalEnv }
    delete process.env.OPENAI_API_KEY
    delete process.env.ANTHROPIC_API_KEY
    delete process.env.GOOGLE_GENERATIVE_AI_API_KEY
    delete process.env.GEMINI_API_KEY
    vi.spyOn(fs, 'existsSync').mockReturnValue(false)
  })

  afterEach(() => {
    process.env = originalEnv
    vi.restoreAllMocks()
  })

  it('uses env var if present', () => {
    process.env.OPENAI_API_KEY = 'env-key'
    const result = getProvider()
    expect(result.type).toBe('openai')
  })

  it('reads from local opencode config if env missing', () => {
    vi.spyOn(fs, 'existsSync').mockReturnValue(true)
    vi.spyOn(fs, 'readFileSync').mockReturnValue(JSON.stringify({
      openai: 'file-key' // Root level key per new logic
    }))
    
    const result = getProvider()
    expect(result.type).toBe('openai')
    expect(fs.readFileSync).toHaveBeenCalled()
  })

  it('uses GEMINI_API_KEY if present', () => {
    process.env.GEMINI_API_KEY = 'gemini-key'
    const result = getProvider()
    expect(result.type).toBe('google')
  })

  it('throws if no key found', () => {
    vi.spyOn(fs, 'existsSync').mockReturnValue(false)
    // Ensure NODE_ENV is NOT development for this test to trigger throw
    vi.stubEnv('NODE_ENV', 'production')
    
    expect(() => getProvider()).toThrow(/No valid API key found/)
  })
})
