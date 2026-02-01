"use client";

import { useEffect, useMemo, useState } from "react";
import type { AmbientIntensity } from "@/lib/store/useA2UIStore";

interface RainDrop {
  id: number;
  left: number;
  duration: number;
  delay: number;
  opacity: number;
  height: number;
}

interface RainOverlayProps {
  enabled?: boolean;
  intensity?: AmbientIntensity;
}

const intensityConfig: Record<
  AmbientIntensity,
  {
    count: number;
    opacityMin: number;
    opacityVar: number;
    heightBase: number;
    heightVar: number;
    durationBase: number;
    durationVar: number;
    delayMax: number;
  }
> = {
  low: {
    count: 24,
    opacityMin: 0.12,
    opacityVar: 0.18,
    heightBase: 40,
    heightVar: 30,
    durationBase: 1.0,
    durationVar: 0.6,
    delayMax: 3,
  },
  medium: {
    count: 40,
    opacityMin: 0.18,
    opacityVar: 0.24,
    heightBase: 60,
    heightVar: 40,
    durationBase: 0.8,
    durationVar: 0.5,
    delayMax: 2,
  },
  high: {
    count: 64,
    opacityMin: 0.24,
    opacityVar: 0.28,
    heightBase: 80,
    heightVar: 50,
    durationBase: 0.6,
    durationVar: 0.45,
    delayMax: 1.6,
  },
};

function pseudoRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export function RainOverlay({ enabled = true, intensity = "medium" }: RainOverlayProps) {
  const [reducedMotion, setReducedMotion] = useState(false);
  const config = intensityConfig[intensity] ?? intensityConfig.medium;

  const drops = useMemo<RainDrop[]>(
    () =>
      Array.from({ length: config.count }).map((_, i) => ({
        id: i,
        left: pseudoRandom(i + 1) * 100, // deterministic horizontal position %
        duration: config.durationBase + pseudoRandom(i + 11) * config.durationVar,
        delay: pseudoRandom(i + 23) * config.delayMax,
        opacity: config.opacityMin + pseudoRandom(i + 37) * config.opacityVar,
        height: config.heightBase + pseudoRandom(i + 53) * config.heightVar,
      })),
    [config]
  );

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }

    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handleChange = () => setReducedMotion(media.matches);
    handleChange();
    media.addEventListener?.("change", handleChange);
    // Legacy Safari fallback
    media.addListener?.(handleChange);
    return () => {
      media.removeEventListener?.("change", handleChange);
      media.removeListener?.(handleChange);
    };
  }, []);

  if (!enabled) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 pointer-events-none z-[4] overflow-hidden mix-blend-screen"
      aria-hidden="true"
    >
      {drops.map((drop) => (
        <div
          key={drop.id}
          className="absolute w-[1px] bg-gradient-to-b from-transparent via-noir-paper/30 to-noir-paper/70"
          style={{
            left: `${drop.left}%`,
            top: `-${drop.height}px`,
            height: `${drop.height}px`,
            opacity: drop.opacity,
            animation: reducedMotion ? undefined : `rain-fall ${drop.duration}s linear infinite`,
            animationDelay: reducedMotion ? undefined : `-${drop.delay}s`,
          }}
        />
      ))}
    </div>
  );
}
