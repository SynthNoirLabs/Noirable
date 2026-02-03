"use client";

import { useCallback, useEffect, useRef } from "react";

/** Default music source (noir aesthetic) */
const DEFAULT_MUSIC_SRC = "/assets/noir/noir-jazz-loop.mp3";
/** Default music volume (noir aesthetic) */
const DEFAULT_MUSIC_VOLUME = 0.22;

interface NoirMusicProps {
  enabled: boolean;
  soundEnabled?: boolean;
  /** Volume level (0-1). If not provided, uses musicConfig.volume or default. */
  volume?: number;
  /** Music configuration from audio pack. Overrides defaults. */
  musicConfig?: {
    src: string;
    volume: number;
  };
}

export function NoirMusic({ enabled, soundEnabled = true, volume, musicConfig }: NoirMusicProps) {
  // Resolve music source and volume from config or defaults
  const musicSrc = musicConfig?.src ?? DEFAULT_MUSIC_SRC;
  const effectiveVolume = volume ?? musicConfig?.volume ?? DEFAULT_MUSIC_VOLUME;
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const resumeHandlerRef = useRef<(() => void) | null>(null);
  const fadeFrameRef = useRef<number | null>(null);
  const attemptPlayRef = useRef<() => Promise<void>>(() => Promise.resolve());

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
        void attemptPlayRef.current?.();
      };

      resumeHandlerRef.current = handleResume;
      window.addEventListener("pointerdown", handleResume, { once: true });
      window.addEventListener("keydown", handleResume, { once: true });
    }
  }, [detachResumeListeners, enabled, soundEnabled]);

  // Keep ref in sync with latest attemptPlay
  useEffect(() => {
    attemptPlayRef.current = attemptPlay;
  }, [attemptPlay]);

  // Initialize audio element once
  useEffect(() => {
    if (typeof window === "undefined" || typeof Audio === "undefined") {
      return;
    }

    if (!enabled || !soundEnabled) {
      return;
    }

    if (audioRef.current) {
      return;
    }

    const audio = new Audio(musicSrc);
    audio.loop = true;
    audio.preload = "auto";
    audioRef.current = audio;
  }, [enabled, soundEnabled, musicSrc]);

  // Handle play/pause and volume changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    if (!enabled || !soundEnabled || effectiveVolume <= 0) {
      fadeTo(audio, 0, 400, () => {
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

    void attemptPlay();
    fadeTo(audio, Math.min(1, Math.max(0, effectiveVolume)), 900);
  }, [attemptPlay, detachResumeListeners, enabled, fadeTo, soundEnabled, effectiveVolume]);

  // Handle visibility changes (pause when tab hidden)
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
      if (enabled && soundEnabled && effectiveVolume > 0) {
        void attemptPlay();
        fadeTo(audio, Math.min(1, Math.max(0, effectiveVolume)), 600);
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [attemptPlay, enabled, fadeTo, soundEnabled, effectiveVolume]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelFade();
      detachResumeListeners();
      const audio = audioRef.current;
      if (audio) {
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

  return null;
}
