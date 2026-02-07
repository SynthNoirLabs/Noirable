"use client";

import React from "react";
import { Keyboard, CloudLightning, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import { ModelSelector } from "@/components/settings/ModelSelector";
import type { AmbientSettings, ModelConfig, SettingsUpdate } from "@/lib/store/useA2UIStore";

interface ChatSettingsPanelProps {
  typewriterSpeed: number;
  soundEnabled: boolean;
  ttsEnabled: boolean;
  musicEnabled: boolean;
  ambient: Partial<AmbientSettings>;
  modelConfig?: ModelConfig;
  useA2UIv09: boolean;
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
  useA2UIv09,
  elevenLabsConfigured,
  sfxControls,
  onUpdateSettings,
  onModelConfigChange,
}: ChatSettingsPanelProps) {
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
    onUpdateSettings({ typewriterSpeed: newSpeed });
  };

  const toggleSound = () => onUpdateSettings({ soundEnabled: !soundEnabled });

  const toggleTts = () => {
    if (elevenLabsConfigured === false) return;
    onUpdateSettings({ ttsEnabled: !ttsEnabled });
  };

  const toggleMusic = () => {
    if (elevenLabsConfigured === false) return;
    onUpdateSettings({ musicEnabled: !musicEnabled });
  };

  const toggleRain = () =>
    onUpdateSettings({ ambient: { rainEnabled: !ambientSettings.rainEnabled } });
  const toggleFog = () =>
    onUpdateSettings({ ambient: { fogEnabled: !ambientSettings.fogEnabled } });
  const toggleCrackle = () =>
    onUpdateSettings({ ambient: { crackleEnabled: !ambientSettings.crackleEnabled } });

  const sfxDisabledReason = !soundEnabled
    ? "Enable sound effects"
    : elevenLabsConfigured === false
      ? "Set ELEVENLABS_API_KEY to enable effects"
      : undefined;

  return (
    <div className="p-4 space-y-4">
      <div className="grid grid-cols-[1fr_auto] items-center gap-3 text-xs font-mono">
        <span className="text-[var(--aesthetic-text)]/70">A2UI v0.9</span>
        <button
          onClick={() => onUpdateSettings({ useA2UIv09: !useA2UIv09 })}
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
        onToggle={toggleTts}
        disabled={elevenLabsConfigured === false}
        disabledTitle="Set ELEVENLABS_API_KEY to enable"
        ariaLabel="Toggle voice playback"
      />
      <ToggleRow
        label="NOIR MUSIC"
        active={musicEnabled}
        onToggle={toggleMusic}
        disabled={elevenLabsConfigured === false}
        disabledTitle="Set ELEVENLABS_API_KEY to enable"
        ariaLabel="Toggle noir music"
      />

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
              title={sfxDisabledReason}
              className={cn(
                "w-8 h-8 flex items-center justify-center rounded-sm border transition-colors",
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
            onChange={(v) => onUpdateSettings({ ambient: { rainVolume: v } })}
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
            onChange={(v) => onUpdateSettings({ ambient: { crackleVolume: v } })}
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
          "px-2 py-1 border rounded-sm transition-colors min-w-[84px] text-center",
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
