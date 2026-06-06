"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useResolvedAesthetic } from "@/lib/aesthetic/useResolvedAesthetic";
import { getMotionPersonality } from "@/lib/aesthetic/identity";
import type { MotionPersonality } from "@/lib/aesthetic/types";

interface PhotoDeveloperProps {
  src: string;
  alt: string;
  className?: string;
  fit?: string;
  variant?: string;
  caption?: string;
}

type ImageReveal = MotionPersonality["imageReveal"];

/**
 * Per-reveal presentation: the figure (frame chrome), the top decoration, the
 * image animation while developing + its settled class, an optional overlay
 * element rendered during development, and the develop duration (which MUST
 * match the CSS animation duration). Noir is byte-identical to its historical
 * darkroom look (same keyframes, same frame, same 4500ms) so the snapshot +
 * PhotoDeveloper.test.tsx pass unchanged.
 */
interface RevealConfig {
  frameClass: string;
  tape: React.ReactNode;
  imageContainerClass: string;
  developingClass: string;
  settledClass: string;
  overlayClass: string | null;
  developMs: number;
  /**
   * Figcaption className. Noir keeps its exact historical typewritten exhibit
   * tag (byte-identical snapshot); gothic's candle frame swaps in a centered
   * gilt "Plate" caption styling. Other reveals reuse the noir caption.
   */
  captionClass: string;
  /**
   * Optional gilt plate label prefixed to the caption (gothic candle only),
   * e.g. "Plate I —". Undefined leaves the caption as the bare exhibit tag.
   */
  plateLabel?: string;
}

const NOIR_CAPTION_CLASS =
  "mt-3 px-1 font-typewriter text-[9px] uppercase tracking-[0.25em] text-[var(--aesthetic-text)]/50 select-text";

const REVEAL_CONFIG: Record<ImageReveal, RevealConfig> = {
  // Noir — the original darkroom develop. Kept byte-identical.
  darkroom: {
    frameClass:
      "inline-block bg-[#0f0f11] my-4 mx-2 p-3 pb-8 border border-[var(--aesthetic-border)]/50 rounded-sm shadow-[0_10px_35px_rgba(0,0,0,0.55)] relative overflow-hidden group select-none transition-transform duration-300 hover:scale-[1.02] hover:z-20",
    tape: (
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-3.5 bg-yellow-100/15 border-b border-x border-dashed border-black/20 opacity-40 shadow-[0_1px_2px_rgba(0,0,0,0.3)] origin-top scale-95" />
    ),
    imageContainerClass:
      "relative overflow-hidden bg-black border border-black shadow-[inset_0_2px_8px_rgba(0,0,0,0.9)]",
    developingClass: "animate-photo-develop",
    settledClass: "sepia-[0.15]",
    overlayClass: "absolute inset-0 pointer-events-none mix-blend-color-dodge animate-safelight",
    developMs: 4500,
    captionClass: NOIR_CAPTION_CLASS,
  },
  // Minimal — instant clean fade, no frame chrome, hairline border.
  crisp: {
    frameClass:
      "inline-block my-4 mx-2 relative overflow-hidden group select-none rounded-[var(--aesthetic-radius,8px)] border border-[var(--aesthetic-border)]/40",
    tape: null,
    imageContainerClass: "relative overflow-hidden",
    developingClass: "animate-photo-crisp",
    settledClass: "",
    overlayClass: null,
    developMs: 320,
    captionClass: NOIR_CAPTION_CLASS,
  },
  // Cyber — scanline wipe + RGB split inside a HUD pane.
  scanline: {
    frameClass:
      "inline-block my-4 mx-2 p-2 relative overflow-hidden group select-none rounded-[var(--aesthetic-radius,4px)] border border-[var(--aesthetic-accent)]/60 bg-[var(--aesthetic-surface)]/80 shadow-[0_0_18px_color-mix(in_srgb,var(--aesthetic-accent)_calc(20%*var(--aesthetic-bloom,1)),transparent)]",
    tape: (
      <div className="absolute top-1 right-2 z-10 font-mono text-[7px] uppercase tracking-[0.3em] text-[var(--aesthetic-accent)]/70">
        ● REC
      </div>
    ),
    imageContainerClass:
      "relative overflow-hidden border border-[var(--aesthetic-accent)]/30 bg-black",
    developingClass: "animate-photo-scanline",
    settledClass: "",
    overlayClass: "absolute inset-0 pointer-events-none mix-blend-screen animate-scanline-wipe",
    developMs: 900,
    captionClass: NOIR_CAPTION_CLASS,
  },
  // Nostromo — top-to-bottom phosphor raster print inside a heavy bezel.
  raster: {
    frameClass:
      "inline-block my-4 mx-2 p-3 relative overflow-hidden group select-none rounded-none border-2 border-[var(--aesthetic-border)] bg-[var(--aesthetic-surface)] shadow-[inset_0_0_18px_rgba(51,255,102,0.08)]",
    tape: (
      <div className="absolute top-1 left-2 z-10 font-mono text-[7px] uppercase tracking-[0.3em] text-[var(--aesthetic-accent)]/70">
        IMG://RASTER
      </div>
    ),
    imageContainerClass:
      "relative overflow-hidden border border-[var(--aesthetic-border)] bg-black crt-scanlines",
    developingClass: "animate-photo-raster",
    settledClass: "",
    overlayClass: "absolute inset-0 pointer-events-none mix-blend-screen animate-raster-sweep",
    developMs: 1400,
    captionClass: NOIR_CAPTION_CLASS,
  },
  // Gothic — warm fade up from near-black inside a gilt frame.
  candle: {
    frameClass:
      "inline-block my-4 mx-2 p-2 relative overflow-hidden group select-none rounded-[var(--aesthetic-radius,3px)] border-[3px] border-double border-[var(--aesthetic-accent-muted)] bg-[var(--aesthetic-surface)] shadow-[0_12px_40px_rgba(0,0,0,0.7)]",
    tape: null,
    imageContainerClass:
      "relative overflow-hidden border border-black bg-black shadow-[inset_0_2px_10px_rgba(0,0,0,0.8)]",
    developingClass: "animate-photo-candle",
    settledClass: "",
    overlayClass: "absolute inset-0 pointer-events-none mix-blend-screen animate-candle-glow",
    developMs: 1800,
    // Gilt museum-plate caption: centered serif small-caps in the accent-muted
    // gold, framed by hairline gilt rules (see `.gilt-plate` in globals.css).
    captionClass: "gilt-plate mt-3 px-1 select-text",
    plateLabel: "Plate I",
  },
};

