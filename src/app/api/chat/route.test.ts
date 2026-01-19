import { describe, it, expect, vi } from 'vitest'
import { POST } from './route'
import { NextRequest } from 'next/server'

// Mock Vercel AI SDK
vi.mock('ai', () => ({
  streamText: vi.fn().mockReturnValue({
    toDataStreamResponse: () => new Response('mock-stream')
  }),
  convertToCoreMessages: vi.fn(msgs => msgs)
}))

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
})
