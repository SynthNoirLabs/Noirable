import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { getProvider } from './factory'
import fs from 'fs'

// Manual mock for fs
vi.mock('fs', () => ({
  default: {
    existsSync: vi.fn(),
    readFileSync: vi.fn(),
  },
  existsSync: vi.fn(),
  readFileSync: vi.fn(),
}))

vi.mock('server-only', () => ({}))

describe('ProviderFactory', () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.resetModules()
    process.env = { ...originalEnv }
    delete process.env.OPENAI_API_KEY
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('uses env var if present', () => {
    process.env.OPENAI_API_KEY = 'env-key'
    const provider = getProvider()
    expect(provider).toBeDefined()
  })

  it('reads from local opencode config if env missing', () => {
    vi.mocked(fs.existsSync).mockReturnValue(true)
    vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify({
      keys: { openai: 'file-key' }
    }))
    
    const provider = getProvider()
    expect(provider).toBeDefined()
    expect(fs.readFileSync).toHaveBeenCalled()
  })

  it('throws if no key found', () => {
    vi.mocked(fs.existsSync).mockReturnValue(false)
    expect(() => getProvider()).toThrow(/No API key found/)
  })
})