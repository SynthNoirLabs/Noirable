import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { A2UIRenderer } from './A2UIRenderer'

describe('A2UIRenderer', () => {
  it('renders a text component', () => {
    const data = {
      type: 'text',
      content: 'Evidence #1',
      priority: 'normal'
    }
    render(<A2UIRenderer data={data} />)
    expect(screen.getByText('Evidence #1')).toBeInTheDocument()
  })

  it('renders a card component', () => {
    const data = {
      type: 'card',
      title: 'Suspect Profile',
      status: 'active'
    }
    render(<A2UIRenderer data={data} />)
    expect(screen.getByText('Suspect Profile')).toBeInTheDocument()
    expect(screen.getByText('ACTIVE')).toBeInTheDocument()
  })

  it('renders redacted placeholder for unknown type', () => {
    const data = {
      type: 'alien_tech',
      content: '???'
    }
    render(<A2UIRenderer data={data} />)
    expect(screen.getByText(/REDACTED/)).toBeInTheDocument()
    // Should verify it says "CORRUPTED DATA" or similar?
    // "Graceful Failure: If the AI generates an unknown component type, the renderer must display a 'REDACTED' or 'MISSING FILE' placeholder"
    expect(screen.getByText(/UNKNOWN ARTIFACT/i)).toBeInTheDocument()
  })

  it('renders redacted placeholder for invalid schema', () => {
    const data = {
      type: 'card',
      // missing title
      status: 'active'
    }
    render(<A2UIRenderer data={data} />)
    expect(screen.getByText(/REDACTED/)).toBeInTheDocument()
  })
})
