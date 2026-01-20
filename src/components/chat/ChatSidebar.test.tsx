import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { ChatSidebar } from './ChatSidebar'

const mockSendMessage = vi.fn()
const mockMessages = [
  { id: '1', role: 'user', content: 'Hello' },
  { id: '2', role: 'assistant', content: 'Greetings, detective.' }
]

describe('ChatSidebar', () => {
  it('renders messages', () => {
    render(
      <ChatSidebar 
        messages={mockMessages} 
        sendMessage={mockSendMessage} 
        isLoading={false} 
      />
    )
    expect(screen.getByText('Hello')).toBeInTheDocument()
    expect(screen.getByText('Greetings, detective.')).toBeInTheDocument()
  })

  it('renders input field', () => {
    render(
      <ChatSidebar 
        messages={[]} 
        sendMessage={mockSendMessage} 
        isLoading={false} 
      />
    )
    expect(screen.getByPlaceholderText(/Type your command/i)).toBeInTheDocument()
  })

  it('submits message on enter', () => {
    render(
      <ChatSidebar 
        messages={[]} 
        sendMessage={mockSendMessage} 
        isLoading={false} 
      />
    )
    const input = screen.getByPlaceholderText(/Type your command/i)
    fireEvent.change(input, { target: { value: 'Hello' } })
    fireEvent.submit(input)
    expect(mockSendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        role: 'user',
        content: 'Hello'
      })
    )
  })

  it('shows typing indicator when loading', () => {
    render(
      <ChatSidebar 
        messages={[]} 
        sendMessage={mockSendMessage} 
        isLoading={true} 
      />
    )
    expect(screen.getByText(/Processing Evidence/i)).toBeInTheDocument()
  })
})
