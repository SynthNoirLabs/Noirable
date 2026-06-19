"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { getAestheticCopy, getMotionPersonality } from "@/lib/aesthetic/identity";
import { useCustomProfileStore } from "@/lib/store/useCustomProfileStore";
import { emitSemanticAudioEvent } from "@/lib/audio/audioEvents";
import { supportsViewTransitions } from "./useWorldSwitch";
import type { AestheticId, MotionPersonality } from "@/lib/aesthetic/types";

type Entrance = MotionPersonality["entrance"];

/** Scene length per entrance — must cover the longest animation in its CSS. */
const SCENE_DURATION_MS: Record<Entrance, number> = {
  cinematic: 1400,
  crisp: 300,
  glitch: 1300,
  terminal: 1700,
  candle: 1700,
  waltz: 1700,
};

/** Nostromo's boot self-test, printed line by line over black. */
const BOOT_LINES = [
  "WEYLAND-YUTANI SYSTEMS // BOOT SEQUENCE",
  "MEMORY CHECK ............... OK",
  "INTERFACE 2037 ............. ONLINE",
];

/** Deterministic glyph columns for the cyber jack-in tunnel. */
const JACK_IN_GLYPHS = "アイウエオカキクケコサシスセソ0123456789<>/\\|=+*";
function glyphColumn(seed: number): string {
  let out = "";
  for (let i = 0; i < 26; i++) {
    out += JACK_IN_GLYPHS[(seed * 31 + i * 17) % JACK_IN_GLYPHS.length] + "\n";
  }
  return out;
}

interface WorldTransitionProps {
  /** Resolved base aesthetic id — drives WHICH arrival scene plays. */
  aestheticId?: AestheticId;
  /**
   * Identity key for the displayed world (base id + custom profile id). The
   * scene plays whenever this changes, so switching between two custom
   * profiles that share a base still gets a beat.
   */
  worldKey: string;
}

/**
 * World-arrival cinematics — a one-shot diegetic micro-scene played when the
 * desk commits to a new world:
 *   • terminal  — MU-TH-UR boot: self-test lines print over black, CRT
 *                 shutters part from a phosphor line.
 *   • waltz     — the hotel elevator: brass doors part on the lobby.
 *   • glitch    — the jack-in: a tunnel of streaming glyphs shreds away.
 *   • candle    — a match strike: a flame blooms and light spreads from it.
 *   • cinematic — title card over a darkened beat; the REVEAL is the View
 *                 Transitions iris when supported (overlay wipe as fallback).
 *   • crisp     — a clean white blink, no card (minimal's restraint).
 * Each scene carries the world's title card (display font + tagline) and emits
 * the per-world arrival sting on the semantic audio channel. Never plays on
 * first mount, never under prefers-reduced-motion.
 */
export function WorldTransition({ aestheticId, worldKey }: WorldTransitionProps) {
  const prefersReducedMotion = useReducedMotion();
  const [playKey, setPlayKey] = useState<string | null>(null);
  // React's "adjust state during render" pattern (no effect, no cascade).
  const [lastKey, setLastKey] = useState(worldKey);
  if (lastKey !== worldKey) {
    setLastKey(worldKey);
    if (!prefersReducedMotion) {
      setPlayKey(worldKey);
    }
  }

  const entrance = getMotionPersonality(aestheticId).entrance;
  const copy = getAestheticCopy(aestheticId);

  // A custom world's title card carries the PROFILE's name, not its base
  // preset's (the copy helper falls back to the base world otherwise).
  const activeProfile = useCustomProfileStore((state) => {
    if (!state.activeCustomProfileId) return null;
    return state.customProfiles.find((p) => p.id === state.activeCustomProfileId) ?? null;
  });
  const title = activeProfile ? activeProfile.name.toUpperCase() : copy.arrivalTitle;
  const tagline = activeProfile ? (activeProfile.description ?? "") : copy.arrivalTagline;

  // Arrival sting + scene lifetime. The sting routes through the semantic
  // channel so each world plays ITS OWN sound (thunder / desk bell / relay);
  // noir's and gothic's arrivals also flash the lightning overlay.
  useEffect(() => {
    if (!playKey) return;
    emitSemanticAudioEvent("world.arrived");
    if ((entrance === "cinematic" || entrance === "candle") && typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("noir-lightning"));
    }
    const timer = setTimeout(() => setPlayKey(null), (SCENE_DURATION_MS[entrance] ?? 1400) + 120);
    return () => clearTimeout(timer);
  }, [playKey, entrance]);

  if (!playKey) return null;

  const titleCard = title ? (
    <div className="wt-titlecard">
      <span className="wt-title">{title}</span>
      {tagline && <span className="wt-tagline">{tagline}</span>}
    </div>
  ) : null;

  // cinematic: when View Transitions handle the reveal (the iris morph), the
  // overlay is just a floating title card; without VT support it falls back to
  // the original opaque fade-from-black wipe.
  const cinematicClass =
    supportsViewTransitions() && entrance === "cinematic"
      ? "world-transition-card-only"
      : "world-transition-cinematic";

  switch (entrance) {
    case "terminal":
      return (
        <Scene className="world-transition-boot">
          <div className="wt-boot-lines">
            {BOOT_LINES.map((line, i) => (
              <div key={i} className="skeleton-line" style={{ animationDelay: `${i * 280}ms` }}>
                {line}
              </div>
            ))}
          </div>
          {titleCard}
        </Scene>
      );
    case "waltz":
      return (
        <Scene className="world-transition-elevator">
          <div className="wt-elevator-door wt-elevator-door-left" />
          <div className="wt-elevator-door wt-elevator-door-right" />
          <div className="wt-elevator-floor">★ LOBBY</div>
          {titleCard}
        </Scene>
      );
    case "glitch":
      return (
        <Scene className="world-transition-jackin">
          <div className="wt-glyph-field" aria-hidden>
            {Array.from({ length: 14 }, (_, i) => (
              <pre
                key={i}
                className="wt-glyph-column"
                style={{ animationDelay: `${(i % 5) * 90}ms`, left: `${(i / 14) * 100}%` }}
              >
                {glyphColumn(i + 1)}
              </pre>
            ))}
          </div>
          {titleCard}
        </Scene>
      );
    case "candle":
      return (
        <Scene className="world-transition-match">
          <div className="wt-match-flame" />
          <div className="wt-match-bloom" />
          {titleCard}
        </Scene>
      );
    case "crisp":
      return <Scene className="world-transition-crisp">{null}</Scene>;
    case "cinematic":
    default:
      return <Scene className={cinematicClass}>{titleCard}</Scene>;
  }
}

function Scene({ className, children }: { className: string; children: React.ReactNode }) {
  return (
    <div
      data-testid="world-transition"
      aria-hidden="true"
      className={`world-transition ${className}`}
    >
      {children}
    </div>
  );
}
