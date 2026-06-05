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
  Copy,
  Check,
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

/** Suggested first commands shown in the empty chat state. */
const STARTER_COMMANDS = [
  "Build a suspect profile card",
  "Lay out a case dashboard",
  "Draft a witness contact form",
];

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
  generatedTapes?: Array<{
    id: string;
    text: string;
    hash: string;
    createdAt: number;
  }>;
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
  generatedTapes = [],
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
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = async (content: string, id: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const ttsAudioRef = useRef<HTMLAudioElement | null>(null);
  const ttsUrlRef = useRef<string | null>(null);
  const ttsTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const soundSetting = soundEnabled;
  const ttsSetting = ttsEnabled ?? true;
  const musicSetting = musicEnabled ?? false;

  // Scroll only when a message is added/removed, not on every streamed-token
  // identity change (which caused a forced reflow per chunk).
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

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
    }
  }, [elevenLabsConfigured, onUpdateSettings, ttsSetting]);

  // Atmospheric Triggering Effect Scanner
  const triggeredAtmosphericRef = useRef<Record<string, Set<string>>>({});

  useEffect(() => {
    // If TTS is enabled, atmospheric events will trigger in sync with the spoken voice.
    // Otherwise, trigger them on the streaming/typewritten text.
    if (ttsSetting) return;

    if (messages.length === 0) return;

    // Find the last assistant message
    const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
    if (!lastAssistant) return;

    const messageId = lastAssistant.id;
    const content = lastAssistant.content.toLowerCase();

    if (!triggeredAtmosphericRef.current[messageId]) {
      triggeredAtmosphericRef.current[messageId] = new Set();
    }

    const triggered = triggeredAtmosphericRef.current[messageId];

    // 1. Thunder & Lightning keywords
    const THUNDER_KEYWORDS = ["lightning", "thunder", "relámpago", "trueno"];
    if (THUNDER_KEYWORDS.some((kw) => content.includes(kw)) && !triggered.has("thunder")) {
      if (sfxControls) {
        triggered.add("thunder");
        sfxControls.playThunder();
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("noir-lightning"));
        }
      }
    }

    // 2. Phone ringing keywords
    const PHONE_KEYWORDS = [
      "phone rang",
      "phone ring",
      "phone-ring",
      "telephone rang",
      "telephone ring",
      "phone rings",
      "telephone rings",
      "phone ringing",
      "telephone ringing",
      "teléfono sonó",
      "teléfono sonando",
    ];
    if (PHONE_KEYWORDS.some((kw) => content.includes(kw)) && !triggered.has("phone")) {
      if (sfxControls) {
        triggered.add("phone");
        sfxControls.playPhoneRing();
      }
    }

    // Gc triggeredAtmosphericRef to avoid memory leak
    const keys = Object.keys(triggeredAtmosphericRef.current);
    if (keys.length > 10) {
      delete triggeredAtmosphericRef.current[keys[0]];
    }
  }, [messages, sfxControls, ttsSetting]);

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
    // Clear any scheduled atmospheric timeouts
    ttsTimeoutsRef.current.forEach((t) => clearTimeout(t));
    ttsTimeoutsRef.current = [];

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

      // Nothing to speak (e.g. a tool-call-only assistant message with no text).
      if (!message.content || message.content.trim().length === 0) {
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

        const recordingHash = response.headers.get("x-recording-hash");
        if (recordingHash) {
          const alreadyExists = (generatedTapes || []).some((t) => t.hash === recordingHash);
          if (!alreadyExists) {
            const newTape = {
              id: message.id,
              text,
              hash: recordingHash,
              createdAt: Date.now(),
            };
            onUpdateSettings?.({
              generatedTapes: [...(generatedTapes || []), newTape],
            });
          }
        }

        // When audio starts playing, schedule the atmospheric effects based on estimated speaking timings
        if (sfxControls) {
          const contentLower = text.toLowerCase();
          const msPerChar = 65; // Heuristic: average 65ms per character speaking rate

          // 1. Check for thunder/lightning keywords
          const THUNDER_KEYWORDS = ["lightning", "thunder", "relámpago", "trueno"];
          THUNDER_KEYWORDS.forEach((kw) => {
            const index = contentLower.indexOf(kw);
            if (index !== -1) {
              const delay = index * msPerChar;
              const timer = setTimeout(() => {
                sfxControls.playThunder();
                if (typeof window !== "undefined") {
                  window.dispatchEvent(new CustomEvent("noir-lightning"));
                }
              }, delay);
              ttsTimeoutsRef.current.push(timer);
            }
          });

          // 2. Check for phone ringing keywords
          const PHONE_KEYWORDS = [
            "phone rang",
            "phone ring",
            "phone-ring",
            "telephone rang",
            "telephone ring",
            "phone rings",
            "telephone rings",
            "phone ringing",
            "telephone ringing",
            "teléfono sonó",
            "teléfono sonando",
          ];
          PHONE_KEYWORDS.forEach((kw) => {
            const index = contentLower.indexOf(kw);
            if (index !== -1) {
              const delay = index * msPerChar;
              const timer = setTimeout(() => {
                sfxControls.playPhoneRing();
              }, delay);
              ttsTimeoutsRef.current.push(timer);
            }
          });
        }
      } catch (error) {
        console.error("TTS playback failed:", error);
        // Fully tear down so a partially-created Audio/object URL is revoked
        // rather than leaked on an aborted playback.
        stopTts();
      }
    },
    [
      elevenLabsConfigured,
      stopTts,
      ttsPlayingId,
      ttsSetting,
      sfxControls,
      generatedTapes,
      onUpdateSettings,
    ]
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
              className="w-9 h-9 flex items-center justify-center rounded-sm bg-[var(--aesthetic-background)]/30 border border-[var(--aesthetic-border)]/40 text-[var(--aesthetic-text)]/60 hover:text-[var(--aesthetic-accent)] hover:border-[var(--aesthetic-accent)]/40 transition-colors focus-visible:ring-2 focus-visible:ring-[var(--aesthetic-accent)]"
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
              className="w-9 h-9 flex items-center justify-center rounded-sm bg-[var(--aesthetic-background)]/30 border border-[var(--aesthetic-border)]/40 text-[var(--aesthetic-text)]/60 hover:text-[var(--aesthetic-accent)] hover:border-[var(--aesthetic-accent)]/40 transition-colors focus-visible:ring-2 focus-visible:ring-[var(--aesthetic-accent)]"
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

      <div
        className="flex-1 overflow-y-auto p-4 space-y-6"
        aria-live="polite"
        aria-label="Chat messages"
      >
        {messages.length === 0 && (
          <div className="text-center py-12 text-[var(--aesthetic-text)]/45 font-typewriter text-xs uppercase tracking-[0.2em] relative drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
            <Image
              src="/assets/noir/search-icon-removebg-preview.png"
              alt="Search icon"
              width={80}
              height={80}
              className="absolute left-1/2 top-1/2 w-20 h-20 -translate-x-1/2 -translate-y-1/2 opacity-25 pointer-events-none mix-blend-screen"
            />
            <span className="relative z-10">No record found. Begin interrogation.</span>
            <div className="relative z-10 mt-5 flex flex-col gap-2 max-w-xs mx-auto">
              {STARTER_COMMANDS.map((text) => (
                <button
                  key={text}
                  type="button"
                  onClick={() => {
                    void sendMessage({ text });
                  }}
                  className="w-full text-left border border-[var(--aesthetic-border)]/40 rounded-sm px-3 py-2 font-mono text-[11px] normal-case tracking-normal text-[var(--aesthetic-text)]/70 hover:border-[var(--aesthetic-accent)]/50 hover:text-[var(--aesthetic-accent)] transition-colors focus-visible:ring-2 focus-visible:ring-[var(--aesthetic-accent)]"
                >
                  <span className="text-[var(--aesthetic-accent)]/40 mr-2">&gt;</span>
                  {text}
                </button>
              ))}
            </div>
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
                <div
                  className={cn(
                    "absolute right-2 top-2 flex items-center gap-1 transition-opacity",
                    ttsPlayingId === m.id || ttsLoadingId === m.id || copiedId === m.id
                      ? "opacity-100"
                      : "opacity-0 group-hover:opacity-100 focus-within:opacity-100"
                  )}
                >
                  <button
                    type="button"
                    onClick={() => handleCopy(m.content, m.id)}
                    aria-label={copiedId === m.id ? "Copied" : "Copy message"}
                    title={copiedId === m.id ? "Copied" : "Copy message"}
                    className={cn(
                      "w-7 h-7 flex items-center justify-center rounded-sm border transition-colors",
                      "bg-[var(--aesthetic-background)]/40 border-[var(--aesthetic-border)]/40 text-[var(--aesthetic-text)]/60",
                      "hover:text-[var(--aesthetic-accent)] hover:border-[var(--aesthetic-accent)]/40",
                      "focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-[var(--aesthetic-accent)]",
                      copiedId === m.id &&
                        "text-[var(--aesthetic-accent)] border-[var(--aesthetic-accent)]/40"
                    )}
                  >
                    {copiedId === m.id ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => void playTts(m)}
                    disabled={
                      !ttsSetting || elevenLabsConfigured === false || ttsLoadingId === m.id
                    }
                    title={
                      ttsDisabledReason ??
                      (ttsPlayingId === m.id
                        ? "Stop voice playback"
                        : ttsLoadingId === m.id
                          ? "Loading voice playback"
                          : "Play voice")
                    }
                    aria-label={
                      ttsPlayingId === m.id
                        ? "Stop voice playback"
                        : ttsLoadingId === m.id
                          ? "Loading voice playback"
                          : "Play voice"
                    }
                    className={cn(
                      "w-7 h-7 flex items-center justify-center rounded-sm border transition-colors",
                      "bg-[var(--aesthetic-background)]/40 border-[var(--aesthetic-border)]/40 text-[var(--aesthetic-text)]/60",
                      "hover:text-[var(--aesthetic-accent)] hover:border-[var(--aesthetic-accent)]/40",
                      "focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-[var(--aesthetic-accent)]",
                      (!ttsSetting || elevenLabsConfigured === false) &&
                        "opacity-40 cursor-not-allowed"
                    )}
                  >
                    {ttsLoadingId === m.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--aesthetic-accent)]" />
                    ) : ttsPlayingId === m.id ? (
                      // Wire-tap equalizer: the transmission is live.
                      <span className="flex items-end gap-[2px] h-3.5" aria-hidden="true">
                        <span className="eq-bar w-[2px] h-full bg-[var(--aesthetic-accent)] [animation-delay:0ms]" />
                        <span className="eq-bar w-[2px] h-full bg-[var(--aesthetic-accent)] [animation-delay:150ms]" />
                        <span className="eq-bar w-[2px] h-full bg-[var(--aesthetic-accent)] [animation-delay:300ms]" />
                      </span>
                    ) : (
                      <Volume2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            role="status"
            aria-live="polite"
            className="flex gap-2 items-center text-[var(--aesthetic-text-muted)] text-xs font-mono pl-4"
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
        {ttsDisabledReason && (
          <div className="mb-2 inline-flex items-center gap-2 font-typewriter text-[10px] uppercase tracking-[0.2em] text-[var(--aesthetic-text)]/45">
            <span
              className="w-1.5 h-1.5 rounded-full bg-[var(--aesthetic-error)]/60"
              aria-hidden="true"
            />
            {elevenLabsConfigured === false || ttsUnavailable
              ? "Wire dead — set ELEVENLABS_API_KEY"
              : "Voice off — enable in settings"}
          </div>
        )}
        <form onSubmit={onSubmit} className="relative">
          <input
            ref={inputRef}
            name="chat-input"
            aria-label="Type your command"
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
            aria-label={isLoading ? "Sending message..." : "Send message"}
            title={
              isLoading
                ? "Sending message..."
                : !localInput.trim()
                  ? "Type a command to send"
                  : "Send message"
            }
            className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--aesthetic-text-muted)] hover:text-[var(--aesthetic-accent)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors focus-visible:ring-2 focus-visible:ring-[var(--aesthetic-accent)]"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
