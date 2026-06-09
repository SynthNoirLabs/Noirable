"use client";

import React, { useState } from "react";
import { Film, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useVideoConfigured, useVideoGeneration } from "@/lib/hooks/useVideoGeneration";

/**
 * Video Lab — on-demand text→video generation (Google Veo 3 Fast).
 *
 * Deliberately separate from UI/chat generation: video is comparatively
 * expensive, so it's ALWAYS an explicit user action here, never bundled into a
 * surface generation the way images are. The whole panel is disabled when no
 * Google API key is configured. Generation is async (start → poll) via
 * useVideoGeneration; the finished clip plays inline.
 */

const ASPECT_RATIOS = ["16:9", "9:16"] as const;

export function VideoLab({ aestheticId }: { aestheticId?: string }) {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState<(typeof ASPECT_RATIOS)[number]>("16:9");
  const { status, videoUrl, error, generate, reset } = useVideoGeneration();
  const configured = useVideoConfigured();

  const busy = status === "starting" || status === "pending";
  const disabled = busy || !prompt.trim() || configured === false;

  return (
    <div className="border border-[var(--aesthetic-border)]/30 rounded-sm p-3 space-y-3 bg-[var(--aesthetic-background)]/20">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between font-typewriter text-xs uppercase tracking-widest text-[var(--aesthetic-accent)] hover:opacity-85 focus:outline-none"
        aria-expanded={open}
      >
        <span className="flex items-center gap-1.5 font-bold">
          <Film className="w-3.5 h-3.5" />
          Video Lab
        </span>
        {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>

      {open && (
        <div className="space-y-3 pt-2 border-t border-[var(--aesthetic-border)]/15">
          {configured === false && (
            <p className="font-mono text-[10px] leading-relaxed text-[var(--aesthetic-text-muted)]">
              Set GOOGLE_GENERATIVE_AI_API_KEY (or GEMINI_API_KEY) to enable on-demand video
              generation.
            </p>
          )}

          {/* Aspect ratio */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-mono text-[var(--aesthetic-text)]/50 uppercase tracking-widest block">
              Aspect Ratio
            </span>
            <div className="grid grid-cols-2 gap-2">
              {ASPECT_RATIOS.map((ratio) => (
                <button
                  key={ratio}
                  type="button"
                  onClick={() => setAspectRatio(ratio)}
                  className={cn(
                    "px-2 py-1 border rounded-sm font-mono text-[10px] uppercase tracking-wider transition-colors",
                    aspectRatio === ratio
                      ? "border-[var(--aesthetic-accent)] text-[var(--aesthetic-accent)] bg-[var(--aesthetic-accent)]/10"
                      : "border-[var(--aesthetic-border)]/50 text-[var(--aesthetic-text-muted)] hover:border-[var(--aesthetic-text)]"
                  )}
                >
                  {ratio === "16:9" ? "Landscape 16:9" : "Portrait 9:16"}
                </button>
              ))}
            </div>
          </div>

          {/* Prompt */}
          <div className="space-y-1">
            <label className="text-[10px] font-mono text-[var(--aesthetic-text)]/50 uppercase tracking-widest block">
              Shot Description (Prompt)
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="A slow dolly through a rain-slicked alley, neon signs flickering…"
              rows={3}
              disabled={configured === false}
              className="w-full bg-[var(--aesthetic-background)]/60 border border-[var(--aesthetic-border)]/45 rounded-sm p-2 text-xs font-mono text-[var(--aesthetic-text)] placeholder-[var(--aesthetic-text-muted)]/50 focus:outline-none focus:border-[var(--aesthetic-accent)]/80 resize-none disabled:opacity-50"
            />
          </div>

          {/* Generate */}
          <button
            type="button"
            onClick={() => generate(prompt, { aestheticId, aspectRatio })}
            disabled={disabled}
            className={cn(
              "w-full py-1.5 rounded-sm border font-typewriter text-xs uppercase tracking-widest text-center transition-all",
              disabled
                ? "bg-transparent border-[var(--aesthetic-border)]/30 text-[var(--aesthetic-text-muted)] opacity-50 cursor-not-allowed"
                : "bg-[var(--aesthetic-accent)]/15 border-[var(--aesthetic-accent)] text-[var(--aesthetic-accent)] hover:bg-[var(--aesthetic-accent)]/25 active:scale-[0.98]"
            )}
          >
            {busy ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                {status === "starting" ? "Starting…" : "Developing footage…"}
              </span>
            ) : (
              "Generate Clip"
            )}
          </button>

          <p className="font-mono text-[9px] leading-relaxed text-[var(--aesthetic-text-muted)]/70">
            Veo 3 Fast generates a paid clip on demand. This can take up to a few minutes.
          </p>

          {/* Error */}
          {status === "failed" && error && (
            <p className="text-[var(--aesthetic-error)] font-mono text-[9px] leading-relaxed border-t border-[var(--aesthetic-error)]/25 pt-1.5 mt-1">
              ERROR: {error}
            </p>
          )}

          {/* Result */}
          {status === "ready" && videoUrl && (
            <div className="space-y-1.5 pt-2 border-t border-[var(--aesthetic-border)]/15">
              <video
                src={videoUrl}
                controls
                className="block w-full rounded-sm border border-[var(--aesthetic-border)]/40 sepia-[0.15]"
              />
              <button
                type="button"
                onClick={reset}
                className="w-full py-1 text-center font-mono text-[9px] uppercase tracking-wider text-[var(--aesthetic-text-muted)] hover:text-[var(--aesthetic-text)] transition-colors border border-dashed border-[var(--aesthetic-border)]/35 rounded-sm"
              >
                Clear & Compose Another
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
