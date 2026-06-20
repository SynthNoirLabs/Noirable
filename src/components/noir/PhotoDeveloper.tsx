"use client";

import React, { useState, useEffect } from "react";
import { Clapperboard, Film, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useResolvedAesthetic } from "@/lib/aesthetic/useResolvedAesthetic";
import { getAestheticCopy, getMotionPersonality } from "@/lib/aesthetic/identity";
import { useVideoConfigured, useVideoGeneration } from "@/lib/hooks/useVideoGeneration";
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
 * darkroom look (same keyframes, same frame, same 4500ms, same ±2.5° desk
 * tilt) so the snapshot + PhotoDeveloper.test.tsx pass unchanged.
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
  /**
   * Messy-desk tilt range in degrees (deterministic, hashed from src). The
   * tilt is a PAPER affordance: evidence prints (darkroom) lean, framed
   * paintings (candle) hang almost straight, and screens/clean frames
   * (crisp/scanline/raster) sit at exactly 0 — a CRT bolted into a ship
   * console is never askew.
   */
  tiltRangeDeg: number;
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
    tiltRangeDeg: 2.5,
  },
  // Minimal — instant clean fade, no frame chrome, hairline border, NO tilt.
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
    tiltRangeDeg: 0,
  },
  // Cyber — scanline wipe + RGB split inside a HUD pane. Screens don't tilt.
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
    tiltRangeDeg: 0,
  },
  // Nostromo — top-to-bottom phosphor raster print inside a heavy bezel. A CRT
  // bolted into a ship console is never askew.
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
    tiltRangeDeg: 0,
  },
  // Gothic — warm fade up from near-black inside a gilt frame. A hung painting
  // leans only a hair.
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
    tiltRangeDeg: 1,
  },
  // Grand Hotel — a 1920s press-camera flashbulb: a hard white burst that
  // settles into a warm print inside a brass deco frame. Press prints on the
  // concierge's desk lean a touch.
  flashbulb: {
    frameClass:
      "inline-block my-4 mx-2 p-2 relative overflow-hidden group select-none rounded-[var(--aesthetic-radius,6px)] border-2 border-[var(--aesthetic-accent)]/60 bg-[var(--aesthetic-surface)] shadow-[0_10px_35px_rgba(0,0,0,0.6)]",
    tape: (
      <div className="absolute top-1 right-2 z-10 font-mono text-[7px] uppercase tracking-[0.3em] text-[var(--aesthetic-accent)]/70">
        ● PRESS
      </div>
    ),
    imageContainerClass:
      "relative overflow-hidden border border-black/60 bg-black shadow-[inset_0_2px_8px_rgba(0,0,0,0.8)]",
    developingClass: "animate-photo-flashbulb",
    settledClass: "",
    overlayClass: "absolute inset-0 pointer-events-none mix-blend-screen animate-flashbulb-burst",
    developMs: 1100,
    captionClass: NOIR_CAPTION_CLASS,
    tiltRangeDeg: 1.2,
  },
};

