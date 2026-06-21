/**
 * Client-safe audio coordination helpers for Bigger Bet 4.
 *
 * Two concerns live here, both intentionally framework-free so they stay
 * testable without a DOM or an `Audio` implementation:
 *
 *  1. Semantic SFX events — the vocabulary the reactive audio bus speaks. These
 *     line up 1:1 with the keys of {@link AudioEventMap} in the aesthetic schema,
 *     so a per-preset map (via `getAudioEvents(aestheticId)`) can resolve an
 *     event to the concrete {@link SfxName} that should fire. This is what lets
 *     ALL presets react, not just noir's old English keyword scan.
 *
 *  2. A tiny module-level pub/sub channel used to duck the music bed under TTS
 *     narration. ChatSidebar (where TTS plays) and NoirMusic (the bed) live in
 *     disjoint React subtrees, so a singleton channel decouples them without
 *     prop-drilling through agent-owned layout files.
 */

import type { AudioEventMap } from "@/lib/aesthetic/types";

/** Semantic audio events. Mirrors the keys of {@link AudioEventMap}. */
export type AudioEventName = keyof AudioEventMap;

/** All semantic event names, ordered most→least frequent for readability. */
export const AUDIO_EVENT_NAMES: readonly AudioEventName[] = [
  "message.start",
  "message.complete",
  "component.placed",
  "dramatic.beat",
  "world.arrived",
  "error",
] as const;

/**
 * Narrative keyword → semantic event mapping. Previously ChatSidebar fired
 * thunder/phone directly from these noir-only English keywords; now they map to
 * semantic events so the resolved SFX follows the active preset's
 * {@link AudioEventMap}. Kept as a best-effort fallback signal (the primary
 * triggers are lifecycle events fired on generation/TTS start + completion).
 */
const KEYWORD_EVENTS: ReadonlyArray<{ event: AudioEventName; keywords: readonly string[] }> = [
  {
    event: "dramatic.beat",
    keywords: ["lightning", "thunder", "relámpago", "trueno"],
  },
  {
    event: "error",
    keywords: [
      "phone rang",
      "phone ring",
      "phone-ring",
      "telephone rang",
      "telephone ring",
      "phone rings",
      "telephone rings",
      "phone ringing",
      "telephone ringing",
      "teléfono sonó",
      "teléfono sonando",
    ],
  },
];

/**
 * Scan narrative text for atmospheric keywords and return the matching semantic
 * events (deduped, in declaration order). Case-insensitive.
 */
export function scanTextForAudioEvents(text: string): AudioEventName[] {
  if (!text) {
    return [];
  }
  const lower = text.toLowerCase();
  const events: AudioEventName[] = [];
  for (const { event, keywords } of KEYWORD_EVENTS) {
    if (keywords.some((kw) => lower.includes(kw))) {
      events.push(event);
    }
  }
  return events;
}

/**
 * Like {@link scanTextForAudioEvents} but also returns the character index of
 * the first matching keyword per event, so a caller can schedule the cue to
 * land roughly when the narration speaks that word. Sorted by index ascending.
 */
export function scanTextForAudioEventTimings(
  text: string
): Array<{ event: AudioEventName; index: number }> {
  if (!text) {
    return [];
  }
  const lower = text.toLowerCase();
  const timings: Array<{ event: AudioEventName; index: number }> = [];
  for (const { event, keywords } of KEYWORD_EVENTS) {
    let earliest = -1;
    for (const kw of keywords) {
      const at = lower.indexOf(kw);
      if (at !== -1 && (earliest === -1 || at < earliest)) {
        earliest = at;
      }
    }
    if (earliest !== -1) {
      timings.push({ event, index: earliest });
    }
  }
  return timings.sort((a, b) => a.index - b.index);
}

/**
 * Whether a semantic event should also flash the lightning overlay. Decoupled
 * from the SFX it resolves to so the visual beat stays in sync with the
 * "dramatic" cue regardless of which preset's sound plays.
 */
