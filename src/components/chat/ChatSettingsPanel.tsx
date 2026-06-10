"use client";

import { useState } from "react";
import {
  Keyboard,
  CloudLightning,
  Phone,
  Music,
  Trash2,
  Play,
  ChevronDown,
  ChevronUp,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ModelSelector } from "@/components/settings/ModelSelector";
import { ImageModelSelector } from "@/components/settings/ImageModelSelector";
import { useA2UIStore } from "@/lib/store/useA2UIStore";
import type { AmbientSettings, ModelConfig, SettingsUpdate } from "@/lib/store/useA2UIStore";
import { useResolvedAesthetic } from "@/lib/aesthetic/useResolvedAesthetic";
import { getMusicPresets, getMusicStylePrompt } from "@/lib/aesthetic/identity";
import { useCustomProfileStore } from "@/lib/store/useCustomProfileStore";
import { VideoLab } from "@/components/chat/VideoLab";

interface ChatSettingsPanelProps {
  typewriterSpeed: number;
  soundEnabled: boolean;
  ttsEnabled: boolean;
  musicEnabled: boolean;
  ambient: Partial<AmbientSettings>;
  modelConfig?: ModelConfig;
  elevenLabsConfigured: boolean | null;
  sfxControls: {
    playTypewriter: () => void;
    playThunder: () => void;
    playPhoneRing: () => void;
  } | null;
  onUpdateSettings: (settings: SettingsUpdate) => void;
  onModelConfigChange?: (config: ModelConfig) => void;
}

