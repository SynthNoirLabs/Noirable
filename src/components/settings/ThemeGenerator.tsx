"use client";

import { useState, useRef } from "react";
import { Sparkles, Wand2, Shuffle, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { useCustomProfileStore } from "@/lib/store/useCustomProfileStore";
import { injectProfileStyles } from "@/lib/customization/css-injection";
import { getDefaultVoiceId } from "@/lib/aesthetic/voice-defaults";
import { pickSurpriseProfile, SURPRISE_PROFILE_COUNT } from "@/lib/customization/surprise-me";
import type { GeneratedProfile } from "@/lib/ai/theme-generator";
import type { CustomProfile } from "@/lib/customization/types";

/**
 * AI-assisted theme generation Lab tab: describe a vibe and get back a full,
 * coherent world (palette + fonts + persona + effects + image style + voice).
 *
 * The Generate button POSTs the vibe to /api/theme; "Surprise Me" pulls a
 * hand-curated world from surprise-me.ts entirely offline (no API key needed).
 * Either path lands a `GeneratedProfile`, which we persist through the same
 * createProfile -> updateProfile -> setActiveProfile -> injectProfileStyles
 * sequence the rest of the Lab uses, then activate for a live preview.
 */
export function ThemeGenerator() {
  const { createProfile, updateProfile, setActiveProfile } = useCustomProfileStore();
  const [vibe, setVibe] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  // Walk the curated worlds in order instead of an RNG so repeated clicks cycle
  // predictably (and tests stay deterministic).
  const surpriseIndexRef = useRef(0);

  /**
   * Persist a generated world: mint a new profile on its base preset, layer in
   * the generated overrides (resolving a fallback voice if none came back),
   * activate it, and inject its styles for an immediate live preview.
   */
  const applyGeneratedProfile = (generated: GeneratedProfile) => {
    const created = createProfile(generated.name, generated.baseAestheticId);

    const resolvedVoiceId =
      generated.voice?.voiceId && generated.voice.voiceId.trim().length > 0
        ? generated.voice.voiceId
        : getDefaultVoiceId(generated.baseAestheticId);

    const updates: Partial<Omit<CustomProfile, "id" | "createdAt">> = {
      name: generated.name,
      description: generated.description,
      baseAestheticId: generated.baseAestheticId,
      colors: generated.colors,
      fonts: generated.fonts,
      audio: generated.audio,
      voice: { ...generated.voice, voiceId: resolvedVoiceId },
      effects: generated.effects,
      imageStylePrompt: generated.imageStylePrompt,
      systemPrompt: generated.systemPrompt,
    };

    updateProfile(created.id, updates);
    setActiveProfile(created.id);
    // Inject the merged profile so the override CSS is live immediately.
    injectProfileStyles({ ...created, ...updates });

    setSuccessMessage(`Generated "${generated.name}" and made it your active world.`);
    setErrorMessage(null);
  };

  const handleGenerate = async () => {
    const prompt = vibe.trim();
    if (prompt.length === 0) {
      setErrorMessage("Describe a vibe first.");
      setSuccessMessage(null);
      return;
    }

    setIsGenerating(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const response = await fetch("/api/theme", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data?.success || !data?.profile) {
        throw new Error(data?.error || "Theme generation failed. Please try again.");
      }

      applyGeneratedProfile(data.profile as GeneratedProfile);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Theme generation failed. Please try again.";
      setErrorMessage(msg);
      setSuccessMessage(null);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSurprise = () => {
    const index = surpriseIndexRef.current;
    surpriseIndexRef.current = (index + 1) % SURPRISE_PROFILE_COUNT;
    applyGeneratedProfile(pickSurpriseProfile(index));
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-xs font-mono uppercase tracking-wider text-[var(--aesthetic-text)]">
          Describe a World
        </h3>
        <p className="text-[11px] font-mono text-[var(--aesthetic-text-muted)] leading-relaxed">
          Describe a vibe and the AI will design a full, coherent world — palette, fonts, persona,
          atmosphere, and image style. Or hit Surprise Me for a curated world, no API key needed.
        </p>
      </div>

      <textarea
        value={vibe}
        onChange={(e) => setVibe(e.target.value)}
        disabled={isGenerating}
        rows={4}
        placeholder="e.g. a rain-soaked neon night market, equal parts chrome and superstition"
        data-testid="theme-vibe-input"
        className="w-full resize-none px-3 py-2 text-sm font-mono bg-[var(--aesthetic-surface)] border border-[var(--aesthetic-border)] text-[var(--aesthetic-text)] placeholder:text-[var(--aesthetic-text-muted)] rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--aesthetic-accent)] disabled:opacity-50"
      />

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          data-testid="theme-generate-button"
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs font-mono uppercase tracking-wider border border-[var(--aesthetic-accent)] text-[var(--aesthetic-accent)] hover:bg-[var(--aesthetic-accent)]/10 rounded-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--aesthetic-accent)] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Wand2 className="w-3.5 h-3.5" />
          )}
          {isGenerating ? "Generating..." : "Generate"}
        </button>

        <button
          onClick={handleSurprise}
          disabled={isGenerating}
          data-testid="theme-surprise-button"
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs font-mono uppercase tracking-wider border border-[var(--aesthetic-text)]/30 text-[var(--aesthetic-text)] hover:bg-[var(--aesthetic-text)]/5 rounded-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--aesthetic-accent)] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Shuffle className="w-3.5 h-3.5" />
          Surprise Me
        </button>
      </div>

      {successMessage && (
        <div className="flex items-start gap-2 p-3 bg-green-500/10 border border-green-500/30 rounded-sm text-green-500 font-mono text-[11px] leading-relaxed">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <span data-testid="theme-success">{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-start gap-2 p-3 bg-[var(--aesthetic-error)]/10 border border-[var(--aesthetic-error)]/30 rounded-sm text-[var(--aesthetic-error)] font-mono text-[11px] leading-relaxed">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span data-testid="theme-error">{errorMessage}</span>
        </div>
      )}

      <p className="flex items-center gap-1.5 text-[10px] font-mono text-[var(--aesthetic-text-muted)]">
        <Sparkles className="w-3 h-3" />
        The generated persona is a speaking voice only; the app keeps its own UI-generation rules.
      </p>
    </div>
  );
}
