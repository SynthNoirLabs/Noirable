import { describe, it, expect } from 'vitest'
import { tools } from './tools'

describe('AI Tools', () => {
  it('defines generate_ui tool', () => {
    expect(tools).toHaveProperty('generate_ui')
  })

  it('generate_ui has correct description', () => {
    expect(tools.generate_ui.description).toMatch(/generate/i)
    expect(tools.generate_ui.description).toContain('UI')
  })

  // We can't easily test the schema internal validation without calling execute, 
  // but we can verify it exists.
  it('has parameters schema', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const params = (tools.generate_ui as any).parameters
    expect(params).toBeDefined()
    // Verify it is a flat object schema (simplified for proxy compatibility)
    expect(params.shape.type).toBeDefined()
    expect(params.shape.content).toBeDefined()
  })
})
