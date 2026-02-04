"use client";

import React from "react";
import { useA2UIStore } from "@/lib/store/useA2UIStore";
import { cn } from "@/lib/utils";
import { Play, Volume2, Music, CloudRain } from "lucide-react";

interface AudioCustomizationProps {
  className?: string;
}

const Slider = ({
  label,
  value,
  onChange,
  onPreview,
}: {
  label: string;
  value: number;
  onChange: (val: number) => void;
  onPreview: () => void;
}) => (
  <div className="text-xs font-mono mb-4">
    <div className="flex items-center justify-between text-[var(--aesthetic-text)]/70 mb-2">
      <span className="flex items-center gap-2">{label}</span>
      <div className="flex items-center gap-3">
        <span>{Math.round(value * 100)}%</span>
        <button
          onClick={onPreview}
          className="p-1 hover:bg-[var(--aesthetic-text)]/10 rounded transition-colors"
          title={`Preview ${label}`}
          aria-label={`Preview ${label}`}
        >
          <Play className="w-3 h-3" />
        </button>
      </div>
    </div>
    <input
      type="range"
      min={0}
      max={100}
      step={1}
      value={Math.round(value * 100)}
      onChange={(e) => onChange(Number(e.currentTarget.value) / 100)}
      aria-label={`${label} volume`}
      className="w-full accent-[var(--aesthetic-accent)] h-1 bg-[var(--aesthetic-text)]/20 rounded-lg appearance-none cursor-pointer"
    />
  </div>
);

export function AudioCustomization({ className }: AudioCustomizationProps) {
  const { settings, updateSettings } = useA2UIStore();

  const handlePreview = (type: string) => {
    // In a real implementation, this would play the actual asset.
    // For now, we just log or use a placeholder if we had URLs.
    console.log(`Previewing audio: ${type}`);
  };

  const updateSfxVolume = (type: "typewriter" | "thunder" | "phone", value: number) => {
    const currentVolumes = settings.sfxVolumes || {
      typewriter: 1,
      thunder: 1,
      phone: 1,
    };

    updateSettings({
      sfxVolumes: {
        ...currentVolumes,
        [type]: value,
      },
    });
  };

  const updateMusicVolume = (value: number) => {
    updateSettings({ musicVolume: value });
  };

  const updateAmbientVolume = (type: "rain" | "crackle", value: number) => {
    updateSettings({
      ambient: {
        ...settings.ambient,
        [type === "rain" ? "rainVolume" : "crackleVolume"]: value,
      },
    });
  };

  const toggleAmbient = (type: "rain" | "crackle") => {
    updateSettings({
      ambient: {
        ...settings.ambient,
        [type === "rain" ? "rainEnabled" : "crackleEnabled"]:
          !settings.ambient[type === "rain" ? "rainEnabled" : "crackleEnabled"],
      },
    });
  };

  const toggleMusic = () => {
    updateSettings({ musicEnabled: !settings.musicEnabled });
  };

  return (
    <div className={cn("space-y-8 p-4", className)}>
      {/* SFX Section */}
      <section>
        <h3 className="text-sm font-bold tracking-wider text-[var(--aesthetic-text)] mb-4 flex items-center gap-2">
          <Volume2 className="w-4 h-4" />
          SOUND EFFECTS
        </h3>
        <div className="space-y-2">
          <Slider
            label="TYPEWRITER"
            value={settings.sfxVolumes?.typewriter ?? 1}
            onChange={(v) => updateSfxVolume("typewriter", v)}
            onPreview={() => handlePreview("typewriter")}
          />
          <Slider
            label="THUNDER"
            value={settings.sfxVolumes?.thunder ?? 1}
            onChange={(v) => updateSfxVolume("thunder", v)}
            onPreview={() => handlePreview("thunder")}
          />
          <Slider
            label="PHONE"
            value={settings.sfxVolumes?.phone ?? 1}
            onChange={(v) => updateSfxVolume("phone", v)}
            onPreview={() => handlePreview("phone")}
          />
        </div>
      </section>

      {/* Music Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold tracking-wider text-[var(--aesthetic-text)] flex items-center gap-2">
            <Music className="w-4 h-4" />
            MUSIC
          </h3>
          <button
            onClick={toggleMusic}
            className={cn(
              "text-[10px] px-2 py-1 rounded border transition-colors font-mono",
              settings.musicEnabled
                ? "bg-[var(--aesthetic-accent)] text-[var(--aesthetic-bg)] border-[var(--aesthetic-accent)]"
                : "border-[var(--aesthetic-text)]/30 text-[var(--aesthetic-text)]/50 hover:text-[var(--aesthetic-text)]"
            )}
          >
            {settings.musicEnabled ? "ON" : "OFF"}
          </button>
        </div>
        <div
          className={cn(
            "transition-opacity duration-200",
            !settings.musicEnabled && "opacity-50 pointer-events-none"
          )}
        >
          <Slider
            label="MUSIC VOLUME"
            value={settings.musicVolume ?? 0.5}
            onChange={updateMusicVolume}
            onPreview={() => handlePreview("music")}
          />
        </div>
      </section>

      {/* Ambient Section */}
      <section>
        <h3 className="text-sm font-bold tracking-wider text-[var(--aesthetic-text)] mb-4 flex items-center gap-2">
          <CloudRain className="w-4 h-4" />
          AMBIENT
        </h3>

        <div className="space-y-6">
          {/* Rain Control */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono text-[var(--aesthetic-text)]/70">RAIN</span>
              <button
                onClick={() => toggleAmbient("rain")}
                className={cn(
                  "text-[10px] px-2 py-1 rounded border transition-colors font-mono",
                  settings.ambient.rainEnabled
                    ? "bg-[var(--aesthetic-accent)] text-[var(--aesthetic-bg)] border-[var(--aesthetic-accent)]"
                    : "border-[var(--aesthetic-text)]/30 text-[var(--aesthetic-text)]/50 hover:text-[var(--aesthetic-text)]"
                )}
              >
                {settings.ambient.rainEnabled ? "ON" : "OFF"}
              </button>
            </div>
            <div
              className={cn(
                "transition-opacity duration-200",
                !settings.ambient.rainEnabled && "opacity-50 pointer-events-none"
              )}
            >
              <Slider
                label="INTENSITY"
                value={settings.ambient.rainVolume}
                onChange={(v) => updateAmbientVolume("rain", v)}
                onPreview={() => handlePreview("rain")}
              />
            </div>
          </div>

          {/* Crackle Control */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono text-[var(--aesthetic-text)]/70">CRACKLE</span>
              <button
                onClick={() => toggleAmbient("crackle")}
                className={cn(
                  "text-[10px] px-2 py-1 rounded border transition-colors font-mono",
                  settings.ambient.crackleEnabled
                    ? "bg-[var(--aesthetic-accent)] text-[var(--aesthetic-bg)] border-[var(--aesthetic-accent)]"
                    : "border-[var(--aesthetic-text)]/30 text-[var(--aesthetic-text)]/50 hover:text-[var(--aesthetic-text)]"
                )}
              >
                {settings.ambient.crackleEnabled ? "ON" : "OFF"}
              </button>
            </div>
            <div
              className={cn(
                "transition-opacity duration-200",
                !settings.ambient.crackleEnabled && "opacity-50 pointer-events-none"
              )}
            >
              <Slider
                label="VOLUME"
                value={settings.ambient.crackleVolume}
                onChange={(v) => updateAmbientVolume("crackle", v)}
                onPreview={() => handlePreview("crackle")}
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
