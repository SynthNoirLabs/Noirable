"use client";

import React from "react";

/**
 * A2UI v0.9 Variant + Iteration Controls (Bigger Bet 6)
 *
 * Workspace toolbar for the Take 1/2/3 picker and the iterative-regeneration
 * actions ("Make it fancier" / "Simplify" / "Different angle"). Purely
 * presentational — all generation logic lives in DetectiveWorkspace, which
 * reuses the existing v0.9 stream + baseline-capture flow.
 */

interface A2UIVariantControlsProps {
  /** Number of captured takes (0 = picker hidden). */
  variants: number;
  /** Currently-shown take index. */
  activeIndex: number;
  /** Whether a multi-take generation run is in flight. */
  isGenerating: boolean;
  /** Whether a single v0.9 stream is in flight (locks the take picker). */
  isStreaming?: boolean;
  /** Whether iteration / variant actions can fire (idle + a prior prompt). */
  canIterate: boolean;
  /** Explicit user request to fire the same prompt N times with offset seeds. */
  onGenerateVariants: () => void;
  /** Swap which captured take is shown. */
  onSelectVariant: (index: number) => void;
  /** Re-send the live surface as baseline with a canned refinement appended. */
  onIterate: (instruction: string) => void;
}

const ITERATIONS: ReadonlyArray<{ label: string; instruction: string }> = [
  {
    label: "Make it fancier",
    instruction: "Refine the current evidence: make it richer, more detailed, and more elaborate.",
  },
  {
    label: "Simplify",
    instruction: "Refine the current evidence: make it simpler, leaner, and more restrained.",
  },
  {
    label: "Different angle",
    instruction:
      "Re-arrange the current evidence into a different layout and section order while keeping the same content.",
  },
];

const BUTTON_CLASS =
  "px-3 py-1.5 bg-[var(--aesthetic-accent)]/10 border border-[var(--aesthetic-accent)]/40 text-[var(--aesthetic-accent)] font-typewriter text-xs uppercase tracking-wider rounded-sm hover:bg-[var(--aesthetic-accent)]/25 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--aesthetic-accent)] disabled:opacity-40 disabled:cursor-not-allowed";

export function A2UIVariantControls({
  variants,
  activeIndex,
  isGenerating,
  isStreaming = false,
  canIterate,
  onGenerateVariants,
  onSelectVariant,
  onIterate,
}: A2UIVariantControlsProps) {
  // Loading a captured take clears + recreates the surface store, which would
  // race a stream still writing into it. Lock the picker while anything is in
  // flight.
  const pickerLocked = isStreaming || isGenerating;
  return (
    <div
      data-testid="a2ui-variant-controls"
      className="flex flex-col gap-2 border border-[var(--aesthetic-border)]/30 bg-[var(--aesthetic-background)]/30 p-2 rounded-sm"
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[var(--aesthetic-text)]/60 font-mono text-[10px] uppercase tracking-wider mr-1">
          Variations
        </span>
        <button
          type="button"
          className={BUTTON_CLASS}
          disabled={!canIterate}
          onClick={onGenerateVariants}
          aria-label="Generate three takes"
        >
          {isGenerating ? "Developing…" : "Generate 3 takes"}
        </button>
        {ITERATIONS.map((it) => (
          <button
            key={it.label}
            type="button"
            className={BUTTON_CLASS}
            disabled={!canIterate}
            onClick={() => onIterate(it.instruction)}
          >
            {it.label}
          </button>
        ))}
      </div>

      {variants > 0 && (
        <div
          data-testid="a2ui-take-picker"
          className="flex flex-wrap items-center gap-2"
          role="group"
          aria-label="Choose a take"
        >
          {Array.from({ length: variants }, (_, i) => {
            const isActive = i === activeIndex;
            return (
              <button
                key={i}
                type="button"
                aria-pressed={isActive}
                disabled={pickerLocked}
                className={`px-3 py-1.5 font-typewriter text-xs uppercase tracking-wider rounded-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--aesthetic-accent)] disabled:opacity-40 disabled:cursor-not-allowed ${
                  isActive
                    ? "bg-[var(--aesthetic-accent)]/30 border border-[var(--aesthetic-accent)] text-[var(--aesthetic-accent)]"
                    : "bg-transparent border border-[var(--aesthetic-border)]/40 text-[var(--aesthetic-text)]/70 hover:bg-[var(--aesthetic-accent)]/10"
                }`}
                onClick={() => onSelectVariant(i)}
              >
                Take {i + 1}
              </button>
            );
          })}
          {isGenerating && (
            <span className="text-[var(--aesthetic-text)]/50 font-mono text-[10px]">
              developing more…
            </span>
          )}
        </div>
      )}
    </div>
  );
}
