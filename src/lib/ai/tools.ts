import { tool } from 'ai'
import { z } from 'zod'
import { a2uiSchema, A2UIComponent } from '@/lib/protocol/schema'

// OpenAI tools require a top-level object schema. 
// A raw discriminated union (oneOf) at the root is sometimes rejected.
const toolSchema = z.object({
  component: a2uiSchema.describe('The UI component to generate')
})

export const tools = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  generate_ui: tool({
    description: 'Generate or update a UI component based on the A2UI protocol. Call this tool whenever the user asks for a UI change.',
    parameters: toolSchema,
    execute: async ({ component }: { component: A2UIComponent }) => {
      return {
        ...component,
        _status: 'generated'
      }
    },
  }) as any,
}