"use client";

import { useEffect, useMemo, useState } from "react";
import type { AmbientIntensity } from "@/lib/store/useA2UIStore";

interface FogOverlayProps {
  enabled?: boolean;
  intensity?: AmbientIntensity;
}

export function FogOverlay({ enabled = true, intensity = "medium" }: FogOverlayProps) {
  const [reducedMotion, setReducedMotion] = useState(false);
  const fogClass = useMemo(() => {
    if (reducedMotion) {
      // Keep a subtle haze without motion (and without color shifting the whole UI).
      return "absolute inset-0 bg-gradient-to-r from-transparent via-[rgba(200,200,210,0.16)] to-transparent blur-3xl mix-blend-screen opacity-40";
    }

    if (intensity === "low") {
      return "absolute inset-0 bg-gradient-to-r from-transparent via-[rgba(200,200,210,0.18)] to-transparent blur-3xl mix-blend-screen animate-[fog-drift_40s_ease-in-out_infinite]";
    }

    if (intensity === "high") {
      return "absolute inset-0 bg-gradient-to-r from-transparent via-[rgba(200,200,210,0.30)] to-transparent blur-3xl mix-blend-screen animate-[fog-drift_22s_ease-in-out_infinite]";
    }

    return "absolute inset-0 bg-gradient-to-r from-transparent via-[rgba(200,200,210,0.24)] to-transparent blur-3xl mix-blend-screen animate-[fog-drift_30s_ease-in-out_infinite]";
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
      <div className={fogClass} style={{ width: "220%" }} />
      {/* Static ground fog pooling at the bottom of the frame (no animation,
          so it is inherently reduced-motion safe). */}
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[rgba(180,180,190,0.10)] to-transparent blur-2xl mix-blend-screen" />
    </div>
  );
}
