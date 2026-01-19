import { describe, it, expect } from 'vitest'
import { a2uiSchema } from './schema'

describe('A2UI Schema', () => {
  it('validates a correct text component', () => {
    const data = {
      type: 'text',
      content: 'The suspect was seen leaving the scene.',
      priority: 'normal'
    }
    const result = a2uiSchema.safeParse(data)
    expect(result.success).toBe(true)
  })

  it('validates a correct card component', () => {
    const data = {
      type: 'card',
      title: 'Dossier: John Doe',
      description: 'Known associate of the Syndicate.',
      status: 'active'
    }
    const result = a2uiSchema.safeParse(data)
    expect(result.success).toBe(true)
  })

  it('fails on invalid component type', () => {
    const data = {
      type: 'ufo',
      something: 'else'
    }
    const result = a2uiSchema.safeParse(data)
    expect(result.success).toBe(false)
  })

  it('fails on missing required fields', () => {
    const data = {
      type: 'text'
      // missing content
    }
    const result = a2uiSchema.safeParse(data)
    expect(result.success).toBe(false)
  })
})
