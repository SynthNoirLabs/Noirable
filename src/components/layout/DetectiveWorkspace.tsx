"use client"

import React, { useState } from 'react'
import { DeskLayout } from './DeskLayout'
import { A2UIRenderer } from '@/components/renderer/A2UIRenderer'
import { ChatSidebar } from '@/components/chat/ChatSidebar'

const DEFAULT_JSON = JSON.stringify({
  type: 'text',
  content: 'Evidence #1',
  priority: 'normal'
}, null, 2)

export function DetectiveWorkspace() {
  const [json, setJson] = useState(DEFAULT_JSON)
  const [parsedData, setParsedData] = useState<any>(JSON.parse(DEFAULT_JSON))
  const [error, setError] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newVal = e.target.value
    setJson(newVal)
    try {
      const data = JSON.parse(newVal)
      setParsedData(data)
      setError(null)
    } catch (err) {
      setError("Invalid JSON")
      setParsedData(null)
    }
  }

  return (
    <DeskLayout
      editor={
        <div className="h-full flex flex-col">
          <textarea 
            className="w-full h-full bg-transparent text-noir-paper/90 font-mono text-sm resize-none focus:outline-none p-2"
            value={json}
            onChange={handleChange}
            spellCheck={false}
          />
          {error && (
            <div className="text-noir-red font-typewriter text-xs mt-2 border-t border-noir-red pt-2">
              Error: {error}
            </div>
          )}
        </div>
      }
      preview={
        parsedData ? (
          <A2UIRenderer data={parsedData} />
        ) : (
           <div className="bg-noir-red/10 border-2 border-noir-red p-4 rounded-sm animate-pulse max-w-md">
            <h3 className="text-noir-red font-typewriter font-bold mb-2">REDACTED</h3>
             <p className="text-noir-red/80 font-mono text-xs">
              CORRUPTED DATA STREAM.<br/>
              UNABLE TO DECRYPT.
            </p>
          </div>
        )
      }
      sidebar={<ChatSidebar />}
    />
  )
}