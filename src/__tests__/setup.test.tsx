import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import Home from '@/app/page'

describe('Setup Test', () => {
  it('renders the hello world text', () => {
    render(<Home />)
    const heading = screen.getByText(/Detective's Desk Loading.../i)
    expect(heading).toBeInTheDocument()
  })
})
