"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { resolveChildList } from "@/lib/a2ui/binding/template-children";
import { getMotionPersonality } from "@/lib/aesthetic/identity";
import type { SurfaceComponent } from "@/lib/a2ui/surfaces/manager";
import { ScopeContext, useSurfaceContext, type ComponentProps } from "./context";
import { useBaseAestheticId } from "./binding";
import { entranceHiddenVariant, mapEasing } from "./motion";

// ============================================================================
// Component registry
//
// The catalog map is a mutable registry rather than a const literal so that the
// renderer modules and the COMPONENT_MAP-assembly site can reference each other
// without an import cycle: a renderer imports ChildList/ComponentRenderer from
// here, while SurfaceRenderer.tsx populates the map via `registerComponents`.
// ============================================================================

const COMPONENT_MAP: Record<string, React.FC<ComponentProps>> = {};

// Case-insensitive lookup so a stray legacy lowercase type (e.g. "column" that
// slipped past the legacy→catalog adapter) still renders instead of showing an
// "[Unknown: column]" error box. The catalog adapter remains the canonical
// normalizer; this is only a render-time safety net.
const COMPONENT_MAP_LC: Record<string, React.FC<ComponentProps>> = {};

/** Register a batch of catalog renderers (called once from SurfaceRenderer). */
export function registerComponents(map: Record<string, React.FC<ComponentProps>>): void {
  for (const [name, renderer] of Object.entries(map)) {
    COMPONENT_MAP[name] = renderer;
    COMPONENT_MAP_LC[name.toLowerCase()] = renderer;
  }
}

function resolveRenderer(type: unknown): React.FC<ComponentProps> | undefined {
  if (typeof type !== "string") return undefined;
  return COMPONENT_MAP[type] ?? COMPONENT_MAP_LC[type.toLowerCase()];
}

export function MissingComponent({ id }: { id: string }) {
  return (
    <div className="border border-dashed border-[var(--aesthetic-error)]/50 p-2 text-[var(--aesthetic-error)]/70 text-xs font-mono">
      [Missing: {id}]
    </div>
  );
}

export function UnknownComponent({ component }: ComponentProps) {
  return (
    <div className="bg-[var(--aesthetic-error)]/10 border border-[var(--aesthetic-error)]/50 p-2 text-[var(--aesthetic-error)] text-xs font-mono">
      [Unknown: {component.component ?? "undefined"}]
    </div>
  );
}

export function ComponentRenderer({ component }: ComponentProps) {
  const renderer = resolveRenderer(component.component);
  if (!renderer) {
    return <UnknownComponent component={component} />;
  }
  // createElement (not JSX) because the renderer is resolved dynamically from
  // the catalog map; a capitalized JSX binding would trip the static-component
  // lint rule even though every entry is a module-level component.
  return React.createElement(renderer, { component });
}

/**
 * Render a component's children. `children` is the raw childList field: either
 * a static `string[]` or a template `{ componentId, path }`. Template-expanded
 * children carry a per-item scope, provided to descendants via ScopeContext.
 *
 * When `applyWeight` is set (Row/Column only, per the A2UI spec: `weight` is
 * "similar to CSS flex-grow ... ONLY when a direct descendant of a Row or
 * Column"), a child with a positive numeric `weight` is wrapped in a flex item
 * that grows proportionally. Unweighted children stay as plain flex items.
 *
 * Each child also gets a staggered framer-motion entrance keyed off the active
 * world's motion personality (duration / stagger / easing). Critically, the
 * motion element IS the weight wrapper when a child is weighted (never an extra
 * box around a weighted flex item), so Row/Column flex-grow math is preserved.
 * Honors prefers-reduced-motion by rendering plain, un-animated children.
 */
