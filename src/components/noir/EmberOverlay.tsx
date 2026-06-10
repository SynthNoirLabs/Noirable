"use client";

import { useEffect, useMemo, useState } from "react";
import type { AmbientIntensity } from "@/lib/store/useA2UIStore";

/**
 * Drifting embers — the gothic-manor signature particle (atmosphere.particle =
 * "ember"). Slow motes rise and fade in the active world's particle color
 * (crimson for gothic) via the inherited --aesthetic-particle-color var, the
 * same theming RainOverlay/FogOverlay use. Reduced-motion safe (renders nothing
 * when the user prefers reduced motion, since the whole point is the drift).
 */

interface Ember {
  id: number;
  left: number;
  size: number;
  duration: number;
  delay: number;
  opacity: number;
  drift: number;
}

interface EmberOverlayProps {
  enabled?: boolean;
  intensity?: AmbientIntensity;
}

const intensityConfig: Record<AmbientIntensity, { count: number; opacityMax: number }> = {
  low: { count: 14, opacityMax: 0.5 },
  medium: { count: 24, opacityMax: 0.65 },
  high: { count: 38, opacityMax: 0.8 },
};

function pseudoRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export function EmberOverlay({ enabled = true, intensity = "medium" }: EmberOverlayProps) {
  const [reducedMotion, setReducedMotion] = useState(false);
  const config = intensityConfig[intensity] ?? intensityConfig.medium;

  const embers = useMemo<Ember[]>(
    () =>
      Array.from({ length: config.count }).map((_, i) => ({
        id: i,
        left: pseudoRandom(i + 1) * 100,
        size: 2 + pseudoRandom(i + 7) * 3,
        duration: 6 + pseudoRandom(i + 11) * 6,
        delay: pseudoRandom(i + 23) * 8,
        opacity: 0.2 + pseudoRandom(i + 37) * (config.opacityMax - 0.2),
        drift: (pseudoRandom(i + 53) - 0.5) * 40,
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
    media.addListener?.(handleChange);
    return () => {
      media.removeEventListener?.("change", handleChange);
      media.removeListener?.(handleChange);
    };
  }, []);

  if (!enabled || reducedMotion) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 pointer-events-none z-[4] overflow-hidden mix-blend-screen"
      aria-hidden="true"
      data-testid="ember-overlay"
    >
      {embers.map((ember) => (
        <div
          key={ember.id}
          className="absolute bottom-0 rounded-full"
          style={
            {
              left: `${ember.left}%`,
              width: `${ember.size}px`,
              height: `${ember.size}px`,
              opacity: ember.opacity,
              // Theme-driven glow in the world's particle color.
              backgroundColor:
                "color-mix(in srgb, var(--aesthetic-particle-color) 90%, transparent)",
              boxShadow:
                "0 0 6px color-mix(in srgb, var(--aesthetic-particle-color) 70%, transparent)",
              "--ember-drift": `${ember.drift}px`,
              animation: `ember-rise ${ember.duration}s ease-in infinite`,
              animationDelay: `-${ember.delay}s`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
