"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { useReducedMotion } from "framer-motion";
import { getMotionPersonality } from "@/lib/aesthetic/identity";
import type { AestheticId, MotionPersonality } from "@/lib/aesthetic/types";

export type WorldEntrance = MotionPersonality["entrance"];

/** How long the outgoing world's "strike the set" exit plays before the swap. */
const EXIT_MS = 420;

/** Entrances whose reveal runs through the View Transitions API (a real DOM
 *  morph — e.g. noir's iris) rather than an opaque diegetic scene overlay. */
const VIEW_TRANSITION_ENTRANCES: ReadonlySet<WorldEntrance> = new Set(["cinematic", "crisp"]);

export function supportsViewTransitions(): boolean {
  // startViewTransition is typed in lib.dom but absent in older browsers/jsdom.
  return typeof document !== "undefined" && typeof document.startViewTransition === "function";
}

interface WorldView {
  aestheticId: AestheticId | undefined;
  customProfileId: string | undefined;
}

export interface WorldSwitchState {
  /** Lagged world the DESK actually shows (commits after the exit beat). */
  displayAestheticId: AestheticId | undefined;
  displayCustomProfileId: string | undefined;
  /** Outgoing world's entrance during the strike-the-set phase, else null. */
  exitingEntrance: WorldEntrance | null;
  /** Bumped on every committed switch — re-keys the surface so content
   *  re-deals itself in the new world's physics. */
  worldEpoch: number;
  /** True exactly once after a switch: the next completed generation should
   *  play the arrival flourish. Calling it consumes the flag. */
  consumeArrival: () => boolean;
}

/**
 * The world-switch choreography conductor. The STORE changes instantly (so
 * prompts, personas, and settings use the new world immediately); the DESK
 * lags behind it:
 *
 *   target changes → strike the set (outgoing exit physics, EXIT_MS)
 *                  → commit (via document.startViewTransition for the
 *                    morph-style entrances, plain state swap for the opaque
 *                    diegetic scenes)
 *                  → epoch bump re-deals the board in the new world's physics
 *                  → WorldTransition plays the arrival scene on the new desk.
 *
 * Reduced motion commits immediately with no exit phase, no view transition,
 * and no epoch bump (no re-deal animation to run).
 */
export function useWorldSwitch(
  targetAestheticId: AestheticId | undefined,
  targetCustomProfileId: string | undefined
): WorldSwitchState {
  const prefersReducedMotion = useReducedMotion();
  const [display, setDisplay] = useState<WorldView>({
    aestheticId: targetAestheticId,
    customProfileId: targetCustomProfileId,
  });
  const [exitingEntrance, setExitingEntrance] = useState<WorldEntrance | null>(null);
  const [pendingTarget, setPendingTarget] = useState<WorldView | null>(null);
  const [worldEpoch, setWorldEpoch] = useState(0);
  const arrivalPendingRef = useRef(false);

  const targetKey = `${targetAestheticId}/${targetCustomProfileId ?? ""}`;

  // React's "adjust state during render" pattern: detect a target change
  // without an effect, so the exit phase starts on the very next paint.
  const [lastTargetKey, setLastTargetKey] = useState(targetKey);
  if (targetKey !== lastTargetKey) {
    setLastTargetKey(targetKey);
    setPendingTarget({ aestheticId: targetAestheticId, customProfileId: targetCustomProfileId });
    setExitingEntrance(
      prefersReducedMotion ? null : getMotionPersonality(display.aestheticId).entrance
    );
  }

  useEffect(() => {
    if (!pendingTarget) return;
    const timer = setTimeout(
      () => {
        const incoming = getMotionPersonality(pendingTarget.aestheticId).entrance;
        const finish = () => {
          setExitingEntrance(null);
          setPendingTarget(null);
          setWorldEpoch((epoch) => epoch + 1);
          setDisplay(pendingTarget);
        };
        arrivalPendingRef.current = true;

        if (
          !prefersReducedMotion &&
          supportsViewTransitions() &&
          VIEW_TRANSITION_ENTRANCES.has(incoming)
        ) {
          // Per-world ::view-transition keyframes are scoped by a class on <html>
          // (see globals.css). flushSync makes React commit inside the snapshot
          // callback so the browser captures the finished "new" frame.
          const root = document.documentElement;
          const vtClass = `vt-${incoming}`;
          root.classList.add(vtClass);
          const transition = document.startViewTransition(() => {
            flushSync(finish);
          });
          transition.finished.finally(() => root.classList.remove(vtClass));
        } else {
          finish();
        }
      },
      prefersReducedMotion ? 0 : EXIT_MS
    );
    return () => clearTimeout(timer);
  }, [pendingTarget, prefersReducedMotion]);

  const consumeArrival = useCallback(() => {
    if (!arrivalPendingRef.current) return false;
    arrivalPendingRef.current = false;
    return true;
  }, []);

  return {
    displayAestheticId: display.aestheticId,
    displayCustomProfileId: display.customProfileId,
    exitingEntrance,
    worldEpoch,
    consumeArrival,
  };
}
