import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { ChatSidebar } from './ChatSidebar'

// Mock Vercel AI SDK
const mockAppend = vi.fn()
vi.mock('@ai-sdk/react', () => ({
  useChat: () => ({
    messages: [
      { id: '1', role: 'user', content: 'Hello' },
      { id: '2', role: 'assistant', content: 'Greetings, detective.' }
    ],
    input: '',
    handleInputChange: vi.fn(),
    handleSubmit: (e: any) => {
      e.preventDefault()
      mockAppend()
    },
    append: mockAppend,
    isLoading: false
  })
}))

describe('ChatSidebar', () => {
  it('renders messages', () => {
    render(<ChatSidebar />)
    expect(screen.getByText('Hello')).toBeInTheDocument()
    expect(screen.getByText('Greetings, detective.')).toBeInTheDocument()
  })

  it('renders input field', () => {
    render(<ChatSidebar />)
    expect(screen.getByPlaceholderText(/Interrogate/i)).toBeInTheDocument()
  })

  it('submits message on enter', () => {
    render(<ChatSidebar />)
    const input = screen.getByPlaceholderText(/Interrogate/i)
    fireEvent.submit(input)
    expect(mockAppend).toHaveBeenCalled()
  })
})
