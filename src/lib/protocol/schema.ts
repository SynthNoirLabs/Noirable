import { z } from 'zod'

export const textComponentSchema = z.object({
  type: z.literal('text'),
  content: z.string(),
  priority: z.enum(['low', 'normal', 'high', 'critical']).default('normal')
})

export const cardComponentSchema = z.object({
  type: z.literal('card'),
  title: z.string(),
  description: z.string().optional(),
  status: z.enum(['active', 'archived', 'missing', 'redacted']).default('active')
})

export const a2uiSchema = z.discriminatedUnion('type', [
  textComponentSchema,
  cardComponentSchema
])

export type TextComponent = z.infer<typeof textComponentSchema>
export type CardComponent = z.infer<typeof cardComponentSchema>
export type A2UIComponent = z.infer<typeof a2uiSchema>
