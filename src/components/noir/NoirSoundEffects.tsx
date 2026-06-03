"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";

/** Sound effect names that map to a single pooled audio element each. */
type SfxPool = Partial<Record<SoundEffectName, HTMLAudioElement>>;

export type SoundEffectName = "typewriter" | "thunder" | "phone";

export interface NoirSoundEffectsControls {
  playTypewriter: () => void;
  playThunder: () => void;
  playPhoneRing: () => void;
}

/** SFX configuration type */
export type SfxConfig = Record<SoundEffectName, { src: string; volume: number }>;

interface NoirSoundEffectsProps {
  enabled: boolean;
  onReady?: (controls: NoirSoundEffectsControls | null) => void;
  /** SFX configuration from audio pack. Overrides defaults. */
  sfxConfig?: SfxConfig;
}

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

export function NoirSoundEffects({ enabled, onReady, sfxConfig }: NoirSoundEffectsProps) {
  const onReadyRef = useCallbackRef(onReady);

  // Use provided config or fallback to defaults
  const effectiveSfxConfig = sfxConfig ?? DEFAULT_SFX_CONFIG;

  // Pool one audio element per effect rather than allocating a fresh
  // HTMLAudioElement on every trigger (which leaked decoded buffers).
  const poolRef = useRef<SfxPool>({});

  const playEffect = useCallback(
    (name: SoundEffectName) => {
      if (!enabled || typeof window === "undefined" || typeof Audio === "undefined") {
        return;
      }

      const { src, volume } = effectiveSfxConfig[name];
      let audio = poolRef.current[name];

      // (Re)create the pooled element if missing or its source changed.
      if (!audio || audio.getAttribute("src") !== src) {
        audio = new Audio(src);
        audio.preload = "auto";
        poolRef.current[name] = audio;
      }

      audio.volume = volume;
      try {
        audio.currentTime = 0;
      } catch {
        // Ignore unsupported media API in non-browser environments.
      }
      audio.play().catch(() => {
        // Ignore autoplay errors - user interaction required
      });
    },
    [enabled, effectiveSfxConfig]
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

  const controls = useMemo<NoirSoundEffectsControls>(
    () => ({
      playTypewriter: () => playEffect("typewriter"),
      playThunder: () => playEffect("thunder"),
      playPhoneRing: () => playEffect("phone"),
    }),
    [playEffect]
  );

  useEffect(() => {
    const currentOnReady = onReadyRef.current;
    currentOnReady?.(controls);
    return () => currentOnReady?.(null);
  }, [controls, onReadyRef]);

  return null;
}
