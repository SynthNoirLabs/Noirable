"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import type { AudioEventMap } from "@/lib/aesthetic/types";
import type { AudioEventName } from "@/lib/audio/audioEvents";

/** Sound effect names that map to a single pooled audio element each. */
type SfxPool = Partial<Record<SoundEffectName, HTMLAudioElement>>;

export type SoundEffectName = "typewriter" | "thunder" | "phone";

export interface NoirSoundEffectsControls {
  playTypewriter: () => void;
  playThunder: () => void;
  playPhoneRing: () => void;
  /**
   * Play the SFX mapped to a semantic event by the active preset's
   * {@link AudioEventMap}. No-op when the preset leaves the event unmapped, so
   * every aesthetic — not just noir — reacts to lifecycle/narrative cues.
   */
  playByEvent: (event: AudioEventName) => void;
}

/** SFX configuration type */
export type SfxConfig = Record<SoundEffectName, { src: string; volume: number }>;

interface NoirSoundEffectsProps {
  enabled: boolean;
  onReady?: (controls: NoirSoundEffectsControls | null) => void;
  /** SFX configuration from audio pack. Overrides defaults. */
  sfxConfig?: SfxConfig;
  sfxVolumes?: { typewriter: number; thunder: number; phone: number };
  /**
   * Per-preset semantic-event → SFX map (from `getAudioEvents(aestheticId)`).
   * Drives {@link NoirSoundEffectsControls.playByEvent}. Defaults to noir's map.
   */
  audioEvents?: AudioEventMap;
}

/** Default semantic-event mapping (noir aesthetic). */
const DEFAULT_AUDIO_EVENTS: AudioEventMap = {
  "component.placed": "typewriter",
  "dramatic.beat": "thunder",
  error: "phone",
};

/** Default SFX configuration (noir aesthetic) */
const DEFAULT_SFX_CONFIG: SfxConfig = {
  typewriter: { src: "/assets/noir/typewriter.mp3", volume: 0.6 },
  thunder: { src: "/assets/noir/thunder.mp3", volume: 0.75 },
  phone: { src: "/assets/noir/phone-ring.mp3", volume: 0.7 },
};

// Use ref for callback to avoid infinite loops from inline functions
function useCallbackRef<T>(callback: T | undefined) {
  const ref = useRef(callback);
  useEffect(() => {
    ref.current = callback;
  }, [callback]);
  return ref;
}

export function NoirSoundEffects({
  enabled,
  onReady,
  sfxConfig,
  sfxVolumes,
  audioEvents,
}: NoirSoundEffectsProps) {
  const onReadyRef = useCallbackRef(onReady);

  // Use provided config or fallback to defaults
  const effectiveSfxConfig = sfxConfig ?? DEFAULT_SFX_CONFIG;
  const effectiveAudioEvents = audioEvents ?? DEFAULT_AUDIO_EVENTS;

  // Pool one audio element per effect rather than allocating a fresh
  // HTMLAudioElement on every trigger (which leaked decoded buffers).
  const poolRef = useRef<SfxPool>({});

  const playEffect = useCallback(
    (name: SoundEffectName) => {
      if (!enabled || typeof window === "undefined" || typeof Audio === "undefined") {
        return;
      }

      const { src, volume } = effectiveSfxConfig[name];
      const userVolume = sfxVolumes?.[name] ?? 1;
      let audio = poolRef.current[name];

      // (Re)create the pooled element if missing or its source changed.
      if (!audio || audio.getAttribute("src") !== src) {
        audio = new Audio(src);
        audio.preload = "auto";
        poolRef.current[name] = audio;
      }

      audio.volume = volume * userVolume;
      try {
        audio.currentTime = 0;
      } catch {
        // Ignore unsupported media API in non-browser environments.
      }
      audio.play().catch(() => {
        // Ignore autoplay errors - user interaction required
      });
    },
    [enabled, effectiveSfxConfig, sfxVolumes]
  );

  // Release pooled elements on unmount.
  useEffect(() => {
    const pool = poolRef.current;
    return () => {
      for (const audio of Object.values(pool)) {
        if (!audio) continue;
        audio.pause();
        audio.removeAttribute("src");
        audio.load();
      }
      poolRef.current = {};
    };
  }, []);

  const playByEvent = useCallback(
    (event: AudioEventName) => {
      const sfx = effectiveAudioEvents[event];
      if (!sfx) {
        return;
      }
      playEffect(sfx);
    },
    [effectiveAudioEvents, playEffect]
  );

  const controls = useMemo<NoirSoundEffectsControls>(
    () => ({
      playTypewriter: () => playEffect("typewriter"),
      playThunder: () => playEffect("thunder"),
      playPhoneRing: () => playEffect("phone"),
      playByEvent,
    }),
    [playEffect, playByEvent]
  );

  useEffect(() => {
    const currentOnReady = onReadyRef.current;
    currentOnReady?.(controls);
    return () => currentOnReady?.(null);
  }, [controls, onReadyRef]);

  return null;
}
