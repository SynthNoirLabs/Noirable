import { streamText, convertToCoreMessages } from 'ai'
import { openai } from '@ai-sdk/openai'

export async function POST(req: Request) {
  const { messages } = await req.json()

  const result = streamText({
    model: openai('gpt-4o'),
    messages: convertToCoreMessages(messages),
  })

  return result.toDataStreamResponse()
}