export function ChatSettingsPanel({
  typewriterSpeed,
  soundEnabled,
  ttsEnabled,
  musicEnabled,
  ambient,
  modelConfig,
  elevenLabsConfigured,
  sfxControls,
  onUpdateSettings,
  onModelConfigChange,
}: ChatSettingsPanelProps) {
  const { settings, updateSettings } = useA2UIStore();
  const { baseId } = useResolvedAesthetic();
  const musicPresets = getMusicPresets(baseId);

  // When a custom profile is active, settings edited here must persist to THAT
  // profile (mirroring VoiceCustomization/EffectsCustomization) — otherwise the
  // value is written to the global store but immediately re-shadowed by the
  // profile's own value on the next render, so the control appears inert. These
  // three controls have profile homes; the intensity enum / on-off toggles do
  // not, so they stay session-global.
  const activeProfile = useCustomProfileStore((state) => {
    if (!state.activeCustomProfileId) return null;
    return state.customProfiles.find((p) => p.id === state.activeCustomProfileId) ?? null;
  });
  const updateProfile = useCustomProfileStore((state) => state.updateProfile);

  const setTypewriterSpeed = (speed: number) => {
    if (activeProfile) {
      updateProfile(activeProfile.id, {
        effects: { ...activeProfile.effects, typewriterSpeed: speed },
      });
    } else {
      onUpdateSettings({ typewriterSpeed: speed });
    }
  };

  const setRainVolume = (v: number) => {
    if (activeProfile) {
      updateProfile(activeProfile.id, { audio: { ...activeProfile.audio, ambientRainVolume: v } });
    } else {
      onUpdateSettings({ ambient: { rainVolume: v } });
    }
  };

  const setCrackleVolume = (v: number) => {
    if (activeProfile) {
      updateProfile(activeProfile.id, {
        audio: { ...activeProfile.audio, ambientCrackleVolume: v },
      });
    } else {
      onUpdateSettings({ ambient: { crackleVolume: v } });
    }
  };

  const [showComposer, setShowComposer] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [provider, setProvider] = useState<"elevenlabs" | "lyria">("lyria");
  const [usePro, setUsePro] = useState(false);
  const [durationSeconds, setDurationSeconds] = useState(30);
  const [isGenerating, setIsGenerating] = useState(false);
  const [composerError, setComposerError] = useState<string | null>(null);

  const defaults: AmbientSettings = {
    rainEnabled: true,
    rainVolume: 1,
    fogEnabled: true,
    intensity: "medium",
    crackleEnabled: false,
    crackleVolume: 0.35,
  };
  const ambientSettings: AmbientSettings = { ...defaults, ...ambient };

  const toggleSpeed = () => {
    const newSpeed = typewriterSpeed === 0 ? 30 : 0;
    setTypewriterSpeed(newSpeed);
  };

  const toggleSound = () => onUpdateSettings({ soundEnabled: !soundEnabled });

  const toggleTts = () => {
    if (elevenLabsConfigured === false) return;
    onUpdateSettings({ ttsEnabled: !ttsEnabled });
  };

  const toggleMusic = () => {
    onUpdateSettings({ musicEnabled: !musicEnabled });
  };

  const toggleRain = () =>
    onUpdateSettings({ ambient: { rainEnabled: !ambientSettings.rainEnabled } });
  const toggleFog = () =>
    onUpdateSettings({ ambient: { fogEnabled: !ambientSettings.fogEnabled } });
  const toggleCrackle = () =>
    onUpdateSettings({ ambient: { crackleEnabled: !ambientSettings.crackleEnabled } });

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setComposerError(null);
    try {
      const response = await fetch("/api/music/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          prompt,
          durationMs: durationSeconds * 1000,
          usePro,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || errData.details || "Generation failed");
      }

      const track = await response.json();
      const updatedTracks = [
        ...(settings.generatedTracks || []),
        {
          id: Math.random().toString(36).substring(7),
          url: track.url,
          prompt: track.prompt,
          provider: track.provider,
          createdAt: track.createdAt,
        },
      ];

      updateSettings({
        customMusicUrl: track.url,
        musicProvider: provider,
        musicPrompt: prompt,
        generatedTracks: updatedTracks,
        musicEnabled: true, // Auto-enable music
      });
      onUpdateSettings({ musicEnabled: true });
    } catch (err) {
      console.error(err);
      const errMsg = err instanceof Error ? err.message : "An unexpected error occurred";
      setComposerError(errMsg);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeleteTrack = (id: string, url: string) => {
    const remaining = (settings.generatedTracks || []).filter((t) => t.id !== id);
    const updates: SettingsUpdate = {
      generatedTracks: remaining.length > 0 ? remaining : undefined,
    };
    if (settings.customMusicUrl === url) {
      updates.customMusicUrl = undefined;
    }
    updateSettings(updates);
  };

  const sfxDisabledReason = !soundEnabled
    ? "Enable sound effects"
    : elevenLabsConfigured === false
      ? "Set ELEVENLABS_API_KEY to enable effects"
      : undefined;

  return (
    <div className="p-4 space-y-4">
      <ToggleRow
        label="TYPEWRITER SPEED"
        active={typewriterSpeed === 0}
        activeLabel="INSTANT"
        inactiveLabel="NORMAL"
        onToggle={toggleSpeed}
      />
      <ToggleRow
        label="SOUND FX"
        active={soundEnabled}
        onToggle={toggleSound}
        ariaLabel="Toggle sound effects"
      />
      <ToggleRow
        label="VOICE (TTS)"
        active={ttsEnabled}
        activeLabel="ON AIR"
        inactiveLabel="OFF AIR"
        onToggle={toggleTts}
        disabled={elevenLabsConfigured === false}
        disabledTitle="Set ELEVENLABS_API_KEY to enable"
        ariaLabel="Toggle voice playback"
      />
      <ToggleRow
        label="NOIR MUSIC"
        active={musicEnabled}
        activeLabel="ON AIR"
        inactiveLabel="OFF AIR"
        onToggle={toggleMusic}
        ariaLabel="Toggle noir music"
      />

      {/* COMPOSER LAB */}
      <div className="border border-[var(--aesthetic-border)]/30 rounded-sm p-3 space-y-3 bg-[var(--aesthetic-background)]/20">
        <button
          type="button"
          onClick={() => setShowComposer(!showComposer)}
          className="w-full flex items-center justify-between font-typewriter text-xs uppercase tracking-widest text-[var(--aesthetic-accent)] hover:opacity-85 focus:outline-none"
        >
          <span className="flex items-center gap-1.5 font-bold">
            <Music className="w-3.5 h-3.5" />
            Composer Lab
          </span>
          {showComposer ? (
            <ChevronUp className="w-3.5 h-3.5" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5" />
          )}
        </button>

        {showComposer && (
          <div className="space-y-3 pt-2 border-t border-[var(--aesthetic-border)]/15">
            {/* Provider selection */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-[var(--aesthetic-text)]/50 uppercase tracking-widest block">
                AI Orchestra Provider
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(["lyria", "elevenlabs"] as const).map((prov) => (
                  <button
                    key={prov}
                    type="button"
                    onClick={() => {
                      setProvider(prov);
                      setComposerError(null);
                    }}
                    className={cn(
                      "px-2 py-1 border rounded-sm font-mono text-[10px] uppercase tracking-wider transition-colors",
                      provider === prov
                        ? "border-[var(--aesthetic-accent)] text-[var(--aesthetic-accent)] bg-[var(--aesthetic-accent)]/10"
                        : "border-[var(--aesthetic-border)]/50 text-[var(--aesthetic-text-muted)] hover:border-[var(--aesthetic-text)]"
                    )}
                  >
                    {prov === "lyria" ? "Google Lyria" : "ElevenLabs"}
                  </button>
                ))}
              </div>
            </div>

            {/* Sub-options for the chosen provider */}
            {provider === "lyria" ? (
              <div className="grid grid-cols-[1fr_auto] items-center gap-2 text-[10px] font-mono">
                <span className="text-[var(--aesthetic-text)]/60">LYRIA PRO MODEL</span>
                <button
                  type="button"
                  onClick={() => setUsePro(!usePro)}
                  className={cn(
                    "px-2 py-0.5 border rounded-sm transition-colors min-w-[50px] text-center",
                    usePro
                      ? "border-[var(--aesthetic-accent)] text-[var(--aesthetic-accent)] bg-[var(--aesthetic-accent)]/10"
                      : "border-[var(--aesthetic-border)]/50 text-[var(--aesthetic-text-muted)]"
                  )}
                >
                  {usePro ? "PRO" : "CLIP"}
                </button>
              </div>
            ) : (
              <div className="space-y-1 font-mono text-[10px]">
                <div className="flex justify-between text-[var(--aesthetic-text)]/60">
                  <span>DURATION</span>
                  <span>{durationSeconds}s</span>
                </div>
                <input
                  type="range"
                  min={30}
                  max={120}
                  step={10}
                  value={durationSeconds}
                  onChange={(e) => setDurationSeconds(Number(e.target.value))}
                  className="w-full accent-[var(--aesthetic-accent)] cursor-pointer"
                />
              </div>
            )}

            {/* Presets */}
            <div className="space-y-1">
              <span className="text-[10px] font-mono text-[var(--aesthetic-text)]/50 uppercase tracking-widest block">
                Atmosphere Presets
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {musicPresets.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => {
                      setPrompt(preset.prompt);
                      setComposerError(null);
                    }}
                    className="flex items-center gap-1.5 p-1 border border-[var(--aesthetic-border)]/30 rounded-sm text-left hover:border-[var(--aesthetic-accent)]/45 transition-colors font-mono text-[9px] text-[var(--aesthetic-text)]/80"
                  >
                    <span>{preset.icon}</span>
                    <span className="truncate">{preset.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Prompt input */}
            <div className="space-y-1">
              <label className="text-[10px] font-mono text-[var(--aesthetic-text)]/50 uppercase tracking-widest block">
                Musical Script (Prompt)
              </label>
              <textarea
                value={prompt}
                onChange={(e) => {
                  setPrompt(e.target.value);
                  setComposerError(null);
                }}
                placeholder={getMusicStylePrompt(baseId)}
                rows={3}
                className="w-full bg-[var(--aesthetic-background)]/60 border border-[var(--aesthetic-border)]/45 rounded-sm p-2 text-xs font-mono text-[var(--aesthetic-text)] placeholder-[var(--aesthetic-text-muted)]/50 focus:outline-none focus:border-[var(--aesthetic-accent)]/80 resize-none"
              />
            </div>

            {/* Generate Action */}
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              className={cn(
                "w-full py-1.5 rounded-sm border font-typewriter text-xs uppercase tracking-widest text-center transition-all",
                isGenerating
                  ? "bg-[var(--aesthetic-accent)]/5 border-[var(--aesthetic-accent)]/20 text-[var(--aesthetic-text-muted)] cursor-not-allowed"
                  : !prompt.trim()
                    ? "bg-transparent border-[var(--aesthetic-border)]/30 text-[var(--aesthetic-text-muted)] opacity-50 cursor-not-allowed"
                    : "bg-[var(--aesthetic-accent)]/15 border-[var(--aesthetic-accent)] text-[var(--aesthetic-accent)] hover:bg-[var(--aesthetic-accent)]/25 active:scale-[0.98]"
              )}
            >
              {isGenerating ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Orchestrating...
                </span>
              ) : (
                "Compose Track"
              )}
            </button>

            {/* Error display */}
            {composerError && (
              <p className="text-[var(--aesthetic-error)] font-mono text-[9px] leading-relaxed border-t border-[var(--aesthetic-error)]/25 pt-1.5 mt-1">
                ERROR: {composerError}
              </p>
            )}

            {/* Restoring default loop option */}
            {settings.customMusicUrl && (
              <button
                type="button"
                onClick={() => {
                  updateSettings({
                    customMusicUrl: undefined,
                  });
                }}
                className="w-full py-1 text-center font-mono text-[9px] uppercase tracking-wider text-[var(--aesthetic-text-muted)] hover:text-[var(--aesthetic-text)] transition-colors border border-dashed border-[var(--aesthetic-border)]/35 rounded-sm"
              >
                Revert to Default Jazz Loop
              </button>
            )}

            {/* Generated Tracks List */}
            {settings.generatedTracks && settings.generatedTracks.length > 0 && (
              <div className="space-y-1.5 pt-2 border-t border-[var(--aesthetic-border)]/15">
                <span className="text-[10px] font-mono text-[var(--aesthetic-text)]/50 uppercase tracking-widest block">
                  Archive of Records
                </span>
                <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                  {settings.generatedTracks.map((track) => {
                    const isActive = settings.customMusicUrl === track.url;
                    return (
                      <div
                        key={track.id}
                        className={cn(
                          "flex items-center justify-between gap-2 p-1.5 border rounded-sm text-[10px] font-mono transition-colors",
                          isActive
                            ? "border-[var(--aesthetic-accent)]/60 bg-[var(--aesthetic-accent)]/5"
                            : "border-[var(--aesthetic-border)]/20 bg-[var(--aesthetic-background)]/20"
                        )}
                      >
                        <div className="min-w-0 flex-1">
                          <p
                            className="text-[var(--aesthetic-text)] truncate font-semibold"
                            title={track.prompt}
                          >
                            {track.prompt}
                          </p>
                          <p className="text-[var(--aesthetic-text-muted)] text-[8px] uppercase tracking-wider">
                            {track.provider === "lyria" ? "Lyria" : "ElevenLabs"} •{" "}
                            {new Date(track.createdAt).toLocaleTimeString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {isActive ? (
                            <span className="text-[var(--aesthetic-accent)] flex items-center gap-1 px-1.5 py-0.5 border border-[var(--aesthetic-accent)]/40 rounded-sm text-[8px] uppercase tracking-widest font-semibold animate-pulse">
                              Active
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                updateSettings({
                                  customMusicUrl: track.url,
                                  musicEnabled: true,
                                });
                                onUpdateSettings({ musicEnabled: true });
                              }}
                              title="Play record"
                              className="text-[var(--aesthetic-text)] hover:text-[var(--aesthetic-accent)] transition-colors p-1"
                            >
                              <Play className="w-3 h-3 fill-current" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDeleteTrack(track.id, track.url)}
                            title="Purge record"
                            className="text-[var(--aesthetic-text-muted)] hover:text-[var(--aesthetic-error)] transition-colors p-1"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* VIDEO LAB — on-demand Veo generation, decoupled from UI generation */}
      <VideoLab aestheticId={baseId} />

      <div className="grid grid-cols-[1fr_auto] items-center gap-3 text-xs font-mono">
        <span className="text-[var(--aesthetic-text)]/70">FX TRIGGERS</span>
        <div className="flex items-center gap-2">
          {(
            [
              {
                icon: Keyboard,
                action: () => sfxControls?.playTypewriter(),
                label: "Play typewriter",
              },
              {
                icon: CloudLightning,
                action: () => sfxControls?.playThunder(),
                label: "Play thunder",
              },
              { icon: Phone, action: () => sfxControls?.playPhoneRing(), label: "Play phone ring" },
            ] as const
          ).map(({ icon: Icon, action, label }) => (
            <button
              key={label}
              type="button"
              onClick={action}
              disabled={!soundEnabled || elevenLabsConfigured === false}
              title={sfxDisabledReason ?? label}
              className={cn(
                "w-8 h-8 flex items-center justify-center rounded-sm border transition-colors focus-visible:ring-2 focus-visible:ring-[var(--aesthetic-accent)]",
                soundEnabled
                  ? "border-[var(--aesthetic-border)]/40 text-[var(--aesthetic-text)]/70 hover:text-[var(--aesthetic-accent)] hover:border-[var(--aesthetic-accent)]/50"
                  : "border-[var(--aesthetic-border)]/30 text-[var(--aesthetic-text-muted)]",
                (!soundEnabled || elevenLabsConfigured === false) && "opacity-50 cursor-not-allowed"
              )}
              aria-label={label}
            >
              <Icon className="w-3.5 h-3.5" />
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-[var(--aesthetic-border)]/30 pt-4 space-y-3">
        <div className="text-xs font-mono uppercase tracking-widest text-[var(--aesthetic-text)]/60">
          Ambience
        </div>
        <ToggleRow
          label="RAIN"
          active={ambientSettings.rainEnabled}
          onToggle={toggleRain}
          ariaLabel="Toggle rain"
        />
        {ambientSettings.rainEnabled && (
          <VolumeSlider
            label="RAIN VOLUME"
            value={ambientSettings.rainVolume}
            onChange={(v) => setRainVolume(v)}
            ariaLabel="Rain volume"
          />
        )}
        <ToggleRow
          label="FOG"
          active={ambientSettings.fogEnabled}
          onToggle={toggleFog}
          ariaLabel="Toggle fog"
        />
        <ToggleRow
          label="VINYL CRACKLE"
          active={ambientSettings.crackleEnabled}
          onToggle={toggleCrackle}
          ariaLabel="Toggle crackle"
        />
        {ambientSettings.crackleEnabled && (
          <VolumeSlider
            label="CRACKLE VOLUME"
            value={ambientSettings.crackleVolume}
            onChange={(v) => setCrackleVolume(v)}
            ariaLabel="Crackle volume"
          />
        )}
        <div className="text-xs font-mono">
          <span className="text-[var(--aesthetic-text)]/70">INTENSITY</span>
          <div className="grid grid-cols-3 gap-2 mt-2">
            {(["low", "medium", "high"] as const).map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => onUpdateSettings({ ambient: { intensity: level } })}
                aria-pressed={ambientSettings.intensity === level}
                aria-label={`Set intensity to ${level}`}
                className={cn(
                  "px-2 py-1 border rounded-sm uppercase tracking-widest text-[10px] transition-colors w-full focus-visible:ring-2 focus-visible:ring-[var(--aesthetic-accent)]",
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

      <ImageModelSelector
        imageModel={settings.imageModel}
        onImageModelChange={(model) => onUpdateSettings({ imageModel: model })}
      />
    </div>
  );
}

function ToggleRow({
  label,
  active,
  onToggle,
  activeLabel = "ON",
  inactiveLabel = "OFF",
  disabled,
  disabledTitle,
  ariaLabel,
}: {
  label: string;
  active: boolean;
  onToggle: () => void;
  activeLabel?: string;
  inactiveLabel?: string;
  disabled?: boolean;
  disabledTitle?: string;
  ariaLabel?: string;
}) {
  return (
    <div className="grid grid-cols-[1fr_auto] items-center gap-3 text-xs font-mono">
      <span className="text-[var(--aesthetic-text)]/70">{label}</span>
      <button
        onClick={onToggle}
        disabled={disabled}
        title={disabled ? disabledTitle : undefined}
        className={cn(
          "px-2 py-1 border rounded-sm transition-colors min-w-[84px] text-center focus-visible:ring-2 focus-visible:ring-[var(--aesthetic-accent)]",
          active
            ? "border-[var(--aesthetic-accent)] text-[var(--aesthetic-accent)] bg-[var(--aesthetic-accent)]/10"
            : "border-[var(--aesthetic-border)]/50 text-[var(--aesthetic-text-muted)] hover:border-[var(--aesthetic-text)]",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        aria-label={ariaLabel}
        aria-pressed={active}
      >
        {active ? activeLabel : inactiveLabel}
      </button>
    </div>
  );
}

function VolumeSlider({
  label,
  value,
  onChange,
  ariaLabel,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  ariaLabel: string;
}) {
  return (
    <div className="text-xs font-mono">
      <div className="flex items-center justify-between text-[var(--aesthetic-text)]/70">
        <span>{label}</span>
        <span>{Math.round(value * 100)}%</span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        step={1}
        value={Math.round(value * 100)}
        onChange={(event) => onChange(Number(event.currentTarget.value) / 100)}
        aria-label={ariaLabel}
        className="w-full mt-2 accent-[var(--aesthetic-accent)]"
      />
    </div>
  );
}
