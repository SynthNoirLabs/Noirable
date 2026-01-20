import { render, screen, act } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { TypewriterText } from './TypewriterText'

describe('TypewriterText', () => {
  it('renders content with typewriter font', () => {
    const { container } = render(<TypewriterText content="Case #1234" speed={0} />)
    
    // Allow animation/state to settle if needed, though speed=0 is instant
    const element = container.querySelector('.font-typewriter')
    expect(element).toBeInTheDocument()
    expect(element?.textContent).toContain('Case #1234')
  })

  it('applies critical priority styling', () => {
    const { container } = render(<TypewriterText content="CONFIDENTIAL" priority="critical" speed={0} />)
    
    const element = container.querySelector('.text-noir-red')
    expect(element).toBeInTheDocument()
    expect(element?.textContent).toContain('CONFIDENTIAL')
  })
})
