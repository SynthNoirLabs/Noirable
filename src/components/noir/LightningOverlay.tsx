"use client";

import { useEffect, useState } from "react";

export function LightningOverlay() {
  const [animationKey, setAnimationKey] = useState(0);

  useEffect(() => {
    const triggerLightning = () => {
      setAnimationKey((prev) => prev + 1);
    };

    window.addEventListener("noir-lightning", triggerLightning);
    return () => window.removeEventListener("noir-lightning", triggerLightning);
  }, []);

  if (animationKey === 0) return null;

  return (
    <div
      key={animationKey}
      className="fixed inset-0 bg-white pointer-events-none z-[9999] opacity-0 mix-blend-screen animate-lightning"
      aria-hidden="true"
    />
  );
}
