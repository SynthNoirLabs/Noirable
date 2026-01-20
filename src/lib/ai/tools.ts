import { tool } from 'ai'
import { a2uiSchema, A2UIComponent } from '@/lib/protocol/schema'

export const tools = {
  generate_ui: tool({
    description: 'Generate or update a UI component based on the A2UI protocol. Call this tool whenever the user asks for a UI change.',
    inputSchema: a2uiSchema,
    execute: async (args: A2UIComponent) => {
      return {
        ...args,
        _status: 'generated'
      }
    },
  }),
}
