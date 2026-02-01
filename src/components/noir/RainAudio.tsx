"use client";

import { useCallback, useEffect, useRef } from "react";
import type { AmbientIntensity } from "@/lib/store/useA2UIStore";

interface RainAudioProps {
  enabled: boolean;
  intensity?: AmbientIntensity;
  soundEnabled?: boolean;
  /**
   * 0..1 volume scale for rain. This is applied on top of the intensity mapping.
   * Default: 1
   */
  volumeScale?: number;
}

const AUDIO_SRC = "/assets/noir/rain-loop.wav";

const intensityVolume: Record<AmbientIntensity, number> = {
  low: 0.18,
  medium: 0.26,
  high: 0.34,
};

export function RainAudio({
  enabled,
  intensity = "medium",
  soundEnabled = true,
  volumeScale = 1,
}: RainAudioProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playAudioRef = useRef<(() => void) | null>(null);
  const resumeHandlerRef = useRef<(() => void) | null>(null);
  const fadeFrameRef = useRef<number | null>(null);

  const clampedVolumeScale = Math.min(1, Math.max(0, volumeScale));
  const baseVolume = intensityVolume[intensity] ?? intensityVolume.medium;
  const targetVolume = baseVolume * clampedVolumeScale;

  const cancelFade = useCallback(() => {
    if (fadeFrameRef.current == null || typeof window === "undefined") {
      return;
    }

    window.cancelAnimationFrame(fadeFrameRef.current);
    fadeFrameRef.current = null;
  }, []);

  const fadeTo = useCallback(
    (audio: HTMLAudioElement, nextVolume: number, durationMs: number, onDone?: () => void) => {
      if (typeof window === "undefined") {
        audio.volume = nextVolume;
        onDone?.();
        return;
      }

      cancelFade();

      const from = audio.volume;
      const to = Math.min(1, Math.max(0, nextVolume));
      const start = window.performance.now();
      const duration = Math.max(0, durationMs);

      const tick = (now: number) => {
        const t = duration === 0 ? 1 : Math.min(1, (now - start) / duration);
        // Clamp to [0, 1] to avoid floating point precision errors
        audio.volume = Math.max(0, Math.min(1, from + (to - from) * t));
        if (t < 1) {
          fadeFrameRef.current = window.requestAnimationFrame(tick);
        } else {
          fadeFrameRef.current = null;
          onDone?.();
        }
      };

      fadeFrameRef.current = window.requestAnimationFrame(tick);
    },
    [cancelFade]
  );

  const detachResumeListeners = useCallback(() => {
    const handler = resumeHandlerRef.current;
    if (!handler || typeof window === "undefined") {
      return;
    }

    window.removeEventListener("pointerdown", handler);
    window.removeEventListener("keydown", handler);
    resumeHandlerRef.current = null;
  }, []);

  const attemptPlay = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio || !enabled || !soundEnabled) {
      return;
    }

    // Don't jump volume instantly; fade handles it. Keep a minimal non-zero to avoid "pop".
    audio.volume = Math.min(audio.volume, 0.02);

    try {
      await audio.play();
      detachResumeListeners();
    } catch {
      if (typeof window === "undefined" || resumeHandlerRef.current) {
        return;
      }

      const handleResume = () => {
        detachResumeListeners();
        playAudioRef.current?.();
      };

      resumeHandlerRef.current = handleResume;
      window.addEventListener("pointerdown", handleResume, { once: true });
      window.addEventListener("keydown", handleResume, { once: true });
    }
  }, [detachResumeListeners, enabled, soundEnabled]);

  useEffect(() => {
    if (typeof window === "undefined" || typeof Audio === "undefined") {
      return;
    }

    let handleLoaded: (() => void) | null = null;
    if (!audioRef.current) {
      const audio = new Audio(AUDIO_SRC);
      audio.loop = true;
      audio.preload = "auto";
      handleLoaded = () => {
        if (audio.duration) {
          try {
            audio.currentTime = Math.random() * audio.duration;
          } catch {
            // Some environments (e.g. JSDOM) don't fully implement media time ranges.
          }
        }
      };
      audio.addEventListener("loadedmetadata", handleLoaded);
      audioRef.current = audio;
    }

    return () => {
      cancelFade();
      detachResumeListeners();
      const audio = audioRef.current;
      if (audio) {
        if (handleLoaded) {
          audio.removeEventListener("loadedmetadata", handleLoaded);
        }
        audio.pause();
        try {
          audio.currentTime = 0;
        } catch {
          // Ignore unsupported media API in non-browser environments.
        }
      }
      audioRef.current = null;
    };
  }, [cancelFade, detachResumeListeners]);

  useEffect(() => {
    playAudioRef.current = attemptPlay;
  }, [attemptPlay]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    if (!enabled || !soundEnabled || targetVolume <= 0) {
      fadeTo(audio, 0, 250, () => {
        audio.pause();
        try {
          audio.currentTime = 0;
        } catch {
          // Ignore unsupported media API in non-browser environments.
        }
      });
      detachResumeListeners();
      return;
    }

    // When enabling, restart from a random point to make loops less obvious.
    if (audio.paused && audio.duration) {
      try {
        audio.currentTime = Math.random() * audio.duration;
      } catch {
        // Ignore unsupported media API in non-browser environments.
      }
    }

    void attemptPlay();
    fadeTo(audio, targetVolume, 650);
  }, [attemptPlay, detachResumeListeners, enabled, fadeTo, soundEnabled, targetVolume]);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const handleVisibility = () => {
      const audio = audioRef.current;
      if (!audio) return;
      if (document.hidden) {
        audio.pause();
        return;
      }
      if (enabled && soundEnabled && targetVolume > 0) {
        void attemptPlay();
        fadeTo(audio, targetVolume, 450);
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [attemptPlay, enabled, fadeTo, soundEnabled, targetVolume]);

  return null;
}
