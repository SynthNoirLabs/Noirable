"use client";

import { useCallback } from "react";
import { RotateCcw, Type } from "lucide-react";
import { useCustomProfileStore } from "@/lib/store/useCustomProfileStore";
import { injectProfileStyles } from "@/lib/customization/css-injection";
import { cn } from "@/lib/utils";
import type { FontPreset, ProfileFonts } from "@/lib/customization/types";

// Font presets honored by buildFontVariables in css-injection.ts. Keep the
// labels human-readable while the values match the FontPreset enum exactly.
const FONT_PRESETS: { value: FontPreset; label: string; sample: string }[] = [
  { value: "system", label: "System Sans", sample: "system-ui, sans-serif" },
  { value: "serif", label: "Serif", sample: "Georgia, serif" },
  { value: "typewriter", label: "Typewriter", sample: "'Courier New', monospace" },
  { value: "mono", label: "Monospace", sample: "ui-monospace, Menlo, monospace" },
];

const FONT_SLOTS: { key: keyof ProfileFonts; label: string }[] = [
  { key: "heading", label: "Headings" },
  { key: "body", label: "Body Text" },
];

export function FontCustomization() {
  const { getActiveProfile, updateProfile, activeCustomProfileId } = useCustomProfileStore();

  const activeProfile = getActiveProfile();

  const handleFontChange = useCallback(
    (key: keyof ProfileFonts, value: FontPreset) => {
      if (!activeProfile) return;

      const newFonts: ProfileFonts = {
        ...activeProfile.fonts,
        [key]: value,
      };

      // Inject immediately for live preview, then persist. injectProfileStyles
      // turns profile.fonts into the --aesthetic-font-* CSS vars.
      injectProfileStyles({ ...activeProfile, fonts: newFonts });
      updateProfile(activeProfile.id, { fonts: newFonts });
    },
    [activeProfile, updateProfile]
  );

  const handleReset = useCallback(() => {
    if (!activeProfile) return;
    injectProfileStyles({ ...activeProfile, fonts: undefined });
    updateProfile(activeProfile.id, { fonts: undefined });
  }, [activeProfile, updateProfile]);

  // Fonts are a profile-only override (no global font setting exists), so gate
  // the editor behind an active profile and hint when none is selected.
  if (!activeCustomProfileId || !activeProfile) {
    return (
      <div className="p-4 text-center border border-dashed border-[var(--aesthetic-border)] rounded-sm">
        <p className="text-sm text-[var(--aesthetic-text-muted)]">
          Create or select a custom profile to customize fonts.
        </p>
      </div>
    );
  }

  const fonts = activeProfile.fonts ?? {};

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-2 mb-1 opacity-50">
        <div className="h-px bg-[var(--aesthetic-border)]/30 flex-1" />
        <span className="text-[10px] font-mono text-[var(--aesthetic-accent)] uppercase tracking-widest">
          Typography
        </span>
        <div className="h-px bg-[var(--aesthetic-border)]/30 flex-1" />
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleReset}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-mono uppercase tracking-wide text-[var(--aesthetic-text-muted)] hover:text-[var(--aesthetic-text)] hover:bg-[var(--aesthetic-surface)] transition-colors rounded-sm"
          title="Reset to preset fonts"
        >
          <RotateCcw className="w-3 h-3" />
          Reset Defaults
        </button>
      </div>

      <div className="space-y-6">
        {FONT_SLOTS.map((slot) => (
          <div key={slot.key} className="space-y-3">
            <label className="text-[10px] font-typewriter text-[var(--aesthetic-text)]/60 uppercase tracking-wider flex items-center gap-1.5">
              <Type className="w-3 h-3 text-[var(--aesthetic-accent)]/70" />
              {slot.label}
            </label>
            <select
              value={fonts[slot.key] ?? ""}
              onChange={(e) => handleFontChange(slot.key, e.target.value as FontPreset)}
              aria-label={`${slot.label} font`}
              className="w-full bg-[var(--aesthetic-surface)]/50 border border-[var(--aesthetic-border)]/30 rounded-sm px-3 py-2 text-xs font-mono text-[var(--aesthetic-text)] outline-none focus:border-[var(--aesthetic-accent)] focus:ring-1 focus:ring-[var(--aesthetic-accent)]/30 transition-colors"
            >
              <option value="" disabled>
                Use preset default…
              </option>
              {FONT_PRESETS.map((preset) => (
                <option key={preset.value} value={preset.value}>
                  {preset.label}
                </option>
              ))}
            </select>
            {fonts[slot.key] && (
              <p
                className={cn(
                  "text-xs text-[var(--aesthetic-text-muted)] px-1",
                  slot.key === "heading" ? "font-semibold" : ""
                )}
                style={{
                  fontFamily: FONT_PRESETS.find((p) => p.value === fonts[slot.key])?.sample,
                }}
              >
                The quick brown fox jumps over the lazy dog.
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="p-3 rounded-sm border border-dashed border-[var(--aesthetic-border)]/30 bg-[var(--aesthetic-surface)]/30">
        <p className="text-[10px] text-[var(--aesthetic-text-muted)] font-mono">
          Leave a slot on the preset default to inherit the base aesthetic&apos;s typography.
        </p>
      </div>
    </div>
  );
}
