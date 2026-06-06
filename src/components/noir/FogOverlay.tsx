"use client";

import { useEffect, useMemo, useState } from "react";
import type { AmbientIntensity } from "@/lib/store/useA2UIStore";

interface FogOverlayProps {
  enabled?: boolean;
  intensity?: AmbientIntensity;
}

export function FogOverlay({ enabled = true, intensity = "medium" }: FogOverlayProps) {
  const [reducedMotion, setReducedMotion] = useState(false);

  // The haze tint is theme-driven from the particle color via a color-mix, so
  // fog reads in the active world's palette (faint blue-grey for noir, magenta
  // for cyber, green for nostromo) instead of a hardcoded grey. The drift
  // animation + blur + blend stay on the class; only the color comes from the
  // var. `mixPct` keeps the previous per-intensity opacity feel.
  const { fogClass, mixPct } = useMemo(() => {
    if (reducedMotion) {
      // Keep a subtle haze without motion (and without color shifting the whole UI).
      return {
        fogClass: "absolute inset-0 blur-3xl mix-blend-screen opacity-40",
        mixPct: 16,
      };
    }

    if (intensity === "low") {
      return {
        fogClass:
          "absolute inset-0 blur-3xl mix-blend-screen animate-[fog-drift_40s_ease-in-out_infinite]",
        mixPct: 18,
      };
    }

    if (intensity === "high") {
      return {
        fogClass:
          "absolute inset-0 blur-3xl mix-blend-screen animate-[fog-drift_22s_ease-in-out_infinite]",
        mixPct: 30,
      };
    }

    return {
      fogClass:
        "absolute inset-0 blur-3xl mix-blend-screen animate-[fog-drift_30s_ease-in-out_infinite]",
      mixPct: 24,
    };
  }, [intensity, reducedMotion]);

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
    <div className="fixed inset-0 pointer-events-none z-[5] overflow-hidden" aria-hidden="true">
      <div
        className={fogClass}
        style={{
          width: "220%",
          backgroundImage:
            "linear-gradient(to right, transparent, " +
            `color-mix(in srgb, var(--aesthetic-particle-color) ${mixPct}%, transparent), ` +
            "transparent)",
        }}
      />
      {/* Static ground fog pooling at the bottom of the frame (no animation,
          so it is inherently reduced-motion safe). */}
      <div
        className="absolute inset-x-0 bottom-0 h-1/3 blur-2xl mix-blend-screen"
        style={{
          backgroundImage:
            "linear-gradient(to top, " +
            "color-mix(in srgb, var(--aesthetic-particle-color) 10%, transparent), " +
            "transparent)",
        }}
      />
    </div>
  );
}
