"use client";

import { useEffect, useRef, useState } from "react";
import { createLiveScore, type LiveScore as LiveScoreEngine } from "@/lib/audio/liveScore";
import { getMusicStylePrompt } from "@/lib/aesthetic/identity";
import { subscribeSemanticAudioEvents } from "@/lib/audio/audioEvents";
import type { AestheticId } from "@/lib/aesthetic/types";

interface LiveScoreProps {
  enabled: boolean;
  soundEnabled: boolean;
  volume?: number;
  aestheticId?: AestheticId;
  /**
   * Reports whether the live stream is actually RUNNING, so the caller can
   * keep the looped bed as the fallback when the websocket/key is unavailable.
   */
  onRunningChange?: (running: boolean) => void;
}

/**
 * The living score — mounts the Lyria RealTime engine and wires it to the app:
 * the active world's musicStylePrompt is the base mood, a world switch
 * CROSSFADES the stream toward the new world's prompt without stopping, and
 * `dramatic.beat` semantic events lean the mix into a tension layer for a few
 * bars. Renders nothing; pure audio.
 */
export function LiveScore({
  enabled,
  soundEnabled,
  volume = 0.25,
  aestheticId,
  onRunningChange,
}: LiveScoreProps) {
  const engineRef = useRef<LiveScoreEngine | null>(null);
  const [running, setRunning] = useState(false);
  const onRunningChangeRef = useRef(onRunningChange);
  useEffect(() => {
    onRunningChangeRef.current = onRunningChange;
  }, [onRunningChange]);

  const active = enabled && soundEnabled;
  const mood = getMusicStylePrompt(aestheticId);

  // Lifecycle: start/stop with the toggle.
  useEffect(() => {
    if (!active) return;
    const engine = createLiveScore();
    engineRef.current = engine;
    let alive = true;
    void engine.start(mood, volume).then((ok) => {
      if (!alive) return;
      setRunning(ok);
      onRunningChangeRef.current?.(ok);
    });
    return () => {
      alive = false;
      engine.stop();
      engineRef.current = null;
      setRunning(false);
      onRunningChangeRef.current?.(false);
    };
    // The mood/volume are steered live below — only the toggle restarts the engine.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  // World switches crossfade the stream; volume tracks the slider.
  useEffect(() => {
    engineRef.current?.setMood(mood);
  }, [mood]);
  useEffect(() => {
    engineRef.current?.setVolume(volume);
  }, [volume]);

  // Dramatic beats pulse the score.
  useEffect(() => {
    if (!running) return;
    return subscribeSemanticAudioEvents((event) => {
      if (event === "dramatic.beat") {
        engineRef.current?.pulse();
      }
    });
  }, [running]);

  return null;
}
