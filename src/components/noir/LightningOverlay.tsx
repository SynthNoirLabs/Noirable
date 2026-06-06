"use client";

import { useEffect, useState } from "react";

export function LightningOverlay() {
  const [animationKey, setAnimationKey] = useState(0);

  useEffect(() => {
    const triggerLightning = () => {
      // Gate the flash on the active world's lightning frequency: a value of 0
      // (minimal) means no storm, so we never bump the key. The var lives on the
      // themed [data-aesthetic] root (set by DeskLayout), so we read it there;
      // it's read at trigger time (an event handler, not a render-time effect),
      // so this stays data-driven without a hardcoded preset check. Default to 1
      // (flash) when no themed root / var is found (non-themed test/SSR).
      if (typeof document !== "undefined") {
        const themedRoot = document.querySelector("[data-aesthetic]") ?? document.documentElement;
        const raw = getComputedStyle(themedRoot)
          .getPropertyValue("--aesthetic-lightning-frequency")
          .trim();
        const frequency = raw === "" ? 1 : Number(raw);
        if (Number.isFinite(frequency) && frequency <= 0) {
          return;
        }
      }
      setAnimationKey((prev) => prev + 1);
    };

    window.addEventListener("noir-lightning", triggerLightning);
    return () => window.removeEventListener("noir-lightning", triggerLightning);
  }, []);

  if (animationKey === 0) return null;

  return (
    <div
      key={animationKey}
      className="fixed inset-0 pointer-events-none z-[9999] opacity-0 mix-blend-screen animate-lightning"
      aria-hidden="true"
      style={{
        // Theme-driven flash color (noir white, cyber cyan, gothic crimson),
        // mixed toward white so the mix-blend-screen flash still reads brightly.
        backgroundColor: "color-mix(in srgb, var(--aesthetic-lightning-color) 70%, #ffffff)",
      }}
    />
  );
}
