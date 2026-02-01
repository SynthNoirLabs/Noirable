"use client";

import { useEffect, useState } from "react";
import type { AmbientIntensity } from "@/lib/store/useA2UIStore";

interface CrackleOverlayProps {
  intensity?: AmbientIntensity;
}

const intensityConfig: Record<AmbientIntensity, { opacity: number; cadence: number }> = {
  low: { opacity: 0.02, cadence: 0.28 },
  medium: { opacity: 0.04, cadence: 0.2 },
  high: { opacity: 0.06, cadence: 0.14 },
};

export function CrackleOverlay({ intensity = "medium" }: CrackleOverlayProps) {
  const [reducedMotion, setReducedMotion] = useState(false);

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

  if (reducedMotion) {
    return null;
  }

  const config = intensityConfig[intensity] ?? intensityConfig.medium;

  return (
    <div
      className="fixed inset-0 pointer-events-none z-[6] mix-blend-overlay"
      aria-hidden="true"
      data-testid="crackle-overlay"
    >
      <div
        className="absolute inset-0"
        style={{
          opacity: config.opacity,
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='grain'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.95' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23grain)'/%3E%3C/svg%3E\")",
          animation: `crackle-flicker ${config.cadence}s steps(2, end) infinite`,
        }}
      />
    </div>
  );
}
