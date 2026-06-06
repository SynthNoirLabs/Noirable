"use client";

import { Image as ImageIcon, RotateCcw } from "lucide-react";
import { useCustomProfileStore } from "@/lib/store/useCustomProfileStore";
import { getAestheticDefinition } from "@/lib/aesthetic/definitions";

// Matches imageStylePrompt's z.string().max(500) in the profile schema.
const MAX_LENGTH = 500;

export function ImageStyleCustomization() {
  const { getActiveProfile, updateProfile, activeCustomProfileId } = useCustomProfileStore();

  const activeProfile = getActiveProfile();

  // The store value is the single source of truth: updateProfile is synchronous
  // (zustand) and re-renders immediately, so the textarea stays responsive
  // without a local draft mirror.
  const draft = activeProfile?.imageStylePrompt ?? "";

  // Image style is a profile-only override (no global image-style setting), so
  // gate behind an active profile and hint when none is selected.
  if (!activeCustomProfileId || !activeProfile) {
    return (
      <div className="p-4 text-center border border-dashed border-[var(--aesthetic-border)] rounded-sm">
        <p className="text-sm text-[var(--aesthetic-text-muted)]">
          Create or select a custom profile to customize the image style.
        </p>
      </div>
    );
  }

  // Surface the base preset's default prompt as a placeholder so the user knows
  // what they're overriding.
  const baseId = activeProfile.baseAestheticId;
  const basePrompt = getAestheticDefinition(baseId).imageStylePrompt;

  const handleChange = (value: string) => {
    const clamped = value.slice(0, MAX_LENGTH);
    updateProfile(activeProfile.id, {
      imageStylePrompt: clamped.trim() ? clamped : undefined,
    });
  };

  const handleReset = () => {
    updateProfile(activeProfile.id, { imageStylePrompt: undefined });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-1 opacity-50">
        <div className="h-px bg-[var(--aesthetic-border)]/30 flex-1" />
        <span className="text-[10px] font-mono text-[var(--aesthetic-accent)] uppercase tracking-widest">
          Image Style
        </span>
        <div className="h-px bg-[var(--aesthetic-border)]/30 flex-1" />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="image-style-prompt"
          className="text-[10px] font-typewriter text-[var(--aesthetic-text)]/60 uppercase tracking-wider flex items-center gap-1.5"
        >
          <ImageIcon className="w-3 h-3 text-[var(--aesthetic-accent)]/70" />
          Image Style Prompt
        </label>
        <textarea
          id="image-style-prompt"
          value={draft}
          onChange={(e) => handleChange(e.target.value)}
          maxLength={MAX_LENGTH}
          rows={6}
          placeholder={basePrompt}
          aria-label="Image style prompt"
          className="w-full bg-[var(--aesthetic-surface)]/50 border border-[var(--aesthetic-border)]/30 rounded-sm px-3 py-2 text-xs font-mono text-[var(--aesthetic-text)] placeholder:text-[var(--aesthetic-text-muted)]/40 outline-none focus:border-[var(--aesthetic-accent)] focus:ring-1 focus:ring-[var(--aesthetic-accent)]/30 transition-colors resize-y"
        />
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-[var(--aesthetic-text-muted)] font-mono">
            {draft.length}/{MAX_LENGTH}
          </span>
          <button
            onClick={handleReset}
            disabled={!draft}
            className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-mono uppercase tracking-wide text-[var(--aesthetic-text-muted)] hover:text-[var(--aesthetic-text)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors rounded-sm"
            title="Use the preset default style"
          >
            <RotateCcw className="w-3 h-3" />
            Use Preset Default
          </button>
        </div>
      </div>

      <div className="p-3 rounded-sm border border-dashed border-[var(--aesthetic-border)]/30 bg-[var(--aesthetic-surface)]/30">
        <p className="text-[10px] text-[var(--aesthetic-text-muted)] font-mono">
          Appended to generated evidence-image prompts. Leave empty to inherit the base
          aesthetic&apos;s photographic style shown above.
        </p>
      </div>
    </div>
  );
}
