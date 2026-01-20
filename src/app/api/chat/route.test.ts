import { describe, it, expect, vi } from 'vitest'
import { POST } from './route'
import { NextRequest } from 'next/server'

// Mock Vercel AI SDK
vi.mock('ai', () => ({
  streamText: vi.fn().mockReturnValue({
    toDataStreamResponse: vi.fn(() => new Response('mock-stream')), // Keep for compat
    toUIMessageStreamResponse: vi.fn(() => new Response('mock-stream')),
    toTextStreamResponse: vi.fn(() => new Response('mock-stream')),
  }),
  convertToModelMessages: vi.fn(async msgs => msgs), // Make async
  tool: vi.fn(config => config)
}))

// Mock Provider Factory
vi.mock('@/lib/ai/factory', () => ({
  getProvider: vi.fn().mockReturnValue({
    provider: vi.fn().mockReturnValue({}),
    model: 'gpt-4o',
    type: 'openai'
  })
}))

import { getProvider } from '@/lib/ai/factory'

// ... existing mocks ...

describe('/api/chat', () => {
  it('exports a POST handler', () => {
    expect(typeof POST).toBe('function')
  })

  it('returns a stream response', async () => {
    const req = new NextRequest('http://localhost/api/chat', {
      method: 'POST',
      body: JSON.stringify({ messages: [{ role: 'user', content: 'Hello' }] })
    })
    
    const res = await POST(req)
    expect(res).toBeInstanceOf(Response)
    const text = await res.text()
    expect(text).toBe('mock-stream')
  })

  it('returns local simulation message when provider is mock', async () => {
    // Override mock for this test
    vi.mocked(getProvider).mockReturnValueOnce({
      provider: null,
      model: 'mock',
      type: 'mock'
    })

    const req = new NextRequest('http://localhost/api/chat', {
      method: 'POST',
      body: JSON.stringify({ messages: [{ role: 'user', content: 'Hello' }] })
    })

    const res = await POST(req)
    const text = await res.text()
    expect(text).toContain('The streets are quiet')
  })
})