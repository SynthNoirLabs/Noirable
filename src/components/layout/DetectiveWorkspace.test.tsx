import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { DetectiveWorkspace } from './DetectiveWorkspace'

// Mock Vercel AI SDK
vi.mock('@ai-sdk/react', () => ({
  useChat: () => ({
    messages: [],
    status: 'ready',
    sendMessage: vi.fn(),
    append: vi.fn(),
  })
}))

describe('DetectiveWorkspace', () => {
  it('updates preview when json changes', () => {
    const { container } = render(<DetectiveWorkspace />)
    
    const textarea = container.querySelector('textarea')
    if (!textarea) throw new Error('Textarea not found')
    
    expect(screen.getAllByText('Evidence #1').length).toBeGreaterThan(0)
    
    const newJson = JSON.stringify({
      type: 'card',
      title: 'New Suspect',
      status: 'active'
    }, null, 2)
    
    fireEvent.change(textarea, { target: { value: newJson } })
    
    expect(screen.getByText('New Suspect')).toBeInTheDocument()
    expect(screen.getByText('ACTIVE')).toBeInTheDocument()
  })

  it('handles invalid json gracefully', () => {
    const { container } = render(<DetectiveWorkspace />)
    const textarea = container.querySelector('textarea')
    if (!textarea) throw new Error('Textarea not found')
    
    fireEvent.change(textarea, { target: { value: '{ bad json ' } })
    
    expect(screen.getByText(/Invalid JSON/)).toBeInTheDocument() 
  })
})