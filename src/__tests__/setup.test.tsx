import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import Home from '@/app/page'

describe('Home Page Smoke Test', () => {
  it('renders the Detective Desk layout', () => {
    render(<Home />)
    // Check for the editor pane header
    expect(screen.getByText(/CASE FILE \/\/ JSON DATA/i)).toBeInTheDocument()
    // Check for the preview content
    expect(screen.getAllByText(/Evidence #1/i)[0]).toBeInTheDocument()
  })
})