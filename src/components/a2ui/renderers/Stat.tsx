"use client";

import type { SurfaceComponent } from "@/lib/a2ui/surfaces/manager";
import { getEffectsProfile } from "@/lib/aesthetic/identity";
import type { ComponentProps } from "../internal/context";
import { useResolve, useBaseAestheticId } from "../internal/binding";

// Stat — a compact metric tile with an accent rule, label, and big value.
// Adapter-emitted (not in the upstream catalog) so legacy `stat` reads as a
// proper KPI rather than loose stacked text.
export function StatRenderer({ component }: ComponentProps) {
  const resolve = useResolve();
  const baseAestheticId = useBaseAestheticId();
  const stat = component as SurfaceComponent & {
    label?: unknown;
    value?: unknown;
    helper?: unknown;
  };
  const label = String(resolve(stat.label) ?? "");
  const value = String(resolve(stat.value) ?? "");
  const helper = stat.helper ? String(resolve(stat.helper)) : "";

  // Emit the resolved card material as `data-effect-stat` so globals.css can give
  // the metric a per-material finish (paper inset, neon HUD readout, phosphor
  // terminal counter, parchment seal-tint, clean flat) — mirroring the
  // data-effect-card pattern, so custom profiles inherit it via their base.
  const effects = getEffectsProfile(baseAestheticId);

  return (
    <div
      data-effect-stat={effects.card}
      className="a2ui-stat flex flex-col gap-1 rounded-[var(--aesthetic-radius,2px)] border-l-2 border-[var(--aesthetic-accent)]/60 bg-[var(--aesthetic-text)]/[0.03] px-3 py-2"
    >
      <span className="font-typewriter text-[10px] uppercase tracking-widest text-[var(--aesthetic-text)]/55">
        {label}
      </span>
      <span className="font-typewriter text-2xl font-bold text-[var(--aesthetic-accent)] tabular-nums leading-none">
        {value}
      </span>
      {helper && (
        <span className="font-mono text-[10px] text-[var(--aesthetic-text)]/50">{helper}</span>
      )}
    </div>
  );
}
