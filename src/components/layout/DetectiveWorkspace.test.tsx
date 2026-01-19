import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { DetectiveWorkspace } from './DetectiveWorkspace'

describe('DetectiveWorkspace', () => {
  it('updates preview when json changes', () => {
    render(<DetectiveWorkspace />)
    
    // Find textarea
    const textarea = screen.getByRole('textbox')
    
    // Default content should look like text
    expect(screen.getByText('Evidence #1')).toBeInTheDocument()
    
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
    render(<DetectiveWorkspace />)
    const textarea = screen.getByRole('textbox')
    
    // Invalid JSON
    fireEvent.change(textarea, { target: { value: '{ bad json ' } })
    
    // Should verify error message or fallback?
    // For now, let's say it shows "PARSING ERROR" or keeps old state?
    // Or maybe A2UIRenderer handles "REDACTED" if passed invalid data? 
    // But invalid JSON string cannot be passed to Renderer (expects object).
    // So Workspace must catch JSON.parse error.
    
    expect(screen.getByText(/CORRUPTED DATA/)).toBeInTheDocument() 
    // or expect(screen.getByText(/Invalid JSON/)).toBeInTheDocument()
  })
})
