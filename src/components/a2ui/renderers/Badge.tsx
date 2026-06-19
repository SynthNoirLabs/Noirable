"use client";

import { useEffect } from "react";
import type { SurfaceComponent } from "@/lib/a2ui/surfaces/manager";
import { emitSemanticAudioEvent } from "@/lib/audio/audioEvents";
import { cn } from "@/lib/utils";
import type { ComponentProps } from "../internal/context";
import { useResolve } from "../internal/binding";

// Badge — a small status pill. Adapter-emitted (not in the upstream catalog).
// The legacy variant tokens (primary/secondary/ghost/danger) map to pill colors.
export function BadgeRenderer({ component }: ComponentProps) {
  const resolve = useResolve();
  const badge = component as SurfaceComponent & { label?: unknown; variant?: string };
  const label = String(resolve(badge.label) ?? "");
  const variant = badge.variant ?? "secondary";

  // The reactive desk: a danger badge landing on the board is a dramatic beat —
  // emit it on the semantic channel so the world reacts (thunder + lightning in
  // noir, the preset's own cue elsewhere). The channel throttles per event, so
  // a board of six danger badges fires exactly one clap.
  useEffect(() => {
    if (variant === "danger") {
      emitSemanticAudioEvent("dramatic.beat");
    }
  }, [variant]);

  const variantClass =
    variant === "danger"
      ? "border-[var(--aesthetic-error)]/50 bg-[var(--aesthetic-error)]/15 text-[var(--aesthetic-error)]"
      : variant === "primary"
        ? "border-[var(--aesthetic-accent)]/50 bg-[var(--aesthetic-accent)]/15 text-[var(--aesthetic-accent)]"
        : variant === "ghost"
          ? "border-[var(--aesthetic-border)]/40 bg-transparent text-[var(--aesthetic-text)]/70"
          : "border-[var(--aesthetic-border)]/50 bg-[var(--aesthetic-text)]/10 text-[var(--aesthetic-text)]/85";

  return (
    <span
      className={cn(
        // shrink-0 + whitespace-nowrap keep the pill intact in a tight Row
        // (otherwise flex compresses it and the text clips against the border).
        // `a2ui-badge` is the hook for per-aesthetic refinement in globals.css
        // (e.g. nostromo squares its corners to read as a terminal tag) without
        // disturbing the variant color tokens above.
        "a2ui-badge inline-flex shrink-0 items-center w-fit whitespace-nowrap rounded-full border px-3 py-1 font-typewriter text-[10px] uppercase tracking-wider leading-none",
        variantClass
      )}
    >
      {label}
    </span>
  );
}
