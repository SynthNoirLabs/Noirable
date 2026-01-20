import { tool } from 'ai'
import { z } from 'zod'
import { A2UIComponent } from '@/lib/protocol/schema'

// Simplified schema for debugging/compatibility
const simpleSchema = z.object({
  type: z.enum(['text', 'card']),
  content: z.string().optional(),
  title: z.string().optional(),
  priority: z.enum(['low', 'normal', 'high', 'critical']).optional(),
  status: z.enum(['active', 'archived', 'missing', 'redacted']).optional(),
  description: z.string().optional()
})

export const tools = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  generate_ui: tool({
    description: 'Generate or update a UI component based on the A2UI protocol. Call this tool whenever the user asks for a UI change.',
    parameters: simpleSchema,
    execute: async (args: any) => {
      // Reconstruct the A2UIComponent from the flat simple args
      const component = args as A2UIComponent
      return {
        ...component,
        _status: 'generated'
      }
    },
  }) as any,
}
