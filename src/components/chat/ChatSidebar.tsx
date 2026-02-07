"use client";

import Image from "next/image";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  User,
  Bot,
  Settings as SettingsIcon,
  PanelRightClose,
  Volume2,
  VolumeX,
  Loader2,
} from "lucide-react";
import type { UseChatHelpers } from "@ai-sdk/react";
import type { UIMessage } from "ai";
import { cn } from "@/lib/utils";
import { NoirSoundEffects } from "@/components/noir/NoirSoundEffects";
import { TypewriterText } from "@/components/noir/TypewriterText";
import { ChatSettingsPanel } from "./ChatSettingsPanel";
import { formatShortcut } from "@/lib/hooks/useKeyboardShortcuts";
import type { AmbientSettings, ModelConfig, SettingsUpdate } from "@/lib/store/useA2UIStore";

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
  soundEnabled?: boolean;
  ttsEnabled?: boolean;
  musicEnabled?: boolean;
  ambient?: AmbientSettings;
  modelConfig?: ModelConfig;
  useA2UIv09?: boolean;
  onUpdateSettings?: (settings: SettingsUpdate) => void;
  onModelConfigChange?: (config: ModelConfig) => void;
  onToggleCollapse?: () => void;
  inputRef?: React.RefObject<HTMLInputElement | null>;
}

