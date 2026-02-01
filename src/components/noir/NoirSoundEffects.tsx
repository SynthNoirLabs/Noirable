"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";

type SoundEffectName = "typewriter" | "thunder" | "phone";

export interface NoirSoundEffectsControls {
  playTypewriter: () => void;
  playThunder: () => void;
  playPhoneRing: () => void;
}

interface NoirSoundEffectsProps {
  enabled: boolean;
  onReady?: (controls: NoirSoundEffectsControls | null) => void;
}

// Static audio files - no API calls needed
const SFX_FILES: Record<SoundEffectName, { src: string; volume: number }> = {
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

export function NoirSoundEffects({ enabled, onReady }: NoirSoundEffectsProps) {
  const onReadyRef = useCallbackRef(onReady);

  const playEffect = useCallback(
    (name: SoundEffectName) => {
      if (!enabled || typeof window === "undefined" || typeof Audio === "undefined") {
        return;
      }

      const { src, volume } = SFX_FILES[name];
      const audio = new Audio(src);
      audio.volume = volume;
      audio.play().catch(() => {
        // Ignore autoplay errors - user interaction required
      });
    },
    [enabled]
  );

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
