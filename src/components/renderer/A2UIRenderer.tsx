import React from 'react'
import { a2uiSchema } from '@/lib/protocol/schema'
import { TypewriterText } from '@/components/noir/TypewriterText'
import { DossierCard } from '@/components/noir/DossierCard'

interface A2UIRendererProps {
  data: unknown
}

export function A2UIRenderer({ data }: A2UIRendererProps) {
  const result = a2uiSchema.safeParse(data)

  if (!result.success) {
    return (
      <div className="bg-noir-red/10 border-2 border-noir-red p-4 rounded-sm animate-pulse max-w-md">
        <h3 className="text-noir-red font-typewriter font-bold mb-2">REDACTED</h3>
        <p className="text-noir-red/80 font-mono text-xs">
          UNKNOWN ARTIFACT DETECTED.
          <br/>
          DATA CORRUPTION LEVEL: CRITICAL.
        </p>
      </div>
    )
  }

  const component = result.data

  switch (component.type) {
    case 'text':
      return <TypewriterText content={component.content} priority={component.priority} />
    case 'card':
      return <DossierCard title={component.title} description={component.description} status={component.status} />
    default:
      return null
  }
}
