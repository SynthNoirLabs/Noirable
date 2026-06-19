"use client";

import { useEffect } from "react";
import { useSurfaceStore } from "@/lib/a2ui/store/useSurfaceStore";
import type { SurfaceComponent } from "@/lib/a2ui/surfaces/manager";

/** Tick cadence for the live feed. */
const TICK_MS = 4000;
/** Maximum per-tick drift (±3%). */
const DRIFT = 0.06;

/**
 * The LIVE WIRE — an opt-in feed that makes generated dashboards tick.
 *
 * Every few seconds the active surface's numeric displays take a small random
 * walk through the real store update path (`updateComponents`), so Stats and
 * DataDashboard metrics/progress visibly live instead of sitting frozen:
 * "$12,400" drifts to "$12,718", a 62% progress bar breathes. Formatting is
 * preserved — prefix/suffix, thousands separators, and decimal places survive
 * the walk.
 */
export function useLiveWire(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    const interval = setInterval(() => {
      const store = useSurfaceStore.getState();
      const surfaceIds = Array.from(store.surfaces.keys());
      const surfaceId = surfaceIds[surfaceIds.length - 1];
      if (!surfaceId) return;
      const surface = store.getSurface(surfaceId);
      if (!surface) return;

      const updates: SurfaceComponent[] = [];
      for (const component of surface.components.values()) {
        if (component.component === "Stat") {
          const next = walkFormattedNumber((component as { value?: unknown }).value);
          if (next !== null) {
            updates.push({ ...component, value: next });
          }
        } else if (component.component === "DataDashboard") {
          const widgets = (component as { widgets?: unknown }).widgets;
          if (!Array.isArray(widgets)) continue;
          let changed = false;
          const nextWidgets = widgets.map((widget) => {
            if (!widget || typeof widget !== "object") return widget;
            const w = widget as Record<string, unknown>;
            if (w.type === "metric") {
              const next = walkFormattedNumber(w.value);
              if (next !== null) {
                changed = true;
                return { ...w, value: next };
              }
            } else if (w.type === "progress" && typeof w.progress === "number") {
              changed = true;
              const drifted = w.progress + (Math.random() - 0.5) * 6;
              return { ...w, progress: Math.round(Math.min(100, Math.max(0, drifted))) };
            }
            return widget;
          });
          if (changed) {
            updates.push({ ...component, widgets: nextWidgets });
          }
        }
      }

      if (updates.length > 0) {
        store.updateComponents(surfaceId, updates);
      }
    }, TICK_MS);
    return () => clearInterval(interval);
  }, [enabled]);
}

/**
 * Random-walk the first number inside a formatted value, preserving its
 * surrounding text, thousands separators, and decimal places. Returns null
 * when there's nothing numeric to walk (e.g. "NOMINAL").
 */
function walkFormattedNumber(raw: unknown): string | number | null {
  if (typeof raw === "number" && Number.isFinite(raw)) {
    const next = raw * (1 + (Math.random() - 0.5) * DRIFT);
    return Number.isInteger(raw) ? Math.round(next) : Number(next.toFixed(2));
  }
  if (typeof raw !== "string") return null;
  const match = raw.match(/-?\d[\d,]*(?:\.\d+)?/);
  if (!match) return null;
  const numeric = Number.parseFloat(match[0].replace(/,/g, ""));
  if (!Number.isFinite(numeric) || numeric === 0) return null;

  const next = numeric * (1 + (Math.random() - 0.5) * DRIFT);
  const decimals = match[0].includes(".") ? (match[0].split(".")[1] ?? "").length : 0;
  const formatted = match[0].includes(",")
    ? Number(next.toFixed(decimals)).toLocaleString("en-US", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })
    : next.toFixed(decimals);
  return raw.replace(match[0], formatted);
}
