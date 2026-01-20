"use client"

import React, { useState, useEffect } from 'react'
import { DeskLayout } from './DeskLayout'
import { A2UIRenderer } from '@/components/renderer/A2UIRenderer'
import { ChatSidebar } from '@/components/chat/ChatSidebar'
import { useA2UIStore } from '@/lib/store/useA2UIStore'
import { useChat } from '@ai-sdk/react'

const DEFAULT_JSON = JSON.stringify({
  type: 'text',
  content: 'Evidence #1',
  priority: 'normal'
}, null, 2)

export function DetectiveWorkspace() {
  const [json, setJson] = useState(DEFAULT_JSON)
  const [error, setError] = useState<string | null>(null)
  const { evidence, setEvidence } = useA2UIStore()

  // Initialize store
  useEffect(() => {
    try {
      if (!evidence) {
        setEvidence(JSON.parse(DEFAULT_JSON))
      }
    } catch (e) {
      // ignore
    }
  }, []) // Once

  const chat = useChat({
    onError: (err) => console.error('useChat error:', err)
  })
  
  const { messages, status } = chat
  // Polyfill for API mismatch
  const sendMessage = (chat as any).sendMessage || (chat as any).append
  const isLoading = status === 'submitted' || status === 'streaming'

  // Sync Tool Results to Store
  useEffect(() => {
    if (!messages || messages.length === 0) return
    const lastMessage = messages[messages.length - 1]
    
    if (lastMessage.role === 'assistant' && (lastMessage as any).toolInvocations) {
      const invocations = (lastMessage as any).toolInvocations
      for (const tool of invocations) {
        if (tool.toolName === 'generate_ui' && tool.state === 'result') {
          console.log('Tool Result received:', tool.result)
          const newEvidence = tool.result
          setEvidence(newEvidence)
          setJson(JSON.stringify(newEvidence, null, 2))
          setError(null)
        }
      }
    }
  }, [messages, setEvidence])

  const handleEditorChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newVal = e.target.value
    setJson(newVal)
    try {
      const data = JSON.parse(newVal)
      setEvidence(data)
      setError(null)
    } catch (err) {
      setError("Invalid JSON")
    }
  }

  return (
    <DeskLayout
      editor={
        <div className="h-full flex flex-col">
          <textarea 
            className="w-full h-full bg-transparent text-noir-paper/90 font-mono text-sm resize-none focus:outline-none p-2"
            value={json}
            onChange={handleEditorChange}
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
        evidence ? (
          <A2UIRenderer data={evidence} />
        ) : (
           <div className="bg-noir-red/10 border-2 border-noir-red p-4 rounded-sm animate-pulse max-w-md">
            <h3 className="text-noir-red font-typewriter font-bold mb-2">REDACTED</h3>
             <p className="text-noir-red/80 font-mono text-xs">
              NO EVIDENCE LOADED.
            </p>
          </div>
        )
      }
      sidebar={
        <ChatSidebar 
          messages={messages} 
          sendMessage={sendMessage} 
          isLoading={isLoading} 
        />
      }
    />
  )
}