export function ChildList({
  childList,
  applyWeight = false,
}: {
  childList: unknown;
  applyWeight?: boolean;
}) {
  const { getComponent, dataModel } = useSurfaceContext();
  const baseAestheticId = useBaseAestheticId();
  const prefersReducedMotion = useReducedMotion();
  const resolved = resolveChildList(childList, dataModel);

  const motionPersonality = getMotionPersonality(baseAestheticId);
  const childTransition = {
    duration: motionPersonality.durationMs / 1000,
    ease: mapEasing(motionPersonality.easing),
  };
  const staggerStep = motionPersonality.staggerMs / 1000;
  // Each child reveals itself with its own initial→animate + a per-index delay,
  // NOT via a parent `staggerChildren` orchestrator. A parent conductor can be
  // interrupted mid-cascade when a child subtree re-renders (e.g. a generated
  // <img> finishes loading the instant a take is shown), which strands the
  // not-yet-cued siblings permanently at their hidden opacity:0. Self-contained
  // per-child animation is interruption-proof: `animate` is a fixed target
  // framer-motion settles on and never reverts from, across re-renders/remounts.
  //
  // `hiddenTarget` carries each preset's arrival physics, so a child doesn't
  // just fade up uniformly — it materializes in character: noir drifts in from
  // the lower-left, cyber snaps from a shrunk "boot" scale, nostromo prints down
  // like a terminal line, gothic swells from a candlelit scale, minimal makes a
  // short crisp hop. `showTarget` is the shared settled state (full opacity/size)
  // so every preset lands in the same place. Reduced-motion never reaches here.
  const hiddenTarget = entranceHiddenVariant(motionPersonality.entrance);
  const showTarget = { opacity: 1, y: 0, x: 0, scale: 1 };

  // Reduced-motion: render plain children with no motion wrapper at all, so the
  // weighted flex items keep their exact layout and nothing animates.
  if (prefersReducedMotion) {
    return (
      <>
        {resolved.map(({ componentId, scope, key }) => {
          const child = getComponent(componentId);
          if (!child) return <MissingComponent key={key} id={componentId} />;
          let node = <ComponentRenderer component={child} />;
          const weight = (child as { weight?: unknown }).weight;
          if (applyWeight && typeof weight === "number" && weight > 0) {
            node = (
              <div style={{ flexGrow: weight }} className="min-w-0">
                {node}
              </div>
            );
          }
          return scope !== undefined ? (
            <ScopeContext.Provider key={key} value={scope}>
              {node}
            </ScopeContext.Provider>
          ) : (
            <React.Fragment key={key}>{node}</React.Fragment>
          );
        })}
      </>
    );
  }

  // No parent wrapper: each child animates independently (so there is no
  // orchestrator box to insert, and nothing to interrupt). The motion children
  // remain the parent Row/Column/Grid/List's own direct flex/grid items, same
  // as before when the wrapper used `display: contents`.
  return (
    <>
      {resolved.map(({ componentId, scope, key }, index) => {
        const child = getComponent(componentId);
        if (!child) return <MissingComponent key={key} id={componentId} />;
        const weight = (child as { weight?: unknown }).weight;
        const weighted = applyWeight && typeof weight === "number" && weight > 0;
        // Per-child reveal: initial=hidden → animate=show with a per-index delay
        // that reproduces the stagger, but self-contained so a mid-flight
        // re-render can never strand a later sibling at opacity:0. The motion
        // element IS the weight wrapper when weighted (flexGrow on the animated
        // box), so Row/Column flex-grow math is preserved; unweighted children
        // get a minimal animated wrapper that sizes to its content.
        const childTransitionWithDelay = { ...childTransition, delay: index * staggerStep };
        const node = weighted ? (
          <motion.div
            initial={hiddenTarget}
            animate={showTarget}
            transition={childTransitionWithDelay}
            style={{ flexGrow: weight }}
            className="min-w-0"
          >
            <ComponentRenderer component={child} />
          </motion.div>
        ) : (
          <motion.div
            initial={hiddenTarget}
            animate={showTarget}
            transition={childTransitionWithDelay}
          >
            <ComponentRenderer component={child} />
          </motion.div>
        );
        return scope !== undefined ? (
          <ScopeContext.Provider key={key} value={scope}>
            {node}
          </ScopeContext.Provider>
        ) : (
          <React.Fragment key={key}>{node}</React.Fragment>
        );
      })}
    </>
  );
}

/** Child-reference fields a container uses to point at other components by id. */
const CHILD_ID_FIELDS = ["children", "child", "content", "trigger"] as const;

/** Collect the component ids a node references as children (flattened, deduped). */
export function childIdsOf(component: SurfaceComponent): string[] {
  const ids: string[] = [];
  for (const field of CHILD_ID_FIELDS) {
    const value = (component as Record<string, unknown>)[field];
    if (typeof value === "string") ids.push(value);
    else if (Array.isArray(value)) {
      for (const v of value) if (typeof v === "string") ids.push(v);
    }
  }
  // Tabs/Modal-style `items: [{ child }]` — pull nested child ids too.
  const items = (component as { items?: unknown }).items;
  if (Array.isArray(items)) {
    for (const item of items) {
      const child = (item as { child?: unknown })?.child;
      if (typeof child === "string") ids.push(child);
    }
  }
  return ids;
}
