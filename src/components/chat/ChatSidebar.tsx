"use client"

import React, { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { Send, User, Bot } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

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
    <div className={cn("flex flex-col h-full bg-noir-black/90 border-l border-noir-gray/20 shadow-[-10px_0_20px_rgba(0,0,0,0.5)]", className)}>
      <div className="p-4 border-b border-noir-gray/20 bg-noir-dark/95 sticky top-0 z-10 backdrop-blur-sm">
        <h2 className="font-typewriter text-sm text-noir-paper/70 tracking-widest flex items-center gap-2">
          <Bot className="w-4 h-4 text-noir-amber/70" />
          INTERROGATION LOG
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.length === 0 && (
          <div className="text-center py-12 text-noir-gray/30 font-typewriter text-xs uppercase tracking-[0.2em]">
            No record found. Begin interrogation.
          </div>
        )}
        <AnimatePresence initial={false}>
          {messages.map((m: Message) => (
            <motion.div 
              key={m.id} 
              initial={{ opacity: 0, x: -10, filter: 'blur(2px)' }}
              animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className={cn(
                "flex gap-3 text-sm p-3 rounded-sm border relative group",
                m.role === 'user' 
                  ? "bg-noir-paper/5 border-noir-gray/30 ml-8 text-noir-paper shadow-sm"
                  : "bg-noir-dark border-noir-gray/50 mr-8 text-noir-paper font-typewriter shadow-md"
              )}
            >
              {/* Decorative corner accents for 'Noir' feel */}
              <div className={cn("absolute w-1 h-1 top-[-1px] left-[-1px] border-t border-l", 
                m.role === 'user' ? "border-noir-amber/30" : "border-noir-paper/30")} />
              <div className={cn("absolute w-1 h-1 bottom-[-1px] right-[-1px] border-b border-r", 
                m.role === 'user' ? "border-noir-amber/30" : "border-noir-paper/30")} />

              <div className={cn(
                "w-6 h-6 flex items-center justify-center rounded-full shrink-0 border shadow-inner",
                m.role === 'user' 
                  ? "border-noir-amber/50 text-noir-amber bg-noir-amber/5" 
                  : "border-noir-paper/50 text-noir-paper bg-noir-paper/5"
              )}>
                {m.role === 'user' ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
              </div>
              <div className="flex-1 whitespace-pre-wrap leading-relaxed opacity-90">
                {m.content}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {isLoading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-2 items-center text-noir-gray text-xs font-mono pl-4 opacity-50"
          >
            <span className="w-2 h-2 bg-noir-amber/50 rounded-full animate-pulse" />
            <span className="w-2 h-2 bg-noir-amber/50 rounded-full animate-pulse delay-75" />
            <span className="w-2 h-2 bg-noir-amber/50 rounded-full animate-pulse delay-150" />
            <span className="ml-2 uppercase tracking-wider text-[10px]">Processing Evidence...</span>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-noir-dark/95 border-t border-noir-gray/20">
        <form onSubmit={onSubmit} className="relative">
          <input
            name="chat-input"
            autoFocus
            className="w-full bg-transparent border-b border-noir-gray/30 rounded-none py-3 pl-2 pr-10 text-sm text-noir-paper focus:outline-none focus:border-noir-amber/50 font-mono placeholder:text-noir-gray/30 transition-colors"
            value={localInput}
            onChange={(e) => setLocalInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your command..."
          />
          <button 
            type="submit"
            disabled={isLoading || !localInput.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-noir-gray hover:text-noir-amber disabled:opacity-30 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  )
}
