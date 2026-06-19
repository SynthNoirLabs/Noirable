"use client";

/**
 * The LIVING SCORE — Lyria RealTime as the world's soundtrack.
 *
 * Instead of a looped MP3, this streams continuously-generated music over the
 * Lyria RealTime websocket and STEERS it live: the world's musicStylePrompt is
 * the base mood, a dramatic beat leans the mix toward a tension layer for a few
 * bars, and a world switch crossfades the prompt mid-stream without stopping
 * the music. Ducks under TTS via the shared music-duck channel.
 *
 * Self-contained engine (no React): create with `createLiveScore()`, then
 * `start(prompt)`, `setMood(prompt)`, `pulse()` and `stop()`. All failures are
 * silent — the looped-track bed remains the fallback story.
 */

import { subscribeMusicDuck } from "@/lib/audio/audioEvents";

interface LiveScoreSession {
  setWeightedPrompts: (args: {
    weightedPrompts: Array<{ text: string; weight: number }>;
  }) => Promise<void>;
  setMusicGenerationConfig: (args: {
    musicGenerationConfig: { density?: number; brightness?: number; bpm?: number };
  }) => Promise<void>;
  play: () => Promise<void>;
  stop: () => Promise<void>;
  close: () => void;
}

export interface LiveScore {
  /** Connect and start streaming with the world's base mood. */
  start: (prompt: string, volume?: number) => Promise<boolean>;
  /** Crossfade toward a new base mood (world switch). */
  setMood: (prompt: string) => void;
  /** A few bars of tension (dramatic beat), then settle back. */
  pulse: () => void;
  setVolume: (volume: number) => void;
  stop: () => void;
  readonly running: boolean;
}

/** Lyria RealTime output: 16-bit stereo PCM at 48kHz. */
const SAMPLE_RATE = 48000;
const CHANNELS = 2;

export function createLiveScore(): LiveScore {
  let session: LiveScoreSession | null = null;
  let audioContext: AudioContext | null = null;
  let gainNode: GainNode | null = null;
  let nextStartTime = 0;
  let baseVolume = 0.25;
  let duckFactor = 1;
  let unsubscribeDuck: (() => void) | null = null;
  let currentMood = "";
  let pulseTimer: ReturnType<typeof setTimeout> | null = null;
  let running = false;

  const applyGain = () => {
    if (gainNode && audioContext) {
      gainNode.gain.setTargetAtTime(baseVolume * duckFactor, audioContext.currentTime, 0.25);
    }
  };

  const enqueuePcm = (base64: string) => {
    if (!audioContext || !gainNode) return;
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const samples = new Int16Array(bytes.buffer, 0, Math.floor(bytes.length / 2));
    const frames = Math.floor(samples.length / CHANNELS);
    if (frames === 0) return;
    const buffer = audioContext.createBuffer(CHANNELS, frames, SAMPLE_RATE);
    for (let channel = 0; channel < CHANNELS; channel++) {
      const data = buffer.getChannelData(channel);
      for (let frame = 0; frame < frames; frame++) {
        data[frame] = samples[frame * CHANNELS + channel] / 32768;
      }
    }
    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(gainNode);
    // Gapless scheduling: chunks land on a running clock cursor (with a small
    // safety lead when the stream falls behind realtime).
    const now = audioContext.currentTime;
    if (nextStartTime < now + 0.05) {
      nextStartTime = now + 0.15;
    }
    source.start(nextStartTime);
    nextStartTime += buffer.duration;
  };

  const setPrompts = (prompts: Array<{ text: string; weight: number }>) => {
    void session?.setWeightedPrompts({ weightedPrompts: prompts }).catch(() => undefined);
  };

  const start = async (prompt: string, volume = 0.25): Promise<boolean> => {
    stop();
    baseVolume = volume;
    currentMood = prompt;
    try {
      const keyRes = await fetch("/api/live-music/key");
      if (!keyRes.ok) return false;
      const { apiKey } = (await keyRes.json()) as { apiKey?: string };
      if (!apiKey) return false;

      // Dynamic import keeps @google/genai out of every other page's bundle.
      const { GoogleGenAI } = await import("@google/genai");
      const ai = new GoogleGenAI({ apiKey, apiVersion: "v1alpha" });

      audioContext = new AudioContext({ sampleRate: SAMPLE_RATE });
      gainNode = audioContext.createGain();
      gainNode.gain.value = 0; // fade in below
      gainNode.connect(audioContext.destination);
      nextStartTime = 0;

      session = (await ai.live.music.connect({
        model: "models/lyria-realtime-exp",
        callbacks: {
          onmessage: (message: { serverContent?: { audioChunks?: Array<{ data?: string }> } }) => {
            const chunk = message.serverContent?.audioChunks?.[0]?.data;
            if (chunk) enqueuePcm(chunk);
          },
          onerror: () => stop(),
          onclose: () => undefined,
        },
      })) as unknown as LiveScoreSession;

      await session.setWeightedPrompts({ weightedPrompts: [{ text: prompt, weight: 1 }] });
      await session.play();
      running = true;
      unsubscribeDuck = subscribeMusicDuck((factor) => {
        duckFactor = factor;
        applyGain();
      });
      applyGain();
      return true;
    } catch (error) {
      console.warn("[live-score] unavailable:", error);
      stop();
      return false;
    }
  };

  const setMood = (prompt: string) => {
    if (!running || prompt === currentMood) return;
    const previous = currentMood;
    currentMood = prompt;
    // Crossfade: both prompts weighted, then settle on the new one.
    setPrompts([
      { text: previous, weight: 0.4 },
      { text: prompt, weight: 1 },
    ]);
    setTimeout(() => {
      if (running && currentMood === prompt) {
        setPrompts([{ text: prompt, weight: 1 }]);
      }
    }, 8000);
  };

  const pulse = () => {
    if (!running || !session) return;
    if (pulseTimer) clearTimeout(pulseTimer);
    // Lean toward a tension layer + denser mix for a few bars.
    setPrompts([
      { text: currentMood, weight: 1 },
      { text: "sudden dramatic tension, low ominous swell, rising stakes", weight: 0.8 },
    ]);
    void session
      .setMusicGenerationConfig({ musicGenerationConfig: { density: 0.8 } })
      .catch(() => undefined);
    pulseTimer = setTimeout(() => {
      if (!running || !session) return;
      setPrompts([{ text: currentMood, weight: 1 }]);
      void session
        .setMusicGenerationConfig({ musicGenerationConfig: { density: 0.5 } })
        .catch(() => undefined);
    }, 10000);
  };

  const setVolume = (volume: number) => {
    baseVolume = volume;
    applyGain();
  };

  const stop = () => {
    running = false;
    if (pulseTimer) {
      clearTimeout(pulseTimer);
      pulseTimer = null;
    }
    unsubscribeDuck?.();
    unsubscribeDuck = null;
    try {
      void session?.stop().catch(() => undefined);
      session?.close();
    } catch {
      // already gone
    }
    session = null;
    if (audioContext) {
      void audioContext.close().catch(() => undefined);
      audioContext = null;
    }
    gainNode = null;
  };

  return {
    start,
    setMood,
    pulse,
    setVolume,
    stop,
    get running() {
      return running;
    },
  };
}
