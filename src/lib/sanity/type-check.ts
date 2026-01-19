import { useChat } from '@ai-sdk/react'

export function check() {
  const result = useChat()
  // Intentionally accessing properties to see if they exist
  // const a = result.append
  const b = result.sendMessage // Uncomment to check
  return result
}
