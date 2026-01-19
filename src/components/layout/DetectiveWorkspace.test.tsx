import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { DetectiveWorkspace } from './DetectiveWorkspace'

// Mock Vercel AI SDK
vi.mock('@ai-sdk/react', () => ({
  useChat: () => ({
    messages: [],
    input: '',
    handleInputChange: vi.fn(),
    handleSubmit: vi.fn(),
    isLoading: false
  })
}))

describe('DetectiveWorkspace', () => {
  it('updates preview when json changes', () => {
    const { container } = render(<DetectiveWorkspace />)
    
    // Find textarea (JSON Editor)
    const textarea = container.querySelector('textarea')
    if (!textarea) throw new Error('Textarea not found')
    
    // Default content should look like text
    expect(screen.getAllByText('Evidence #1').length).toBeGreaterThan(0)
    
    // Update JSON
    const newJson = JSON.stringify({
      type: 'card',
      title: 'New Suspect',
      status: 'active'
    }, null, 2)
    
    fireEvent.change(textarea, { target: { value: newJson } })
    
    // Verify preview updated
    expect(screen.getByText('New Suspect')).toBeInTheDocument()
    expect(screen.getByText('ACTIVE')).toBeInTheDocument()
  })

  it('handles invalid json gracefully', () => {
    const { container } = render(<DetectiveWorkspace />)
    const textarea = container.querySelector('textarea')
    if (!textarea) throw new Error('Textarea not found')
    
    // Invalid JSON
    fireEvent.change(textarea, { target: { value: '{ bad json ' } })
    
    expect(screen.getByText(/CORRUPTED DATA/)).toBeInTheDocument() 
  })
})