export function eventTriggersLightning(event: AudioEventName): boolean {
  return event === "dramatic.beat";
}

// ---------------------------------------------------------------------------
// Music ducking channel (cross-subtree pub/sub)
// ---------------------------------------------------------------------------

/** Listener invoked with the desired duck factor in [0, 1] (1 = full volume). */
export type DuckListener = (factor: number) => void;

/** Default ducked level for the music bed while TTS narration plays. */
export const DUCK_FACTOR = 0.35;
/** Full-volume factor (restore). */
export const RESTORE_FACTOR = 1;

const duckListeners = new Set<DuckListener>();
let currentDuckFactor = RESTORE_FACTOR;

/**
 * Subscribe to music-duck changes. The listener is invoked immediately with the
 * current factor so a late-mounting bed picks up an in-progress duck. Returns an
 * unsubscribe function.
 */
export function subscribeMusicDuck(listener: DuckListener): () => void {
  duckListeners.add(listener);
  listener(currentDuckFactor);
  return () => {
    duckListeners.delete(listener);
  };
}

/** Set the duck factor and notify subscribers (no-op if unchanged). */
export function setMusicDuckFactor(factor: number): void {
  const clamped = Math.max(0, Math.min(1, factor));
  if (clamped === currentDuckFactor) {
    return;
  }
  currentDuckFactor = clamped;
  for (const listener of duckListeners) {
    listener(clamped);
  }
}

/** Duck the music bed (TTS started). */
export function duckMusic(): void {
  setMusicDuckFactor(DUCK_FACTOR);
}

/** Restore the music bed to full volume (TTS ended / stopped). */
export function restoreMusic(): void {
  setMusicDuckFactor(RESTORE_FACTOR);
}

// ---------------------------------------------------------------------------
// Semantic-event channel (cross-subtree pub/sub) — the reactive desk
// ---------------------------------------------------------------------------

/**
 * Lets RENDERED CONTENT cue the world: a `danger` badge landing on the board
 * emits a `dramatic.beat`, which the audio owner (ChatSidebar, which holds the
 * NoirSoundEffects controls) resolves through the active preset's AudioEventMap
 * — thunder in noir, the reactor groan in nostromo — and pairs with the
 * lightning overlay via {@link eventTriggersLightning}. Same singleton-channel
 * pattern as the music duck above, because emitter and owner live in disjoint
 * React subtrees.
 */
export type SemanticEventListener = (event: AudioEventName) => void;

const semanticListeners = new Set<SemanticEventListener>();

/** Per-event throttle so a board of six danger badges fires ONE thunderclap. */
const lastEmittedAt = new Map<AudioEventName, number>();
const SEMANTIC_EVENT_MIN_INTERVAL_MS = 4000;

/** Subscribe to semantic events emitted by rendered content. */
export function subscribeSemanticAudioEvents(listener: SemanticEventListener): () => void {
  semanticListeners.add(listener);
  return () => {
    semanticListeners.delete(listener);
  };
}

/**
 * Emit a semantic event from rendered content (throttled per event name).
 * Returns true when the event was delivered, false when throttled.
 */
export function emitSemanticAudioEvent(event: AudioEventName): boolean {
  const now = typeof performance !== "undefined" ? performance.now() : Date.now();
  const last = lastEmittedAt.get(event) ?? -Infinity;
  if (now - last < SEMANTIC_EVENT_MIN_INTERVAL_MS) {
    return false;
  }
  lastEmittedAt.set(event, now);
  for (const listener of semanticListeners) {
    listener(event);
  }
  return true;
}

/** Test hook: clear the semantic-event throttle clock. */
export function resetSemanticAudioEventThrottle(): void {
  lastEmittedAt.clear();
}

/** Current duck factor — exposed for late subscribers and tests. */
export function getMusicDuckFactor(): number {
  return currentDuckFactor;
}