export function ChatSidebar({
  className,
  messages,
  sendMessage,
  isLoading,
  typewriterSpeed = 30,
  soundEnabled = true,
  ttsEnabled = true,
  musicEnabled = false,
  ambient,
  modelConfig,
  useA2UIv09 = false,
  onUpdateSettings,
  onModelConfigChange,
  onToggleCollapse,
  inputRef,
}: ChatSidebarProps) {
  const [localInput, setLocalInput] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [ttsLoadingId, setTtsLoadingId] = useState<string | null>(null);
  const [ttsPlayingId, setTtsPlayingId] = useState<string | null>(null);
  const [ttsUnavailable, setTtsUnavailable] = useState(false);
  const [elevenLabsConfigured, setElevenLabsConfigured] = useState<boolean | null>(null);
  const [sfxControls, setSfxControls] = useState<{
    playTypewriter: () => void;
    playThunder: () => void;
    playPhoneRing: () => void;
  } | null>(null);
  const ttsAudioRef = useRef<HTMLAudioElement | null>(null);
  const ttsUrlRef = useRef<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const soundSetting = soundEnabled;
  const ttsSetting = ttsEnabled ?? true;
  const musicSetting = musicEnabled ?? false;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    let isMounted = true;
    const fetchStatus = async () => {
      try {
        const response = await fetch("/api/elevenlabs/status");
        if (!response.ok) {
          throw new Error("status failed");
        }
        const data = (await response.json()) as { configured?: boolean };
        if (isMounted) {
          setElevenLabsConfigured(Boolean(data.configured));
        }
      } catch {
        if (isMounted) {
          setElevenLabsConfigured(false);
        }
      }
    };

    void fetchStatus();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (elevenLabsConfigured === false) {
      if (ttsSetting) {
        onUpdateSettings?.({ ttsEnabled: false });
      }
      if (musicSetting) {
        onUpdateSettings?.({ musicEnabled: false });
      }
    }
  }, [elevenLabsConfigured, musicSetting, onUpdateSettings, ttsSetting]);

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
    if (e.nativeEvent.isComposing) {
      return;
    }

    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      e.currentTarget.form?.requestSubmit();
      return;
    }

    if (e.key === "Enter" && !e.shiftKey) {
      // Allow form submit
    }
  };

  const sendShortcut = formatShortcut(["mod", "enter"]);

  const stopTts = useCallback(() => {
    if (ttsAudioRef.current) {
      ttsAudioRef.current.pause();
      try {
        ttsAudioRef.current.currentTime = 0;
      } catch {
        // Ignore unsupported media API in non-browser environments.
      }
    }
    if (ttsUrlRef.current) {
      URL.revokeObjectURL(ttsUrlRef.current);
    }
    ttsAudioRef.current = null;
    ttsUrlRef.current = null;
    setTtsPlayingId(null);
    setTtsLoadingId(null);
  }, []);

  useEffect(() => {
    if (!ttsSetting) {
      stopTts();
    }
  }, [stopTts, ttsSetting]);

  useEffect(() => {
    return () => {
      stopTts();
    };
  }, [stopTts]);

  const playTts = useCallback(
    async (message: Message) => {
      if (!ttsSetting || elevenLabsConfigured === false) {
        return;
      }

      if (ttsPlayingId === message.id) {
        stopTts();
        return;
      }

      stopTts();
      setTtsLoadingId(message.id);
      setTtsUnavailable(false);

      const MAX_TTS_CHARS = 520;
      const text =
        message.content.length > MAX_TTS_CHARS
          ? `${message.content.slice(0, MAX_TTS_CHARS)}...`
          : message.content;

      try {
        const response = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        });

        if (!response.ok) {
          if (response.status === 503) {
            setElevenLabsConfigured(false);
            setTtsUnavailable(true);
          }
          const errorText = await response.text();
          throw new Error(errorText || "TTS request failed");
        }

        const buffer = await response.arrayBuffer();
        const blob = new Blob([buffer], { type: "audio/mpeg" });
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        ttsUrlRef.current = url;
        ttsAudioRef.current = audio;
        audio.onended = () => stopTts();
        setTtsLoadingId(null);
        setTtsPlayingId(message.id);
        await audio.play();
      } catch (error) {
        console.error("TTS playback failed:", error);
        setTtsLoadingId(null);
        setTtsPlayingId(null);
      }
    },
    [elevenLabsConfigured, stopTts, ttsPlayingId, ttsSetting]
  );

  const ttsDisabledReason = !ttsSetting
    ? "Enable voice playback in settings"
    : elevenLabsConfigured === false || ttsUnavailable
      ? "Set ELEVENLABS_API_KEY to enable voice"
      : undefined;

  return (
    <div
      className={cn(
        "flex flex-col h-full bg-[var(--aesthetic-background)]/90 border-l border-[var(--aesthetic-border)]/20 shadow-[-10px_0_20px_rgba(0,0,0,0.5)]",
        className
      )}
    >
      <div className="p-4 border-b border-[var(--aesthetic-border)]/20 bg-[var(--aesthetic-surface)]/95 sticky top-0 z-10 backdrop-blur-sm flex justify-between items-center">
        <h2 className="font-typewriter text-sm text-[var(--aesthetic-text)]/70 tracking-widest flex items-center gap-2">
          <Image
            src="/assets/noir/detective-avatar.jpg"
            alt="Detective avatar"
            width={32}
            height={32}
            className="w-8 h-8 rounded-full object-cover border border-[var(--aesthetic-accent)]/40 shadow-[0_0_10px_rgba(255,191,0,0.18)]"
          />
          <Bot className="w-4 h-4 text-[var(--aesthetic-accent)]/70" />
          INTERROGATION LOG
        </h2>
        <div className="flex items-center gap-2">
          {onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="w-9 h-9 flex items-center justify-center rounded-sm bg-[var(--aesthetic-background)]/30 border border-[var(--aesthetic-border)]/40 text-[var(--aesthetic-text)]/60 hover:text-[var(--aesthetic-accent)] hover:border-[var(--aesthetic-accent)]/40 transition-colors"
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
              className="w-9 h-9 flex items-center justify-center rounded-sm bg-[var(--aesthetic-background)]/30 border border-[var(--aesthetic-border)]/40 text-[var(--aesthetic-text)]/60 hover:text-[var(--aesthetic-accent)] hover:border-[var(--aesthetic-accent)]/40 transition-colors"
              title="Configuration"
              aria-label="Open settings"
            >
              <SettingsIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showSettings && onUpdateSettings && (
          <motion.div
            initial={{ height: 0, opacity: 0, overflow: "hidden" }}
            animate={{ height: "auto", opacity: 1, overflow: "visible" }}
            exit={{ height: 0, opacity: 0, overflow: "hidden" }}
            transition={{ duration: 0.2 }}
            className="border-b border-[var(--aesthetic-border)]/20 bg-[var(--aesthetic-surface)]/50"
          >
            <ChatSettingsPanel
              typewriterSpeed={typewriterSpeed}
              soundEnabled={soundSetting}
              ttsEnabled={ttsSetting}
              musicEnabled={musicSetting}
              ambient={ambient ?? {}}
              modelConfig={modelConfig}
              useA2UIv09={useA2UIv09}
              elevenLabsConfigured={elevenLabsConfigured}
              sfxControls={sfxControls}
              onUpdateSettings={onUpdateSettings}
              onModelConfigChange={onModelConfigChange}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <NoirSoundEffects enabled={soundSetting} onReady={setSfxControls} />

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.length === 0 && (
          <div className="text-center py-12 text-[var(--aesthetic-text)]/45 font-typewriter text-xs uppercase tracking-[0.2em] relative drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
            <Image
              src="/assets/noir/search-icon.jpg"
              alt="Search icon"
              width={80}
              height={80}
              className="absolute left-1/2 top-1/2 w-20 h-20 -translate-x-1/2 -translate-y-1/2 opacity-10 pointer-events-none"
            />
            <span className="relative z-10">No record found. Begin interrogation.</span>
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
                  ? "bg-[var(--aesthetic-accent)]/5 border-[var(--aesthetic-accent)]/20 ml-8 text-[var(--aesthetic-text)] shadow-sm"
                  : "bg-[var(--aesthetic-background)]/40 border-[var(--aesthetic-border)]/40 mr-8 text-[var(--aesthetic-text)] shadow-md"
              )}
            >
              {/* Decorative corner accents for 'Noir' feel */}
              <div
                className={cn(
                  "absolute w-1 h-1 top-[-1px] left-[-1px] border-t border-l",
                  m.role === "user"
                    ? "border-[var(--aesthetic-accent)]/30"
                    : "border-[var(--aesthetic-text)]/30"
                )}
              />
              <div
                className={cn(
                  "absolute w-1 h-1 bottom-[-1px] right-[-1px] border-b border-r",
                  m.role === "user"
                    ? "border-[var(--aesthetic-accent)]/30"
                    : "border-[var(--aesthetic-text)]/30"
                )}
              />

              <div
                className={cn(
                  "w-6 h-6 flex items-center justify-center rounded-full shrink-0 border shadow-inner",
                  m.role === "user"
                    ? "border-[var(--aesthetic-accent)]/50 text-[var(--aesthetic-accent)] bg-[var(--aesthetic-accent)]/5"
                    : "border-[var(--aesthetic-text)]/50 text-[var(--aesthetic-text)] bg-[var(--aesthetic-text)]/5"
                )}
              >
                {m.role === "user" ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
              </div>
              <div className="flex-1 whitespace-pre-wrap leading-relaxed opacity-90">
                {m.role === "user" ? (
                  m.content
                ) : (
                  <TypewriterText
                    content={m.content}
                    speed={typewriterSpeed}
                    glow={false}
                    showCursor={false}
                    className="text-xs leading-relaxed font-mono"
                  />
                )}
              </div>
              {m.role === "assistant" && (
                <button
                  type="button"
                  onClick={() => void playTts(m)}
                  disabled={!ttsSetting || elevenLabsConfigured === false || ttsLoadingId === m.id}
                  title={ttsDisabledReason}
                  aria-label={
                    ttsPlayingId === m.id
                      ? "Stop voice playback"
                      : ttsLoadingId === m.id
                        ? "Loading voice playback"
                        : "Play voice"
                  }
                  className={cn(
                    "absolute right-2 top-2 w-7 h-7 flex items-center justify-center rounded-sm border transition-colors",
                    "bg-[var(--aesthetic-background)]/40 border-[var(--aesthetic-border)]/40 text-[var(--aesthetic-text)]/60",
                    "hover:text-[var(--aesthetic-accent)] hover:border-[var(--aesthetic-accent)]/40",
                    "opacity-0 group-hover:opacity-100 focus-visible:opacity-100",
                    (ttsPlayingId === m.id || ttsLoadingId === m.id) && "opacity-100",
                    (!ttsSetting || elevenLabsConfigured === false) &&
                      "opacity-40 cursor-not-allowed"
                  )}
                >
                  {ttsLoadingId === m.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : ttsPlayingId === m.id ? (
                    <VolumeX className="w-3.5 h-3.5" />
                  ) : (
                    <Volume2 className="w-3.5 h-3.5" />
                  )}
                </button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-2 items-center text-[var(--aesthetic-text-muted)] text-xs font-mono pl-4 opacity-50"
          >
            <span className="w-2 h-2 bg-[var(--aesthetic-accent)]/50 rounded-full animate-pulse" />
            <span className="w-2 h-2 bg-[var(--aesthetic-accent)]/50 rounded-full animate-pulse delay-75" />
            <span className="w-2 h-2 bg-[var(--aesthetic-accent)]/50 rounded-full animate-pulse delay-150" />
            <span className="ml-2 uppercase tracking-wider text-[10px]">
              Processing Evidence...
            </span>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-[var(--aesthetic-surface)]/95 border-t border-[var(--aesthetic-border)]/20">
        <form onSubmit={onSubmit} className="relative">
          <input
            ref={inputRef}
            name="chat-input"
            autoFocus
            className="w-full bg-transparent border-b border-[var(--aesthetic-border)]/30 rounded-none py-3 pl-2 pr-10 text-sm text-[var(--aesthetic-text)] focus:outline-none focus:border-[var(--aesthetic-accent)]/50 font-mono placeholder:text-[var(--aesthetic-text)]/45 transition-colors"
            value={localInput}
            onChange={(e) => setLocalInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Type your command... (${sendShortcut} to send)`}
          />
          <button
            type="submit"
            disabled={isLoading || !localInput.trim()}
            aria-label="Send message"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--aesthetic-text-muted)] hover:text-[var(--aesthetic-accent)] disabled:opacity-30 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
