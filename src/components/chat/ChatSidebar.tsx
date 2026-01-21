"use client";

import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import {
  Send,
  User,
  Bot,
  Settings as SettingsIcon,
  PanelRightClose,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { TypewriterText } from "@/components/noir/TypewriterText";
import Image from "next/image";
import type { UseChatHelpers } from "@ai-sdk/react";
import type { UIMessage } from "ai";

// Define Message interface locally since 'ai' package exports are unstable/mismatched
export interface Message {
  id: string;
  role: "system" | "user" | "assistant" | "data" | "tool" | string;
  content: string;
  toolInvocations?: unknown[];
}

interface ChatSidebarProps {
  className?: string;
  messages: Message[];
  sendMessage: UseChatHelpers<UIMessage>["sendMessage"];
  isLoading: boolean;
  typewriterSpeed?: number;
  onUpdateSettings?: (settings: { typewriterSpeed: number }) => void;
  onToggleCollapse?: () => void;
}

export function ChatSidebar({
  className,
  messages,
  sendMessage,
  isLoading,
  typewriterSpeed = 30,
  onUpdateSettings,
  onToggleCollapse,
}: ChatSidebarProps) {
  const [localInput, setLocalInput] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!localInput.trim() || isLoading) return;

    const content = localInput;
    setLocalInput("");

    try {
      await sendMessage({ text: content });
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      // Allow form submit
    }
  };

  const toggleSpeed = () => {
    const newSpeed = typewriterSpeed === 0 ? 30 : 0;
    onUpdateSettings?.({ typewriterSpeed: newSpeed });
  };

  return (
    <div
      className={cn(
        "flex flex-col h-full bg-noir-black/90 border-l border-noir-gray/20 shadow-[-10px_0_20px_rgba(0,0,0,0.5)]",
        className,
      )}
    >
      <div className="p-4 border-b border-noir-gray/20 bg-noir-dark/95 sticky top-0 z-10 backdrop-blur-sm flex justify-between items-center">
        <h2 className="font-typewriter text-sm text-noir-paper/70 tracking-widest flex items-center gap-2">
          <Image
            src="/assets/noir/detective-avatar.jpg"
            alt="Detective avatar"
            width={32}
            height={32}
            className="w-8 h-8 rounded-full object-cover border border-noir-amber/40 shadow-[0_0_10px_rgba(255,191,0,0.18)]"
          />
          <Bot className="w-4 h-4 text-noir-amber/70" />
          INTERROGATION LOG
        </h2>
        <div className="flex items-center gap-2">
          {onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="text-noir-gray hover:text-noir-amber transition-colors p-1"
              title="Collapse sidebar"
              aria-label="Collapse sidebar"
            >
              <PanelRightClose className="w-4 h-4" />
            </button>
          )}
          {onUpdateSettings && (
            <button
              type="button"
              onClick={() => setShowSettings(!showSettings)}
              className="text-noir-gray hover:text-noir-amber transition-colors p-1"
              title="Configuration"
            >
              <SettingsIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-b border-noir-gray/20 bg-noir-dark/50"
          >
            <div className="p-4 text-xs font-mono flex items-center justify-between">
              <span className="text-noir-paper/70">TYPEWRITER SPEED</span>
              <button
                onClick={toggleSpeed}
                className={cn(
                  "px-2 py-1 border rounded-sm transition-colors",
                  typewriterSpeed === 0
                    ? "border-noir-amber text-noir-amber bg-noir-amber/10"
                    : "border-noir-gray/50 text-noir-gray hover:border-noir-paper",
                )}
              >
                {typewriterSpeed === 0 ? "INSTANT" : "NORMAL"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.length === 0 && (
          <div className="text-center py-12 text-noir-paper/45 font-typewriter text-xs uppercase tracking-[0.2em] relative drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
            <Image
              src="/assets/noir/search-icon.jpg"
              alt="Search icon"
              width={80}
              height={80}
              className="absolute left-1/2 top-1/2 w-20 h-20 -translate-x-1/2 -translate-y-1/2 opacity-10 pointer-events-none"
            />
            <span className="relative z-10">
              No record found. Begin interrogation.
            </span>
          </div>
        )}
        <AnimatePresence initial={false}>
          {messages.map((m: Message) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, x: -10, filter: "blur(2px)" }}
              animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className={cn(
                "flex gap-3 text-sm p-3 rounded-sm border relative group",
                m.role === "user"
                  ? "bg-noir-paper/5 border-noir-gray/30 ml-8 text-noir-paper shadow-sm"
                  : "bg-noir-dark border-noir-gray/50 mr-8 text-noir-paper font-typewriter shadow-md",
              )}
            >
              {/* Decorative corner accents for 'Noir' feel */}
              <div
                className={cn(
                  "absolute w-1 h-1 top-[-1px] left-[-1px] border-t border-l",
                  m.role === "user"
                    ? "border-noir-amber/30"
                    : "border-noir-paper/30",
                )}
              />
              <div
                className={cn(
                  "absolute w-1 h-1 bottom-[-1px] right-[-1px] border-b border-r",
                  m.role === "user"
                    ? "border-noir-amber/30"
                    : "border-noir-paper/30",
                )}
              />

              <div
                className={cn(
                  "w-6 h-6 flex items-center justify-center rounded-full shrink-0 border shadow-inner",
                  m.role === "user"
                    ? "border-noir-amber/50 text-noir-amber bg-noir-amber/5"
                    : "border-noir-paper/50 text-noir-paper bg-noir-paper/5",
                )}
              >
                {m.role === "user" ? (
                  <User className="w-3 h-3" />
                ) : (
                  <Bot className="w-3 h-3" />
                )}
              </div>
              <div className="flex-1 whitespace-pre-wrap leading-relaxed opacity-90">
                {m.role === "user" ? (
                  m.content
                ) : (
                  <TypewriterText
                    content={m.content}
                    speed={typewriterSpeed}
                    className="text-sm"
                  />
                )}
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
            <span className="ml-2 uppercase tracking-wider text-[10px]">
              Processing Evidence...
            </span>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-noir-dark/95 border-t border-noir-gray/20">
        <form onSubmit={onSubmit} className="relative">
          <input
            name="chat-input"
            autoFocus
            className="w-full bg-transparent border-b border-noir-gray/30 rounded-none py-3 pl-2 pr-10 text-sm text-noir-paper focus:outline-none focus:border-noir-amber/50 font-mono placeholder:text-noir-paper/45 transition-colors"
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
  );
}
