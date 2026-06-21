"use client";

import { cn } from "@/lib/utils";
import { useResolvedAesthetic } from "@/lib/aesthetic/useResolvedAesthetic";

interface EvidenceSkeletonProps {
  className?: string;
}

/**
 * Per-world loading state — the longest single visual moment shouldn't read as
 * one generic gray pulse. The shape and motion are keyed off the world's
 * motion-personality entrance:
 *   • cinematic (noir)    — the status line TYPES itself under a faint safelight.
 *   • terminal (nostromo) — monospace lines print top-to-bottom with a block cursor.
 *   • glitch (cyber)      — skeleton bars carry a sweeping neon shimmer.
 *   • candle (gothic)     — the card breathes with a low warm glow.
 *   • waltz (grand-hotel) — a champagne sheen glides across the bars.
 *   • crisp (minimal)     — the original clean pulse.
 * All variants honor prefers-reduced-motion via the CSS helpers in globals.css.
 */
export function EvidenceSkeleton({ className }: EvidenceSkeletonProps) {
  const { identity } = useResolvedAesthetic();
  const { loadingImageLabel, loadingStatus } = identity.copy;
  const entrance = identity.motion.entrance;

  if (entrance === "terminal") {
    return <TerminalSkeleton className={className} loadingStatus={loadingStatus} />;
  }

  const shimmer = entrance === "glitch" || entrance === "waltz";
  const candle = entrance === "candle";
  const typed = entrance === "cinematic";

  const bar = (extra: string) =>
    cn("h-4 bg-[var(--aesthetic-border)]/20 rounded", shimmer && "skeleton-shimmer", extra);

  return (
    <div
      className={cn("w-full max-w-2xl mx-auto", !shimmer && !candle && "animate-pulse", className)}
    >
      {/* Card skeleton */}
      <div className="relative overflow-hidden bg-[var(--aesthetic-background)]/40 border border-[var(--aesthetic-border)]/30 rounded-sm p-6 space-y-4">
        {/* Gothic: a warm candle glow breathing low on the card. */}
        {candle && (
          <div className="skeleton-candle-glow pointer-events-none absolute inset-0" aria-hidden />
        )}

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className={cn(bar("h-5 w-1/3"))} />
          <div
            className={cn(
              "h-4 bg-[var(--aesthetic-accent)]/20 rounded w-16",
              shimmer && "skeleton-shimmer"
            )}
          />
        </div>

        {/* Divider */}
        <div className="h-px bg-[var(--aesthetic-border)]/20" />

        {/* Content lines */}
        <div className="space-y-3">
          <div className={bar("w-full")} />
          <div className={bar("w-5/6")} />
          <div className={bar("w-4/6")} />
        </div>

        {/* Image placeholder */}
        <div
          className={cn(
            "h-32 bg-[var(--aesthetic-border)]/20 rounded flex items-center justify-center relative overflow-hidden",
            shimmer && "skeleton-shimmer",
            // Noir: the darkroom safelight — a faint red wash over the print tray.
            typed && "bg-red-950/25"
          )}
        >
          <div className="text-[var(--aesthetic-text-muted)]/40 text-xs font-typewriter uppercase tracking-wider">
            {loadingImageLabel}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2">
          <div className={cn(bar("h-3 w-24"))} />
          <div className={cn(bar("h-3 w-16"))} />
        </div>
      </div>

      {/* Status line */}
      {typed ? (
        // Noir: the status types itself, over and over, like a report being filed.
        <div className="mt-4 flex items-center justify-center text-[var(--aesthetic-accent)]/70">
          <span className="skeleton-typewriter font-typewriter text-xs uppercase tracking-wider">
            {loadingStatus}…
          </span>
        </div>
      ) : (
        <div className="mt-4 flex items-center justify-center gap-2 text-[var(--aesthetic-accent)]/60">
          <span
            className="w-2 h-2 rounded-full bg-[var(--aesthetic-accent)]/50 animate-bounce"
            style={{ animationDelay: "0ms" }}
          />
          <span
            className="w-2 h-2 rounded-full bg-[var(--aesthetic-accent)]/50 animate-bounce"
            style={{ animationDelay: "150ms" }}
          />
          <span
            className="w-2 h-2 rounded-full bg-[var(--aesthetic-accent)]/50 animate-bounce"
            style={{ animationDelay: "300ms" }}
          />
          <span className="ml-2 text-xs font-typewriter uppercase tracking-wider">
            {loadingStatus}
          </span>
        </div>
      )}
    </div>
  );
}

/** Widths of the fake printed lines, in % — varied so it reads as real output. */
const TERMINAL_LINES = [72, 58, 84, 45, 66];

function TerminalSkeleton({
  className,
  loadingStatus,
}: {
  className?: string;
  loadingStatus: string;
}) {
  return (
    <div
      data-testid="terminal-skeleton"
      className={cn(
        "w-full max-w-2xl mx-auto border border-[var(--aesthetic-border)]/40 bg-[var(--aesthetic-background)]/60 rounded-none p-5 font-mono text-sm crt-scanlines",
        className
      )}
    >
      {TERMINAL_LINES.map((width, i) => (
        <div
          key={i}
          className="skeleton-line mb-2 flex items-center gap-2"
          style={{ animationDelay: `${i * 260}ms` }}
        >
          <span className="text-[var(--aesthetic-accent)]/60">&gt;</span>
          <span
            className="inline-block h-3 bg-[var(--aesthetic-accent)]/15"
            style={{ width: `${width}%` }}
          />
        </div>
      ))}
      <div
        className="skeleton-line mt-3 text-[var(--aesthetic-accent)] text-xs uppercase tracking-widest"
        style={{ animationDelay: `${TERMINAL_LINES.length * 260}ms` }}
      >
        [{loadingStatus}…]{" "}
        <span className="animate-[typewriter-blink_0.9s_steps(1)_infinite]">█</span>
      </div>
    </div>
  );
}
