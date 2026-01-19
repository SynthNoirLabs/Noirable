import { tool } from 'ai'
import { a2uiSchema } from '@/lib/protocol/schema'

export const tools = {
  generate_ui: tool({
    description: 'Generate or update a UI component based on the A2UI protocol. Call this tool whenever the user asks for a UI change.',
    parameters: a2uiSchema,
    execute: async (args) => {
      return {
        ...args,
        _status: 'generated'
      }
    },
  }),
}
