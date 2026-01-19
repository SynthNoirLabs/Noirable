import { describe, it, expect } from 'vitest'
import { SYSTEM_PROMPT } from './prompts'

describe('System Prompt', () => {
  it('exports a prompt string', () => {
    expect(typeof SYSTEM_PROMPT).toBe('string')
    expect(SYSTEM_PROMPT.length).toBeGreaterThan(100)
  })

  it('contains noir persona keywords', () => {
    expect(SYSTEM_PROMPT).toMatch(/detective/i)
    expect(SYSTEM_PROMPT).toMatch(/noir/i)
    expect(SYSTEM_PROMPT).toMatch(/json/i) // Must mention JSON format
  })
})
