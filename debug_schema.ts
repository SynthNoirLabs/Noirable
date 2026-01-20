import { z } from 'zod'
import { zodToJsonSchema } from 'zod-to-json-schema'
import { a2uiSchema } from './src/lib/protocol/schema'

const toolSchema = z.object({
  component: a2uiSchema.describe('The UI component to generate')
})

const jsonSchema = zodToJsonSchema(toolSchema, 'toolSchema')
console.log(JSON.stringify(jsonSchema, null, 2))