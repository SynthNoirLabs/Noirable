import React, { useState, useEffect, useRef } from "react";
import { useA2UIStore } from "@/lib/store/useA2UIStore";
import { useCustomProfileStore } from "@/lib/store/useCustomProfileStore";
import { getDefaultVoiceId } from "@/lib/aesthetic/voice-defaults";
import { cn } from "@/lib/utils";
import {
  Mic,
  Play,
  Settings2,
  Volume2,
  Activity,
  Wind,
  ChevronDown,
  Check,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Voice {
  id: string;
  name: string;
  previewUrl: string | null;
  labels: Record<string, string>;
  description: string | null;
}

interface VoiceListResponse {
  voices: Voice[];
}

export function VoiceCustomization() {
  const { settings, updateSettings } = useA2UIStore();
  const activeProfile = useCustomProfileStore((state) => {
    if (!state.activeCustomProfileId) return null;
    return state.customProfiles.find((p) => p.id === state.activeCustomProfileId) ?? null;
  });
  const updateProfile = useCustomProfileStore((state) => state.updateProfile);

  const [voices, setVoices] = useState<Voice[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [manualInputMode, setManualInputMode] = useState(false);
  const [justReset, setJustReset] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const voiceSettings = activeProfile ? activeProfile.voice || {} : settings.voiceSettings || {};
  const currentVoiceId = voiceSettings.voiceId || "";
  // When no voice override is set, fall back to the active aesthetic's preset
  // default so the UI shows and previews the right voice (e.g. noir's deep
  // detective) instead of an empty/disabled state.
  const activeAestheticId = activeProfile?.baseAestheticId ?? settings.aestheticId;
  const effectiveVoiceId = currentVoiceId || getDefaultVoiceId(activeAestheticId);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch voices
  useEffect(() => {
    async function fetchVoices() {
      setIsLoading(true);
      setError(null);
      try {
        const headers: HeadersInit = {};
        if (settings.apiKeys?.elevenlabs) {
          headers["x-elevenlabs-api-key"] = settings.apiKeys.elevenlabs;
        }

        const response = await fetch("/api/elevenlabs/voices", { headers });

        if (response.status === 401) {
          throw new Error("Missing API Key");
        }

        if (!response.ok) {
          throw new Error("Failed to fetch voices");
        }

        const data: VoiceListResponse = await response.json();
        setVoices(data.voices);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        // If fetch fails, default to manual input mode so user can still work
        setManualInputMode(true);
      } finally {
        setIsLoading(false);
      }
    }

    fetchVoices();
  }, [settings.apiKeys?.elevenlabs]);

  const handleVoiceSelect = (voiceId: string) => {
    if (activeProfile) {
      updateProfile(activeProfile.id, {
        voice: {
          ...voiceSettings,
          voiceId,
        },
      });
    } else {
      updateSettings({
        voiceSettings: {
          ...voiceSettings,
          voiceId,
        },
      });
    }
    setIsDropdownOpen(false);
    setManualInputMode(voiceId === "custom");
  };

  const handleSettingChange = (key: keyof typeof voiceSettings, value: number) => {
    if (activeProfile) {
      updateProfile(activeProfile.id, {
        voice: {
          ...voiceSettings,
          [key]: value,
        },
      });
    } else {
      updateSettings({
        voiceSettings: {
          ...voiceSettings,
          [key]: value,
        },
      });
    }
  };

  const handleReset = () => {
    if (activeProfile) {
      updateProfile(activeProfile.id, {
        voice: undefined,
      });
    } else {
      updateSettings({
        voiceSettings: undefined,
      });
    }
    setManualInputMode(false);
    setJustReset(true);
    setTimeout(() => setJustReset(false), 2000);
  };

  const handlePreview = async () => {
    if (isPlaying) return;

    setIsPlaying(true);
    try {
      const text = "The rain never stops in this town. Neither does the code.";
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };

      if (settings.apiKeys?.elevenlabs) {
        headers["x-elevenlabs-api-key"] = settings.apiKeys.elevenlabs;
      }

      const response = await fetch("/api/tts", {
        method: "POST",
        headers,
        body: JSON.stringify({
          text,
          // Use the effective voice (override or preset default) and pass the
          // aesthetic so the server can resolve the preset voice too.
          voiceId: effectiveVoiceId,
          aestheticId: activeAestheticId,
          modelId: "eleven_monolingual_v1", // Default model
          voiceSettings: {
            stability: voiceSettings.stability ?? 0.5,
            similarity_boost: voiceSettings.similarityBoost ?? 0.75,
            style: voiceSettings.style ?? 0,
            speed: voiceSettings.speed ?? 1.0,
            use_speaker_boost: true,
          },
        }),
      });

      if (!response.ok) throw new Error("TTS failed");

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.play();
        audioRef.current.onended = () => {
          setIsPlaying(false);
          URL.revokeObjectURL(audioUrl);
        };
      }
    } catch (err) {
      console.error("Preview failed:", err);
      setIsPlaying(false);
    }
  };

  const currentVoice = voices.find((v) => v.id === currentVoiceId);
  // Name to show when relying on the preset default (no explicit override).
  const effectiveVoiceName = currentVoiceId
    ? undefined
    : (() => {
        const match = voices.find((v) => v.id === effectiveVoiceId);
        return match ? `${match.name} (Preset Default)` : "Preset Default";
      })();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-1 opacity-50">
        <div className="h-px bg-[var(--aesthetic-border)]/30 flex-1" />
        <span className="text-[10px] font-mono text-[var(--aesthetic-accent)] uppercase tracking-widest">
          Voice Synthesis
        </span>
        <div className="h-px bg-[var(--aesthetic-border)]/30 flex-1" />
      </div>

      <audio ref={audioRef} className="hidden" />

      {/* API Key Warning */}
      {error === "Missing API Key" && (
        <div className="p-3 border border-yellow-500/30 bg-yellow-500/5 rounded text-xs text-yellow-500 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>Please configure ElevenLabs API Key in settings</span>
        </div>
      )}

      {/* Voice Selector */}
      <div className="space-y-2">
        <label className="text-[10px] font-typewriter text-[var(--aesthetic-text)]/60 uppercase tracking-wider flex items-center gap-1.5">
          <Mic className="w-3 h-3 text-[var(--aesthetic-accent)]/70" />
          Voice Persona
        </label>

        {manualInputMode ? (
          <div className="relative group">
            <input
              type="text"
              value={currentVoiceId}
              onChange={(e) => handleVoiceSelect(e.target.value)}
              placeholder="Enter Voice ID..."
              className="w-full bg-transparent border-b border-[var(--aesthetic-border)]/30 py-2 pl-0 pr-20 text-xs font-mono text-[var(--aesthetic-text)] placeholder:text-[var(--aesthetic-text-muted)]/30 focus:outline-none focus:border-[var(--aesthetic-accent)] transition-colors"
            />
            <button
              onClick={() => setManualInputMode(false)}
              className="absolute right-0 top-1/2 -translate-y-1/2 text-[10px] text-[var(--aesthetic-accent)] hover:underline"
            >
              Select List
            </button>
          </div>
        ) : (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => !isLoading && setIsDropdownOpen(!isDropdownOpen)}
              disabled={isLoading}
              aria-haspopup="listbox"
              aria-expanded={isDropdownOpen}
              aria-controls="voice-listbox"
              title={isLoading ? "Loading voices..." : undefined}
              className={cn(
                "w-full flex items-center justify-between px-3 py-2 text-xs font-mono transition-all duration-200",
                "bg-[var(--aesthetic-surface)]/50 border rounded-sm outline-none focus:ring-1 focus:ring-[var(--aesthetic-accent)]/30",
                isDropdownOpen
                  ? "border-[var(--aesthetic-accent)] text-[var(--aesthetic-accent)] bg-[var(--aesthetic-accent)]/5"
                  : "border-[var(--aesthetic-border)]/30 text-[var(--aesthetic-text)] hover:border-[var(--aesthetic-border)]/60 hover:bg-[var(--aesthetic-text)]/5",
                isLoading && "opacity-50 cursor-wait"
              )}
            >
              <span className="truncate">
                {isLoading
                  ? "Loading voices..."
                  : currentVoice?.name || currentVoiceId || effectiveVoiceName || "Select Voice..."}
              </span>
              {isLoading ? (
                <Loader2 className="w-3 h-3 animate-spin text-[var(--aesthetic-accent)]" />
              ) : (
                <ChevronDown
                  className={cn(
                    "w-3 h-3 transition-transform duration-200 opacity-70",
                    isDropdownOpen && "rotate-180 text-[var(--aesthetic-accent)]"
                  )}
                />
              )}
            </button>

            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div
                  id="voice-listbox"
                  role="listbox"
                  initial={{ opacity: 0, y: -5, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -5, scale: 0.98 }}
                  transition={{ duration: 0.15, ease: "circOut" }}
                  className="absolute top-full left-0 right-0 mt-1 z-50 overflow-hidden rounded-sm border border-[var(--aesthetic-border)]/30 bg-[var(--aesthetic-surface)]/95 shadow-xl backdrop-blur-md"
                >
                  <div className="max-h-[200px] overflow-y-auto py-1 scrollbar-thin scrollbar-thumb-[var(--aesthetic-border)]/20">
                    <button
                      role="option"
                      aria-selected={currentVoiceId === "custom"}
                      onClick={() => handleVoiceSelect("custom")}
                      className="w-full text-left px-3 py-2 text-xs font-mono text-[var(--aesthetic-accent)] hover:bg-[var(--aesthetic-accent)]/10 border-b border-[var(--aesthetic-border)]/10"
                    >
                      + Enter Custom Voice ID
                    </button>
                    {voices.map((voice) => (
                      <button
                        key={voice.id}
                        role="option"
                        aria-selected={currentVoiceId === voice.id}
                        onClick={() => handleVoiceSelect(voice.id)}
                        className={cn(
                          "w-full text-left px-3 py-2 text-xs font-mono flex items-center justify-between group transition-colors",
                          currentVoiceId === voice.id
                            ? "bg-[var(--aesthetic-accent)]/10 text-[var(--aesthetic-accent)] border-l-2 border-l-[var(--aesthetic-accent)] pl-[10px]"
                            : "text-[var(--aesthetic-text)]/80 hover:bg-[var(--aesthetic-text)]/5 hover:text-[var(--aesthetic-text)] border-l-2 border-l-transparent"
                        )}
                      >
                        <div className="flex flex-col overflow-hidden">
                          <span className="truncate">{voice.name}</span>
                          <span className="text-[9px] text-[var(--aesthetic-text-muted)] truncate">
                            {voice.labels?.accent} {voice.labels?.gender} {voice.labels?.age}
                          </span>
                        </div>
                        {currentVoiceId === voice.id && (
                          <Check className="w-3 h-3 text-[var(--aesthetic-accent)] flex-shrink-0 ml-2" />
                        )}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {currentVoice?.description && (
          <p className="text-[10px] text-[var(--aesthetic-text-muted)] italic px-1">
            &quot;{currentVoice.description}&quot;
          </p>
        )}
      </div>

      {/* Sliders */}
      <div className="space-y-4">
        <SliderControl
          label="Stability"
          icon={<Activity className="w-3 h-3" />}
          value={voiceSettings.stability ?? 0.5}
          min={0}
          max={1}
          step={0.01}
          onChange={(v) => handleSettingChange("stability", v)}
        />
        <SliderControl
          label="Similarity"
          icon={<Volume2 className="w-3 h-3" />}
          value={voiceSettings.similarityBoost ?? 0.75}
          min={0}
          max={1}
          step={0.01}
          onChange={(v) => handleSettingChange("similarityBoost", v)}
        />
        <SliderControl
          label="Style Exaggeration"
          icon={<Settings2 className="w-3 h-3" />}
          value={voiceSettings.style ?? 0}
          min={0}
          max={1}
          step={0.01}
          onChange={(v) => handleSettingChange("style", v)}
        />
        <SliderControl
          label="Speed"
          icon={<Wind className="w-3 h-3" />}
          value={voiceSettings.speed ?? 1.0}
          min={0.7}
          max={1.2}
          step={0.01}
          onChange={(v) => handleSettingChange("speed", v)}
        />
      </div>

      {/* Preview Button */}
      <div className="pt-2 flex flex-col gap-2">
        <button
          onClick={handlePreview}
          disabled={isPlaying || !effectiveVoiceId}
          title={
            isPlaying
              ? "Synthesizing voice..."
              : !effectiveVoiceId
                ? "Select a voice to preview"
                : undefined
          }
          className={cn(
            "w-full flex items-center justify-center gap-2 px-4 py-2 text-xs font-mono uppercase tracking-wider transition-all duration-300 rounded-sm border",
            isPlaying
              ? "bg-[var(--aesthetic-accent)] text-[var(--aesthetic-bg)] border-[var(--aesthetic-accent)]"
              : "bg-transparent text-[var(--aesthetic-accent)] border-[var(--aesthetic-accent)]/50 hover:bg-[var(--aesthetic-accent)]/10 hover:border-[var(--aesthetic-accent)]",
            !effectiveVoiceId && "opacity-50 cursor-not-allowed grayscale"
          )}
        >
          {isPlaying ? (
            <>
              <Loader2 className="w-3 h-3 animate-spin" />
              Synthesizing...
            </>
          ) : (
            <>
              <Play className="w-3 h-3 fill-current" />
              Preview Voice
            </>
          )}
        </button>

        <button
          onClick={handleReset}
          className={cn(
            "w-full flex items-center justify-center gap-2 px-4 py-2 text-xs font-mono uppercase tracking-wider transition-all duration-300 rounded-sm border",
            justReset
              ? "border-green-500 text-green-500 bg-green-500/10"
              : "border-[var(--aesthetic-border)]/40 text-[var(--aesthetic-text-muted)] hover:bg-[var(--aesthetic-text)]/5 hover:text-[var(--aesthetic-text)]"
          )}
        >
          {justReset ? "Reset to Preset Default ✓" : "Reset to Preset Default"}
        </button>
      </div>
    </div>
  );
}

function SliderControl({
  label,
  icon,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  icon: React.ReactNode;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (val: number) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center text-[10px] text-[var(--aesthetic-text-muted)] uppercase tracking-wider">
        <div className="flex items-center gap-1.5">
          <span className="text-[var(--aesthetic-accent)]/70">{icon}</span>
          {label}
        </div>
        <span className="font-mono text-[var(--aesthetic-accent)]">{value.toFixed(2)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1 bg-[var(--aesthetic-surface-alt)]/30 rounded-lg appearance-none cursor-pointer accent-[var(--aesthetic-accent)] hover:accent-[var(--aesthetic-accent)]/80 transition-all"
      />
    </div>
  );
}
