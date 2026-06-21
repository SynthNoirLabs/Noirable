"use client";

import { useReducedMotion } from "framer-motion";
import { getMotionPersonality } from "@/lib/aesthetic/identity";
import type { MotionPersonality } from "@/lib/aesthetic/types";
import { useBaseAestheticId } from "./binding";

// ============================================================================
// Motion helpers
// ============================================================================

/**
 * Map a preset's CSS easing string to a framer-motion-compatible easing.
 * Named CSS keywords become framer's camelCase names; a `cubic-bezier(a,b,c,d)`
 * becomes the 4-tuple framer expects; `steps(n, …)` (nostromo's terminal feel)
 * becomes a custom step function so the content genuinely PRINTS in over
 * discrete frames instead of sliding (framer accepts any (t)=>t easing).
 */
export function mapEasing(
  easing: string
): "easeOut" | "easeInOut" | "linear" | [number, number, number, number] | ((t: number) => number) {
  if (easing === "ease-out") return "easeOut";
  if (easing === "ease-in-out") return "easeInOut";
  const cubic = easing.match(
    /cubic-bezier\(\s*([-\d.]+)\s*,\s*([-\d.]+)\s*,\s*([-\d.]+)\s*,\s*([-\d.]+)\s*\)/
  );
  if (cubic) {
    return [Number(cubic[1]), Number(cubic[2]), Number(cubic[3]), Number(cubic[4])];
  }
  const steps = easing.match(/steps\(\s*(\d+)/);
  if (steps) {
    const n = Math.max(1, Number(steps[1]));
    return (t: number) => Math.min(1, Math.floor(t * n) / n);
  }
  return "linear";
}

/**
 * The "hidden" (pre-reveal) offset for a surface child, keyed off the preset's
 * motion-personality entrance. All start invisible (opacity 0) and animate to a
 * shared settled target (y/x 0, scale 1) — only the starting offset differs, so
 * each preset's content arrives with its own physics:
 *   • cinematic (noir)   — drifts up and in from the lower-left like a slow pan.
 *   • glitch (cyber)     — snaps up from a slightly shrunk "boot-up" scale.
 *   • terminal (nostromo)— prints downward from above, like a new console line.
 *   • candle (gothic)    — swells up from a small, flickering candlelit scale.
 *   • crisp (minimal)    — a short, clean hop with no scale flourish.
 * Translate distances stay small (≤12px) so the stagger reads as poise, not
 * jank. Reduced-motion callers skip the motion wrapper entirely, so this is
 * never used under `prefers-reduced-motion`.
 */
export function entranceHiddenVariant(entrance: MotionPersonality["entrance"]): {
  opacity: number;
  y?: number;
  x?: number;
  scale?: number;
} {
  switch (entrance) {
    case "cinematic":
      return { opacity: 0, y: 12, x: -4 };
    case "glitch":
      return { opacity: 0, y: 6, scale: 0.94 };
    case "terminal":
      return { opacity: 0, y: -6 };
    case "candle":
      return { opacity: 0, y: 4, scale: 0.96 };
    case "waltz":
      // grand-hotel — an unhurried rise with a slight inward sweep, like a
      // guest gliding into the lobby.
      return { opacity: 0, y: 10, x: 4, scale: 0.97 };
    case "crisp":
    default:
      return { opacity: 0, y: 5 };
  }
}

/**
 * Entrance-motion settings for renderers that animate their OWN internals
 * (Kanban columns/cards, Dashboard widgets, Table rows) — the same per-world
 * physics ChildList gives top-level children, so the densest components stop
 * popping in flat. Returns null under prefers-reduced-motion so callers render
 * plain elements. The stagger index is capped so a 40-row table doesn't take
 * four seconds to settle.
 */
export function useInternalEntrance() {
  const baseAestheticId = useBaseAestheticId();
  const prefersReducedMotion = useReducedMotion();
  const personality = getMotionPersonality(baseAestheticId);
  if (prefersReducedMotion) return null;
  return {
    hidden: entranceHiddenVariant(personality.entrance),
    show: { opacity: 1, y: 0, x: 0, scale: 1 },
    transition: (index: number) => ({
      duration: personality.durationMs / 1000,
      ease: mapEasing(personality.easing),
      delay: Math.min(index, 10) * (personality.staggerMs / 1000),
    }),
  };
}
