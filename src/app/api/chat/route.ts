import { streamText, convertToCoreMessages } from 'ai'
import { SYSTEM_PROMPT } from '@/lib/ai/prompts'
import { getProvider } from '@/lib/ai/factory'

export async function POST(req: Request) {
  const { messages } = await req.json()

  let auth
  try {
    auth = getProvider()
  } catch (e) {
    return new Response('Configuration Error: No API Key found.', { status: 500 })
  }

  if (auth.type === 'mock') {
    return new Response(
      `0:"The streets are quiet... too quiet. (Detective Mode: No API Key detected. Using local simulation.)"
`,
      { headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
    )
  }

  // Use the detected provider and model
  const result = streamText({
    model: auth.provider(auth.model),
    messages: convertToCoreMessages(messages),
    system: SYSTEM_PROMPT,
  })

  return result.toDataStreamResponse()
}
