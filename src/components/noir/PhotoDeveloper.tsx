"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface PhotoDeveloperProps {
  src: string;
  alt: string;
  className?: string;
  fit?: string;
  variant?: string;
  caption?: string;
}

export function PhotoDeveloper({
  src,
  alt,
  className,
  fit,
  variant,
  caption,
}: PhotoDeveloperProps) {
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

  // Trigger timeout callback asynchronously to disable developing overlay
  useEffect(() => {
    if (isDeveloping) {
      const timer = setTimeout(() => {
        setIsDeveloping(false);
      }, 4500); // matches the CSS animation duration of 4.5s
      return () => clearTimeout(timer);
    }
  }, [src, isDeveloping]);

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
      className={cn(
        "inline-block bg-[#0f0f11] my-4 mx-2 p-3 pb-8 border border-[var(--aesthetic-border)]/50 rounded-sm shadow-[0_10px_35px_rgba(0,0,0,0.55)] relative overflow-hidden group select-none transition-transform duration-300 hover:scale-[1.02] hover:z-20",
        className
      )}
      style={{
        transform: `rotate(${rotationDegrees})`,
      }}
    >
      {/* Tape/Pin decoration on top of the print */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-3.5 bg-yellow-100/15 border-b border-x border-dashed border-black/20 opacity-40 shadow-[0_1px_2px_rgba(0,0,0,0.3)] origin-top scale-95" />

      {/* Image container with darkroom bath container styles */}
      <div className="relative overflow-hidden bg-black border border-black shadow-[inset_0_2px_8px_rgba(0,0,0,0.9)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          className={cn(
            "block w-full max-w-full object-cover",
            isDeveloping ? "animate-photo-develop" : "sepia-[0.15]"
          )}
        />

        {/* The Chemical Bath Overlay (Safelight glow) */}
        {isDeveloping && (
          <div
            className="absolute inset-0 pointer-events-none mix-blend-color-dodge animate-safelight"
            aria-hidden="true"
          />
        )}
      </div>

      {/* Captions / Typewritten Exhibit Tag */}
      <figcaption className="mt-3 px-1 font-typewriter text-[9px] uppercase tracking-[0.25em] text-[var(--aesthetic-text)]/50 select-text">
        {caption ?? `Exhibit — ${alt}`}
      </figcaption>
    </figure>
  );
}