export function PhotoDeveloper({
  src,
  alt,
  className,
  fit,
  variant,
  caption,
}: PhotoDeveloperProps) {
  const { baseId } = useResolvedAesthetic();
  const reveal = getMotionPersonality(baseId).imageReveal;
  const config = REVEAL_CONFIG[reveal] ?? REVEAL_CONFIG.darkroom;

  const [prevSrc, setPrevSrc] = useState<string | null>(null);
  const [isDeveloping, setIsDeveloping] = useState(true);

  // Generate a slight random rotation between -2.5 and +2.5 degrees for a realistic messy desk look.
  // Base it on a simple hash of the src string so it's deterministic and stable.
  const rotationDegrees = React.useMemo(() => {
    let hash = 0;
    for (let i = 0; i < src.length; i++) {
      hash = src.charCodeAt(i) + ((hash << 5) - hash);
    }
    // `hash` is a signed int32 and is often negative; JS `%` keeps the sign, so
    // use the unsigned value to keep the rotation in a symmetric -2.5..+2.5 range.
    const val = ((hash >>> 0) % 50) / 10 - 2.5; // -2.5 to 2.5 degrees
    return `${val}deg`;
  }, [src]);

  // Derived state to trigger redevelopment synchronously during render when src changes
  if (src !== prevSrc) {
    setPrevSrc(src);
    setIsDeveloping(true);
  }

  // Trigger timeout callback asynchronously to disable developing overlay. The
  // delay matches the active reveal's CSS animation duration.
  useEffect(() => {
    if (isDeveloping) {
      const timer = setTimeout(() => {
        setIsDeveloping(false);
      }, config.developMs);
      return () => clearTimeout(timer);
    }
  }, [src, isDeveloping, config.developMs]);

  const sizeClasses = {
    icon: "w-6 h-6",
    avatar: "w-12 h-12 rounded-full",
    smallFeature: "w-24 h-24",
    mediumFeature: "w-48 h-48",
    largeFeature: "w-96 h-64",
    header: "w-full h-48",
  };

  const isInline = variant === "icon" || variant === "avatar";

  if (isInline) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt}
        className={cn(
          "object-cover",
          fit === "contain" && "object-contain",
          fit === "fill" && "object-fill",
          fit === "none" && "object-none",
          fit === "scaleDown" && "object-scale-down",
          sizeClasses[variant as keyof typeof sizeClasses]
        )}
      />
    );
  }

  return (
    <figure
      className={cn(config.frameClass, className)}
      style={{
        transform: `rotate(${rotationDegrees})`,
      }}
    >
      {/* Tape/Pin (or per-reveal HUD/bezel marker) decoration on top of the print */}
      {config.tape}

      {/* Image container — bath/HUD/bezel depending on the reveal */}
      <div className={config.imageContainerClass}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          className={cn(
            "block w-full max-w-full object-cover",
            isDeveloping ? config.developingClass : config.settledClass
          )}
        />

        {/* Develop overlay (safelight glow / scanline wipe / raster sweep / candle glow) */}
        {isDeveloping && config.overlayClass && (
          <div className={config.overlayClass} aria-hidden="true" />
        )}
      </div>

      {/* Captions / Typewritten Exhibit Tag (gilt museum plate for gothic) */}
      <figcaption className={config.captionClass}>
        {config.plateLabel && <span className="gilt-plate-label">{config.plateLabel}</span>}
        {caption ?? `Exhibit — ${alt}`}
      </figcaption>
    </figure>
  );
}
