"use client";

import React from "react";
import type { SurfaceComponent } from "@/lib/a2ui/surfaces/manager";
import { getEffectsProfile } from "@/lib/aesthetic/identity";
import { cn } from "@/lib/utils";
import { useSurfaceContext, type ComponentProps } from "../internal/context";
import { useBaseAestheticId } from "../internal/binding";
import { ComponentRenderer, MissingComponent } from "../internal/registry";

/**
 * Deterministic small tilt (in degrees, as a CSS string) hashed from a stable
 * id string — the same djb2-style hash PhotoDeveloper uses for its photo
 * rotation. Keeps the result in a tasteful, symmetric range so paper dossier
 * cards read as evidence casually laid on a desk without ever using
 * Math.random / Date.now (which would re-roll every render and break SSR).
 */
function deterministicTilt(seed: string, rangeDeg: number): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  // `hash` is a signed int32 and often negative; JS `%` keeps the sign, so use
  // the unsigned value to keep the tilt in a symmetric -range..+range spread.
  const steps = rangeDeg * 20; // 0.1deg granularity
  const val = ((hash >>> 0) % (steps + 1)) / 10 - rangeDeg;
  return `${val}deg`;
}

export function CardRenderer({ component }: ComponentProps) {
  const { getComponent } = useSurfaceContext();
  const baseAestheticId = useBaseAestheticId();
  const card = component as SurfaceComponent & { child?: string };

  const childComponent = card.child ? getComponent(card.child) : null;
  const body = childComponent ? (
    <ComponentRenderer component={childComponent} />
  ) : (
    <MissingComponent id={card.child || "unknown"} />
  );

  // Data-driven card material: the effects profile (paper/parchment/hologram/
  // wireframe/flat) is emitted as `data-effect-card` so the per-material rules
  // in globals.css (scoped to `[data-effect-card="…"] .a2ui-card`) apply the
  // right treatment — aged paper for noir, neon hologram for cyber, green
  // wireframe for nostromo, parchment for gothic, clean flat surface for
  // minimal. Each material rule also re-asserts a contrast-correct body text
  // color so dark ink reads on light paper/parchment. The Tailwind classes here
  // are the dark base fallback for renders without a resolved material (e.g.
  // unit tests, which assert the thin amber `border-t-2` top accent stays).
  const effects = getEffectsProfile(baseAestheticId);

  // Signature touch — paper (noir) only: a slight deterministic tilt so the
  // aged-paper dossier reads as evidence casually laid on a desk. The hash is
  // seeded on the component id (stable across renders/SSR), and the coffee-stain
  // + corner-tape decoration is layered on in globals.css. Other materials keep
  // their crisp, un-tilted alignment. The tilt goes out as the --card-tilt CSS
  // var (not an inline transform) so the per-material :hover lift in
  // globals.css can compose with it instead of being overridden by it.
  const tiltStyle =
    effects.card === "paper"
      ? ({ "--card-tilt": deterministicTilt(component.id, 1.2) } as React.CSSProperties)
      : undefined;

  return (
    <div
      data-effect-card={effects.card}
      style={tiltStyle}
      className={cn(
        // `relative` anchors the per-material ::before/::after decorations
        // (coffee-stain, corner-tape, HUD brackets, wax seal) defined in
        // globals.css to the card box.
        "a2ui-card relative rounded-sm border border-[var(--aesthetic-border)]/30 bg-[var(--aesthetic-surface)]/60 p-5",
        "border-t-2 border-t-[var(--aesthetic-accent)]/60 shadow-[0_8px_24px_rgba(0,0,0,0.35)]"
      )}
    >
      {body}
    </div>
  );
}
