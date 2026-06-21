"use client";

import React from "react";
import type { SurfaceComponent } from "@/lib/a2ui/surfaces/manager";
import { useSurfaceContext, type ComponentProps } from "../internal/context";
import { useResolve, getBindingPath } from "../internal/binding";

export function SliderRenderer({ component }: ComponentProps) {
  const { setData } = useSurfaceContext();
  const resolve = useResolve();
  const slider = component as SurfaceComponent & {
    label?: unknown;
    min?: number;
    max?: number;
    step?: number;
    value?: unknown;
  };

  const label = slider.label ? String(resolve(slider.label)) : "Range";
  const min = typeof slider.min === "number" ? slider.min : 0;
  const max = typeof slider.max === "number" ? slider.max : 100;
  const step = typeof slider.step === "number" && slider.step > 0 ? slider.step : undefined;
  const bindingPath = getBindingPath(slider.value);
  const resolved = resolve(slider.value);
  const value = typeof resolved === "number" ? resolved : Number(resolved) || min;

  // Track-fill percentage, exposed as a CSS var so globals.css can paint a
  // filled segment up to the thumb (a bare range input shows no fill). For a
  // controlled value the var stays in sync on every render; for an uncontrolled
  // one it seeds the initial fill and the onInput handler keeps it live without
  // forcing a React re-render. Guard a zero/negative span so the value never
  // divides by zero.
  const span = max - min;
  const pct = span > 0 ? Math.min(100, Math.max(0, ((value - min) / span) * 100)) : 0;

  return (
    <label className="flex flex-col gap-2 text-xs w-full">
      <div className="flex justify-between items-end">
        <span className="font-typewriter text-[var(--aesthetic-text)]/70">{label}</span>
        <span className="font-mono text-[var(--aesthetic-text)] tabular-nums">{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        {...(step !== undefined ? { step } : {})}
        {...(bindingPath ? { value } : { defaultValue: value })}
        onInput={(e) => {
          // Keep the visual fill in lock-step with the thumb even when the slider
          // is uncontrolled (no {path} binding), where React won't re-render.
          const el = e.currentTarget;
          const next = span > 0 ? ((Number(el.value) - min) / span) * 100 : 0;
          el.style.setProperty("--slider-pct", `${Math.min(100, Math.max(0, next))}%`);
        }}
        onChange={(e) => {
          if (bindingPath) setData(bindingPath, Number(e.currentTarget.value));
        }}
        style={{ "--slider-pct": `${pct}%` } as React.CSSProperties}
        className="a2ui-slider w-full cursor-pointer appearance-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--aesthetic-accent)]"
      />
    </label>
  );
}
