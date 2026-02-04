"use client";

import { useA2UIStore } from "@/lib/store/useA2UIStore";
import { cn } from "@/lib/utils";
import { Droplets, CloudFog, Radio, Type } from "lucide-react";

interface SliderProps {
  label: string;
  icon: React.ReactNode;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (value: number) => void;
}

function Slider({ label, icon, value, min, max, step, unit, onChange }: SliderProps) {
  const displayValue = unit === "%" ? Math.round(value * 100) : value;
  const displayUnit = unit;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs font-mono">
        <span className="flex items-center gap-2 text-[var(--aesthetic-text)]/70 uppercase tracking-wider">
          <span className="text-[var(--aesthetic-accent)]/70">{icon}</span>
          {label}
        </span>
        <span className="text-[var(--aesthetic-accent)]">
          {displayValue}
          {displayUnit}
        </span>
      </div>
      <input
        type="range"
        min={unit === "%" ? 0 : min}
        max={unit === "%" ? 100 : max}
        step={unit === "%" ? 1 : step}
        value={unit === "%" ? Math.round(value * 100) : value}
        onChange={(e) => {
          const rawValue = Number(e.currentTarget.value);
          const normalized = unit === "%" ? rawValue / 100 : rawValue;
          onChange(normalized);
        }}
        aria-label={`${label} ${unit === "%" ? "intensity" : "speed"}`}
        className="w-full h-1 bg-[var(--aesthetic-surface-alt)]/30 rounded-lg appearance-none cursor-pointer accent-[var(--aesthetic-accent)]"
      />
    </div>
  );
}

export function EffectsCustomization() {
  const { settings, updateSettings } = useA2UIStore();

  const effectIntensities = settings.effectIntensities || {
    rain: 0.5,
    fog: 0.5,
    crackle: 0.5,
  };

  const typewriterSpeed = settings.typewriterSpeed ?? 50;

  const handleEffectChange = (key: "rain" | "fog" | "crackle", value: number) => {
    updateSettings({
      effectIntensities: {
        ...effectIntensities,
        [key]: value,
      },
    });
  };

  const handleTypewriterSpeedChange = (value: number) => {
    updateSettings({ typewriterSpeed: value });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-1 opacity-50">
        <div className="h-px bg-[var(--aesthetic-border)]/30 flex-1" />
        <span className="text-[10px] font-mono text-[var(--aesthetic-accent)] uppercase tracking-widest">
          Visual Effects
        </span>
        <div className="h-px bg-[var(--aesthetic-border)]/30 flex-1" />
      </div>

      <div className="space-y-6">
        {/* Rain Intensity */}
        <Slider
          label="Rain Intensity"
          icon={<Droplets className="w-3 h-3" />}
          value={effectIntensities.rain ?? 0.5}
          min={0}
          max={1}
          step={0.01}
          unit="%"
          onChange={(v) => handleEffectChange("rain", v)}
        />

        {/* Fog Intensity */}
        <Slider
          label="Fog Intensity"
          icon={<CloudFog className="w-3 h-3" />}
          value={effectIntensities.fog ?? 0.5}
          min={0}
          max={1}
          step={0.01}
          unit="%"
          onChange={(v) => handleEffectChange("fog", v)}
        />

        {/* Crackle Intensity */}
        <Slider
          label="Crackle Intensity"
          icon={<Radio className="w-3 h-3" />}
          value={effectIntensities.crackle ?? 0.5}
          min={0}
          max={1}
          step={0.01}
          unit="%"
          onChange={(v) => handleEffectChange("crackle", v)}
        />

        {/* Typewriter Speed */}
        <div className="pt-4 border-t border-[var(--aesthetic-border)]/20">
          <Slider
            label="Typewriter Speed"
            icon={<Type className="w-3 h-3" />}
            value={typewriterSpeed}
            min={0}
            max={100}
            step={1}
            unit="ms"
            onChange={handleTypewriterSpeedChange}
          />
          <p className="text-[10px] text-[var(--aesthetic-text-muted)] mt-2">
            Delay between characters (0 = instant, 100 = slow)
          </p>
        </div>
      </div>

      {/* Info */}
      <div
        className={cn(
          "p-3 rounded-sm border border-dashed",
          "border-[var(--aesthetic-border)]/30 bg-[var(--aesthetic-surface)]/30"
        )}
      >
        <p className="text-[10px] text-[var(--aesthetic-text-muted)] font-mono">
          These settings control the intensity of visual effects. Changes apply immediately to the
          current session.
        </p>
      </div>
    </div>
  );
}
