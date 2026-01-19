import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { DossierCard } from './DossierCard'

describe('DossierCard', () => {
  it('renders title and description', () => {
    render(<DossierCard title="John Doe" description="Suspect" />)
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('Suspect')).toBeInTheDocument()
  })

  it('has paper texture and shadow', () => {
    const { container } = render(<DossierCard title="Test" />)
    const card = container.firstChild
    expect(card).toHaveClass('bg-paper')
    expect(card).toHaveClass('shadow-lg')
  })

  it('renders status stamp', () => {
    render(<DossierCard title="Test" status="redacted" />)
    expect(screen.getByText('REDACTED')).toBeInTheDocument()
  })
})
