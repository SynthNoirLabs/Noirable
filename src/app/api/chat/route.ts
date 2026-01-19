import { streamText, convertToCoreMessages } from 'ai'
import { SYSTEM_PROMPT } from '@/lib/ai/prompts'
import { getProvider } from '@/lib/ai/factory'

export async function POST(req: Request) {
  const { messages } = await req.json()

  let provider
  try {
    provider = getProvider()
  } catch (e) {
    return new Response('Configuration Error: No API Key found.', { status: 500 })
  }

  const result = streamText({
    model: provider('gpt-4o'),
    messages: convertToCoreMessages(messages),
    system: SYSTEM_PROMPT,
  })

  return result.toDataStreamResponse()
}