/** Deterministic hash → symmetric -range..+range degrees (0.1° steps). */
function deterministicTiltDeg(seed: string, rangeDeg: number): number {
  if (rangeDeg <= 0) return 0;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  // `hash` is a signed int32 and is often negative; JS `%` keeps the sign, so
  // use the unsigned value to keep the rotation in a symmetric spread.
  const steps = Math.round(rangeDeg * 20);
  return ((hash >>> 0) % (steps + 1)) / 10 - rangeDeg;
}

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
  const exhibitLabel = getAestheticCopy(baseId).exhibitLabel;

  const [prevSrc, setPrevSrc] = useState<string | null>(null);
  const [isDeveloping, setIsDeveloping] = useState(true);
  // The source image's intrinsic aspect (width/height), captured on load, so a
  // "living portrait" animates in the SAME orientation as the still — a tall
  // mugshot/portrait becomes a 9:16 clip, not a letterboxed 16:9 one. Null until
  // the image reports its natural dimensions.
  const [imageAspect, setImageAspect] = useState<number | null>(null);
  // Per-image re-develop: a successful re-roll swaps in a cache-busted url for
  // the SAME stored image id; the reveal animation re-runs via the src change.
  const [overrideSrc, setOverrideSrc] = useState<string | null>(null);
  const [isRedeveloping, setIsRedeveloping] = useState(false);
  // "Direct" mode — a conversational EDIT of the existing image ("profile
  // view", "add an evidence marker") that preserves the scene, vs. the
  // re-develop re-roll which deals a fresh take.
  const [directOpen, setDirectOpen] = useState(false);
  const [directText, setDirectText] = useState("");
  const [isDirecting, setIsDirecting] = useState(false);
  // LIVING PORTRAIT — animate the still into a short, subtle Veo loop (the
  // gothic painting whose candlelight flickers). Explicit user action only.
  const {
    status: animateStatus,
    videoUrl: livingPortraitUrl,
    generate: generatePortraitLoop,
  } = useVideoGeneration();
  const videoConfigured = useVideoConfigured();

  const effectiveSrc = overrideSrc ?? src;

  // The messy-desk tilt is a per-reveal affordance now (darkroom leans, a CRT
  // bezel never does) — deterministic from the src so it's stable across
  // renders/SSR. Keyed on the ORIGINAL src so a re-develop doesn't re-deal the
  // print onto the desk at a new angle.
  const rotationDegrees = React.useMemo(
    () => `${deterministicTiltDeg(src, config.tiltRangeDeg)}deg`,
    [src, config.tiltRangeDeg]
  );

  // Derived state to trigger redevelopment synchronously during render when src changes
  if (effectiveSrc !== prevSrc) {
    setPrevSrc(effectiveSrc);
    setIsDeveloping(true);
    // A NEW upstream src (fresh generation) supersedes any local re-roll.
    if (overrideSrc && effectiveSrc === src) {
      setOverrideSrc(null);
    }
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
  }, [effectiveSrc, isDeveloping, config.developMs]);

  // Only same-origin generated images carry a re-develop recipe.
  const canRedevelop = src.startsWith("/api/images/");

  const handleDirect = async () => {
    const instruction = directText.trim();
    if (!instruction || isDirecting) return;
    setIsDirecting(true);
    try {
      const fileName = src.replace("/api/images/", "").split("?")[0];
      const res = await fetch(`/api/images/${fileName}/direct`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instruction }),
      });
      if (res.ok) {
        const data = (await res.json()) as { url?: string };
        if (data.url) {
          setOverrideSrc(data.url);
          setDirectOpen(false);
          setDirectText("");
        }
      }
    } catch {
      // Best-effort: a failed edit leaves the current print untouched.
    } finally {
      setIsDirecting(false);
    }
  };

  const handleAnimate = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (animateStatus === "starting" || animateStatus === "pending") return;
    // Veo only accepts 16:9 or 9:16. Match the still's orientation so a tall
    // portrait doesn't get force-cropped into a landscape clip; default to 16:9
    // until the image's dimensions are known (or when it's square/landscape).
    const aspectRatio = typeof imageAspect === "number" && imageAspect < 1 ? "9:16" : "16:9";
    void generatePortraitLoop(
      "a living portrait: the exact subject and scene from the reference image with very subtle motion — gentle breathing, flickering light, drifting smoke or dust motes; static camera; calm, seamless ambient loop",
      { aestheticId: baseId, aspectRatio, referenceImageUrls: [src.split("?")[0]] }
    );
  };

  const handleRedevelop = async (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (isRedeveloping) return;
    setIsRedeveloping(true);
    try {
      const fileName = src.replace("/api/images/", "").split("?")[0];
      const res = await fetch(`/api/images/${fileName}/redevelop`, { method: "POST" });
      if (res.ok) {
        const data = (await res.json()) as { url?: string };
        if (data.url) {
          setOverrideSrc(data.url);
        }
      }
    } catch {
      // Best-effort: a failed re-roll leaves the current print untouched.
    } finally {
      setIsRedeveloping(false);
    }
  };

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
        src={effectiveSrc}
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
        {livingPortraitUrl ? (
          // The still has come to life — a subtle, silent, seamless loop.
          <video
            src={livingPortraitUrl}
            autoPlay
            loop
            muted
            playsInline
            aria-label={alt}
            className={cn("block w-full max-w-full object-cover", config.settledClass)}
          />
        ) : (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={effectiveSrc}
            alt={alt}
            onLoad={(e) => {
              const img = e.currentTarget;
              if (img.naturalWidth > 0 && img.naturalHeight > 0) {
                setImageAspect(img.naturalWidth / img.naturalHeight);
              }
            }}
            className={cn(
              "block w-full max-w-full object-cover",
              isDeveloping ? config.developingClass : config.settledClass
            )}
          />
        )}

        {/* Develop overlay (safelight glow / scanline wipe / raster sweep / candle glow) */}
        {isDeveloping && config.overlayClass && (
          <div className={config.overlayClass} aria-hidden="true" />
        )}

        {/* Per-image re-roll + direct-edit — hover affordances for generated images. */}
        {canRedevelop && !isDeveloping && (
          <div className="absolute bottom-1.5 right-1.5 z-10 flex items-center gap-1">
            {videoConfigured !== false && !livingPortraitUrl && (
              <button
                type="button"
                onClick={handleAnimate}
                disabled={animateStatus === "starting" || animateStatus === "pending"}
                title="Animate this image into a living portrait"
                aria-label="Animate this image"
                className={cn(
                  "flex items-center gap-1 rounded-[var(--aesthetic-radius,2px)] border border-[var(--aesthetic-accent)]/50 bg-[var(--aesthetic-background)]/80 px-1.5 py-1 font-mono text-[9px] uppercase tracking-wider text-[var(--aesthetic-accent)] opacity-0 transition-opacity duration-200 group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--aesthetic-accent)]",
                  (animateStatus === "starting" || animateStatus === "pending") &&
                    "cursor-wait opacity-100"
                )}
              >
                <Film
                  className={cn(
                    "h-3 w-3",
                    (animateStatus === "starting" || animateStatus === "pending") && "animate-pulse"
                  )}
                  aria-hidden
                />
                {animateStatus === "starting" || animateStatus === "pending"
                  ? "Animating"
                  : animateStatus === "failed"
                    ? "Retry animate"
                    : "Animate"}
              </button>
            )}
            <button
              type="button"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setDirectOpen((open) => !open);
              }}
              disabled={isDirecting}
              title="Direct this image (edit in place)"
              aria-label="Direct this image"
              className={cn(
                "flex items-center gap-1 rounded-[var(--aesthetic-radius,2px)] border border-[var(--aesthetic-accent)]/50 bg-[var(--aesthetic-background)]/80 px-1.5 py-1 font-mono text-[9px] uppercase tracking-wider text-[var(--aesthetic-accent)] opacity-0 transition-opacity duration-200 group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--aesthetic-accent)]",
                (isDirecting || directOpen) && "opacity-100",
                isDirecting && "cursor-wait"
              )}
            >
              <Clapperboard className={cn("h-3 w-3", isDirecting && "animate-pulse")} aria-hidden />
              {isDirecting ? "Directing" : "Direct"}
            </button>
            <button
              type="button"
              onClick={handleRedevelop}
              disabled={isRedeveloping}
              title="Re-develop this image (new take)"
              aria-label="Re-develop this image"
              className={cn(
                "flex items-center gap-1 rounded-[var(--aesthetic-radius,2px)] border border-[var(--aesthetic-accent)]/50 bg-[var(--aesthetic-background)]/80 px-1.5 py-1 font-mono text-[9px] uppercase tracking-wider text-[var(--aesthetic-accent)] opacity-0 transition-opacity duration-200 group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--aesthetic-accent)]",
                isRedeveloping && "cursor-wait opacity-100"
              )}
            >
              <RefreshCw className={cn("h-3 w-3", isRedeveloping && "animate-spin")} aria-hidden />
              {isRedeveloping ? "Developing" : "Re-develop"}
            </button>
          </div>
        )}

        {/* The director's note — an inline instruction for the in-place edit. */}
        {directOpen && !isDeveloping && (
          <div className="absolute inset-x-1.5 bottom-8 z-10 flex items-center gap-1">
            <input
              autoFocus
              type="text"
              value={directText}
              onChange={(e) => setDirectText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void handleDirect();
                }
                if (e.key === "Escape") setDirectOpen(false);
              }}
              placeholder="Direct the shot — e.g. profile view, add an evidence marker"
              aria-label="Edit instruction for this image"
              className="w-full rounded-[var(--aesthetic-radius,2px)] border border-[var(--aesthetic-accent)]/50 bg-[var(--aesthetic-background)]/90 px-2 py-1 font-mono text-[10px] text-[var(--aesthetic-text)] placeholder:text-[var(--aesthetic-text)]/35 focus:outline-none focus-visible:ring-1 focus-visible:ring-[var(--aesthetic-accent)]"
            />
            <button
              type="button"
              onClick={() => void handleDirect()}
              disabled={isDirecting || directText.trim().length === 0}
              aria-label="Apply the edit"
              className="shrink-0 rounded-[var(--aesthetic-radius,2px)] border border-[var(--aesthetic-accent)]/50 bg-[var(--aesthetic-accent)]/15 px-2 py-1 font-mono text-[10px] uppercase text-[var(--aesthetic-accent)] disabled:opacity-40"
            >
              Go
            </button>
          </div>
        )}
      </div>

      {/* Captions / Typewritten Exhibit Tag (gilt museum plate for gothic) */}
      <figcaption className={config.captionClass}>
        {config.plateLabel && <span className="gilt-plate-label">{config.plateLabel}</span>}
        {caption ?? (config.plateLabel ? alt : `${exhibitLabel} — ${alt}`)}
      </figcaption>
    </figure>
  );
}
