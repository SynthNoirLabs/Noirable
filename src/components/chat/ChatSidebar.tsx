"use client"

import React, { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { Send, User, Bot } from 'lucide-react'

// Define Message interface locally since 'ai' package exports are unstable/mismatched
export interface Message {
  id: string
  role: 'system' | 'user' | 'assistant' | 'data' | 'tool' | string
  content: string
  toolInvocations?: unknown[]
}

interface ChatSidebarProps {
  className?: string
  messages: Message[]
  sendMessage: (message: { role: 'user', content: string }) => Promise<string | null | undefined>
  isLoading: boolean
}

export function ChatSidebar({ className, messages, sendMessage, isLoading }: ChatSidebarProps) {
  const [localInput, setLocalInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!localInput.trim() || isLoading) return

    const content = localInput
    setLocalInput('') 
    
    try {
      await sendMessage({ role: 'user', content })
    } catch (err) {
      console.error('Failed to send message:', err)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      // Allow form submit
    }
  }

  return (
    <div className={cn("flex flex-col h-full bg-noir-black/80 border-l border-noir-gray/20", className)}>
      <div className="p-4 border-b border-noir-gray/20 bg-noir-dark/90 sticky top-0 z-10">
        <h2 className="font-typewriter text-sm text-noir-paper/70 tracking-widest flex items-center gap-2">
          <Bot className="w-4 h-4" />
          INTERROGATION LOG
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-8 text-noir-gray/40 font-typewriter text-xs uppercase tracking-widest">
            No record found. Begin interrogation.
          </div>
        )}
        {messages.map((m: Message) => (
          <div key={m.id} className={cn(
            "flex gap-3 text-sm p-3 rounded-sm border",
            m.role === 'user' 
              ? "bg-noir-paper/5 border-noir-gray/30 ml-8 text-noir-paper"
              : "bg-noir-dark border-noir-gray/50 mr-8 text-noir-paper font-typewriter"
          )}>
            <div className={cn(
              "w-6 h-6 flex items-center justify-center rounded-full shrink-0 border",
              m.role === 'user' ? "border-noir-amber/50 text-noir-amber" : "border-noir-paper/50 text-noir-paper"
            )}>
              {m.role === 'user' ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
            </div>
            <div className="flex-1 whitespace-pre-wrap">
              {m.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-2 items-center text-noir-gray text-xs font-mono animate-pulse pl-4">
            <span>Typing...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-noir-dark border-t border-noir-gray/20">
        <form onSubmit={onSubmit} className="relative">
          <input
            name="chat-input"
            autoFocus
            className="w-full bg-noir-paper/5 border border-noir-gray/30 rounded-sm py-3 pl-4 pr-10 text-sm text-noir-paper focus:outline-none focus:border-noir-amber/50 font-mono placeholder:text-noir-gray/50"
            value={localInput}
            onChange={(e) => setLocalInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Interrogate the system..."
          />
          <button 
            type="submit"
            disabled={isLoading || !localInput.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-noir-gray hover:text-noir-amber disabled:opacity-50 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  )
}