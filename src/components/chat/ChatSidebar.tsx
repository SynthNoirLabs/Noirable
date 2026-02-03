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
  Keyboard,
  CloudLightning,
  Phone,
} from "lucide-react";
import type { UseChatHelpers } from "@ai-sdk/react";
import type { UIMessage } from "ai";
import { cn } from "@/lib/utils";
import { NoirSoundEffects } from "@/components/noir/NoirSoundEffects";
import { TypewriterText } from "@/components/noir/TypewriterText";
import { ModelSelector } from "@/components/settings/ModelSelector";
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
  // `persist` may rehydrate older saved settings that don't include newly added fields.
  // Merge with defaults to avoid undefined values.
  const ambientSettings: AmbientSettings = {
    rainEnabled: true,
    rainVolume: 1,
    fogEnabled: true,
    intensity: "medium",
    crackleEnabled: false,
    crackleVolume: 0.35,
    ...(ambient ?? {}),
  };

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

  const toggleSpeed = () => {
    const newSpeed = typewriterSpeed === 0 ? 30 : 0;
    onUpdateSettings?.({ typewriterSpeed: newSpeed });
  };

  const toggleSound = () => {
    onUpdateSettings?.({ soundEnabled: !soundSetting });
  };

  const toggleTts = () => {
    if (elevenLabsConfigured === false) {
      return;
    }
    onUpdateSettings?.({ ttsEnabled: !ttsSetting });
  };

  const toggleMusic = () => {
    if (elevenLabsConfigured === false) {
      return;
    }
    onUpdateSettings?.({ musicEnabled: !musicSetting });
  };

  const toggleRain = () => {
    onUpdateSettings?.({
      ambient: { rainEnabled: !ambientSettings.rainEnabled },
    });
  };

  const toggleFog = () => {
    onUpdateSettings?.({
      ambient: { fogEnabled: !ambientSettings.fogEnabled },
    });
  };

  const toggleCrackle = () => {
    onUpdateSettings?.({
      ambient: { crackleEnabled: !ambientSettings.crackleEnabled },
    });
  };

  const handleCrackleVolume = (value: number) => {
    onUpdateSettings?.({
      ambient: { crackleVolume: value },
    });
  };

  const handleRainVolume = (value: number) => {
    onUpdateSettings?.({
      ambient: { rainVolume: value },
    });
  };

  const setIntensity = (intensity: AmbientSettings["intensity"]) => {
    onUpdateSettings?.({ ambient: { intensity } });
  };

  const toggleA2UIv09 = () => {
    onUpdateSettings?.({ useA2UIv09: !useA2UIv09 });
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
  const sfxDisabledReason = !soundSetting
    ? "Enable sound effects"
    : elevenLabsConfigured === false
      ? "Set ELEVENLABS_API_KEY to enable effects"
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
        {showSettings && (
          <motion.div
            initial={{ height: 0, opacity: 0, overflow: "hidden" }}
            animate={{ height: "auto", opacity: 1, overflow: "visible" }}
            exit={{ height: 0, opacity: 0, overflow: "hidden" }}
            transition={{ duration: 0.2 }}
            className="border-b border-[var(--aesthetic-border)]/20 bg-[var(--aesthetic-surface)]/50"
          >
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-[1fr_auto] items-center gap-3 text-xs font-mono">
                <span className="text-[var(--aesthetic-text)]/70">A2UI v0.9</span>
                <button
                  onClick={toggleA2UIv09}
                  className={cn(
                    "px-2 py-1 border rounded-sm transition-colors min-w-[84px] text-center",
                    useA2UIv09
                      ? "border-[var(--aesthetic-accent)] text-[var(--aesthetic-accent)] bg-[var(--aesthetic-accent)]/10"
                      : "border-[var(--aesthetic-border)]/50 text-[var(--aesthetic-text-muted)] hover:border-[var(--aesthetic-text)]"
                  )}
                  aria-label="Toggle A2UI v0.9 mode"
                  aria-pressed={useA2UIv09}
                >
                  {useA2UIv09 ? "ON" : "OFF"}
                </button>
              </div>
              <div className="grid grid-cols-[1fr_auto] items-center gap-3 text-xs font-mono">
                <span className="text-[var(--aesthetic-text)]/70">TYPEWRITER SPEED</span>
                <button
                  onClick={toggleSpeed}
                  className={cn(
                    "px-2 py-1 border rounded-sm transition-colors min-w-[84px] text-center",
                    typewriterSpeed === 0
                      ? "border-[var(--aesthetic-accent)] text-[var(--aesthetic-accent)] bg-[var(--aesthetic-accent)]/10"
                      : "border-[var(--aesthetic-border)]/50 text-[var(--aesthetic-text-muted)] hover:border-[var(--aesthetic-text)]"
                  )}
                >
                  {typewriterSpeed === 0 ? "INSTANT" : "NORMAL"}
                </button>
              </div>
              <div className="grid grid-cols-[1fr_auto] items-center gap-3 text-xs font-mono">
                <span className="text-[var(--aesthetic-text)]/70">SOUND FX</span>
                <button
                  onClick={toggleSound}
                  className={cn(
                    "px-2 py-1 border rounded-sm transition-colors min-w-[84px] text-center",
                    soundSetting
                      ? "border-[var(--aesthetic-accent)] text-[var(--aesthetic-accent)] bg-[var(--aesthetic-accent)]/10"
                      : "border-[var(--aesthetic-border)]/50 text-[var(--aesthetic-text-muted)] hover:border-[var(--aesthetic-text)]"
                  )}
                  aria-label="Toggle sound effects"
                  aria-pressed={soundSetting}
                >
                  {soundSetting ? "ON" : "OFF"}
                </button>
              </div>
              <div className="grid grid-cols-[1fr_auto] items-center gap-3 text-xs font-mono">
                <span className="text-[var(--aesthetic-text)]/70">VOICE (TTS)</span>
                <button
                  onClick={toggleTts}
                  disabled={elevenLabsConfigured === false}
                  title={elevenLabsConfigured === false ? "Set ELEVENLABS_API_KEY to enable" : ""}
                  className={cn(
                    "px-2 py-1 border rounded-sm transition-colors min-w-[84px] text-center",
                    ttsSetting
                      ? "border-[var(--aesthetic-accent)] text-[var(--aesthetic-accent)] bg-[var(--aesthetic-accent)]/10"
                      : "border-[var(--aesthetic-border)]/50 text-[var(--aesthetic-text-muted)] hover:border-[var(--aesthetic-text)]",
                    elevenLabsConfigured === false && "opacity-50 cursor-not-allowed"
                  )}
                  aria-label="Toggle voice playback"
                  aria-pressed={ttsSetting}
                >
                  {ttsSetting ? "ON" : "OFF"}
                </button>
              </div>
              <div className="grid grid-cols-[1fr_auto] items-center gap-3 text-xs font-mono">
                <span className="text-[var(--aesthetic-text)]/70">NOIR MUSIC</span>
                <button
                  onClick={toggleMusic}
                  disabled={elevenLabsConfigured === false}
                  title={elevenLabsConfigured === false ? "Set ELEVENLABS_API_KEY to enable" : ""}
                  className={cn(
                    "px-2 py-1 border rounded-sm transition-colors min-w-[84px] text-center",
                    musicSetting
                      ? "border-[var(--aesthetic-accent)] text-[var(--aesthetic-accent)] bg-[var(--aesthetic-accent)]/10"
                      : "border-[var(--aesthetic-border)]/50 text-[var(--aesthetic-text-muted)] hover:border-[var(--aesthetic-text)]",
                    elevenLabsConfigured === false && "opacity-50 cursor-not-allowed"
                  )}
                  aria-label="Toggle noir music"
                  aria-pressed={musicSetting}
                >
                  {musicSetting ? "ON" : "OFF"}
                </button>
              </div>
              <div className="grid grid-cols-[1fr_auto] items-center gap-3 text-xs font-mono">
                <span className="text-[var(--aesthetic-text)]/70">FX TRIGGERS</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => sfxControls?.playTypewriter()}
                    disabled={!soundSetting || elevenLabsConfigured === false}
                    title={sfxDisabledReason}
                    className={cn(
                      "w-8 h-8 flex items-center justify-center rounded-sm border transition-colors",
                      soundSetting
                        ? "border-[var(--aesthetic-border)]/40 text-[var(--aesthetic-text)]/70 hover:text-[var(--aesthetic-accent)] hover:border-[var(--aesthetic-accent)]/50"
                        : "border-[var(--aesthetic-border)]/30 text-[var(--aesthetic-text-muted)]",
                      (!soundSetting || elevenLabsConfigured === false) &&
                        "opacity-50 cursor-not-allowed"
                    )}
                    aria-label="Play typewriter"
                  >
                    <Keyboard className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => sfxControls?.playThunder()}
                    disabled={!soundSetting || elevenLabsConfigured === false}
                    title={sfxDisabledReason}
                    className={cn(
                      "w-8 h-8 flex items-center justify-center rounded-sm border transition-colors",
                      soundSetting
                        ? "border-[var(--aesthetic-border)]/40 text-[var(--aesthetic-text)]/70 hover:text-[var(--aesthetic-accent)] hover:border-[var(--aesthetic-accent)]/50"
                        : "border-[var(--aesthetic-border)]/30 text-[var(--aesthetic-text-muted)]",
                      (!soundSetting || elevenLabsConfigured === false) &&
                        "opacity-50 cursor-not-allowed"
                    )}
                    aria-label="Play thunder"
                  >
                    <CloudLightning className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => sfxControls?.playPhoneRing()}
                    disabled={!soundSetting || elevenLabsConfigured === false}
                    title={sfxDisabledReason}
                    className={cn(
                      "w-8 h-8 flex items-center justify-center rounded-sm border transition-colors",
                      soundSetting
                        ? "border-[var(--aesthetic-border)]/40 text-[var(--aesthetic-text)]/70 hover:text-[var(--aesthetic-accent)] hover:border-[var(--aesthetic-accent)]/50"
                        : "border-[var(--aesthetic-border)]/30 text-[var(--aesthetic-text-muted)]",
                      (!soundSetting || elevenLabsConfigured === false) &&
                        "opacity-50 cursor-not-allowed"
                    )}
                    aria-label="Play phone ring"
                  >
                    <Phone className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="border-t border-[var(--aesthetic-border)]/30 pt-4 space-y-3">
                <div className="text-xs font-mono uppercase tracking-widest text-[var(--aesthetic-text)]/60">
                  Ambience
                </div>
                <div className="grid grid-cols-[1fr_auto] items-center gap-3 text-xs font-mono">
                  <span className="text-[var(--aesthetic-text)]/70">RAIN</span>
                  <button
                    onClick={toggleRain}
                    className={cn(
                      "px-2 py-1 border rounded-sm transition-colors min-w-[84px] text-center",
                      ambientSettings.rainEnabled
                        ? "border-[var(--aesthetic-accent)] text-[var(--aesthetic-accent)] bg-[var(--aesthetic-accent)]/10"
                        : "border-[var(--aesthetic-border)]/50 text-[var(--aesthetic-text-muted)] hover:border-[var(--aesthetic-text)]"
                    )}
                    aria-label="Toggle rain"
                    aria-pressed={ambientSettings.rainEnabled}
                  >
                    {ambientSettings.rainEnabled ? "ON" : "OFF"}
                  </button>
                </div>
                {ambientSettings.rainEnabled && (
                  <div className="text-xs font-mono">
                    <div className="flex items-center justify-between text-[var(--aesthetic-text)]/70">
                      <span>RAIN VOLUME</span>
                      <span>{Math.round(ambientSettings.rainVolume * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={1}
                      value={Math.round(ambientSettings.rainVolume * 100)}
                      onChange={(event) =>
                        handleRainVolume(Number(event.currentTarget.value) / 100)
                      }
                      aria-label="Rain volume"
                      className="w-full mt-2 accent-[var(--aesthetic-accent)]"
                    />
                  </div>
                )}
                <div className="grid grid-cols-[1fr_auto] items-center gap-3 text-xs font-mono">
                  <span className="text-[var(--aesthetic-text)]/70">FOG</span>
                  <button
                    onClick={toggleFog}
                    className={cn(
                      "px-2 py-1 border rounded-sm transition-colors min-w-[84px] text-center",
                      ambientSettings.fogEnabled
                        ? "border-[var(--aesthetic-accent)] text-[var(--aesthetic-accent)] bg-[var(--aesthetic-accent)]/10"
                        : "border-[var(--aesthetic-border)]/50 text-[var(--aesthetic-text-muted)] hover:border-[var(--aesthetic-text)]"
                    )}
                    aria-label="Toggle fog"
                    aria-pressed={ambientSettings.fogEnabled}
                  >
                    {ambientSettings.fogEnabled ? "ON" : "OFF"}
                  </button>
                </div>
                <div className="grid grid-cols-[1fr_auto] items-center gap-3 text-xs font-mono">
                  <span className="text-[var(--aesthetic-text)]/70">VINYL CRACKLE</span>
                  <button
                    onClick={toggleCrackle}
                    className={cn(
                      "px-2 py-1 border rounded-sm transition-colors min-w-[84px] text-center",
                      ambientSettings.crackleEnabled
                        ? "border-[var(--aesthetic-accent)] text-[var(--aesthetic-accent)] bg-[var(--aesthetic-accent)]/10"
                        : "border-[var(--aesthetic-border)]/50 text-[var(--aesthetic-text-muted)] hover:border-[var(--aesthetic-text)]"
                    )}
                    aria-label="Toggle crackle"
                    aria-pressed={ambientSettings.crackleEnabled}
                  >
                    {ambientSettings.crackleEnabled ? "ON" : "OFF"}
                  </button>
                </div>
                {ambientSettings.crackleEnabled && (
                  <div className="text-xs font-mono">
                    <div className="flex items-center justify-between text-[var(--aesthetic-text)]/70">
                      <span>CRACKLE VOLUME</span>
                      <span>{Math.round(ambientSettings.crackleVolume * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={1}
                      value={Math.round(ambientSettings.crackleVolume * 100)}
                      onChange={(event) =>
                        handleCrackleVolume(Number(event.currentTarget.value) / 100)
                      }
                      aria-label="Crackle volume"
                      className="w-full mt-2 accent-[var(--aesthetic-accent)]"
                    />
                  </div>
                )}
                <div className="text-xs font-mono">
                  <span className="text-[var(--aesthetic-text)]/70">INTENSITY</span>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {(["low", "medium", "high"] as const).map((level) => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setIntensity(level)}
                        className={cn(
                          "px-2 py-1 border rounded-sm uppercase tracking-widest text-[10px] transition-colors w-full",
                          ambientSettings.intensity === level
                            ? "border-[var(--aesthetic-accent)] text-[var(--aesthetic-accent)] bg-[var(--aesthetic-accent)]/10"
                            : "border-[var(--aesthetic-border)]/50 text-[var(--aesthetic-text-muted)] hover:border-[var(--aesthetic-text)]"
                        )}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              {modelConfig && onModelConfigChange && (
                <ModelSelector modelConfig={modelConfig} onConfigChange={onModelConfigChange} />
              )}
            </div>
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
