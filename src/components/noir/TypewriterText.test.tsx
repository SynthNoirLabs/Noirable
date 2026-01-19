import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { TypewriterText } from './TypewriterText'

describe('TypewriterText', () => {
  it('renders content with typewriter font', () => {
    render(<TypewriterText content="Case #1234" />)
    const element = screen.getByText('Case #1234')
    expect(element).toBeInTheDocument()
    expect(element).toHaveClass('font-typewriter')
  })

  it('applies critical priority styling', () => {
    render(<TypewriterText content="CONFIDENTIAL" priority="critical" />)
    const element = screen.getByText('CONFIDENTIAL')
    expect(element).toHaveClass('text-noir-red')
  })

  it('applies normal priority styling by default', () => {
    render(<TypewriterText content="Standard report" />)
    const element = screen.getByText('Standard report')
    expect(element).toHaveClass('text-noir-ink') // or default color
  })
})
