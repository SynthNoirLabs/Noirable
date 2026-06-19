"use client";

import type { SurfaceComponent } from "@/lib/a2ui/surfaces/manager";
import { cn } from "@/lib/utils";
import { useSurfaceContext, type ComponentProps } from "../internal/context";
import { useResolve } from "../internal/binding";

/** Extract a plain-text label from a button's child component (or `label`). */
function buttonLabel(
  btn: SurfaceComponent & { child?: string; label?: unknown },
  getComponent: (id: string) => SurfaceComponent | undefined,
  resolve: (value: unknown) => unknown
): string {
  if (btn.child) {
    const child = getComponent(btn.child) as (SurfaceComponent & { text?: unknown }) | undefined;
    if (child && typeof child.text !== "undefined") {
      return String(resolve(child.text) ?? "");
    }
  }
  if (typeof btn.label !== "undefined") return String(resolve(btn.label) ?? "");
  return "Submit";
}

export function ButtonRenderer({ component }: ComponentProps) {
  const { getComponent, runAction } = useSurfaceContext();
  const resolve = useResolve();
  const btn = component as SurfaceComponent & {
    child?: string;
    label?: unknown;
    variant?: string;
    action?: unknown;
  };

  // Render the label as plain text with a contrast-correct color rather than
  // recursing into a Text component (which would re-assert the light surface
  // color and wash out against the filled amber background).
  const label = buttonLabel(btn, getComponent, resolve);
  const borderless = btn.variant === "borderless";

  return (
    <button
      type="button"
      onClick={() => runAction(btn.id, btn.action, label)}
      className={cn(
        // Press physicality: a 1px sink on :active so the click lands somewhere.
        "px-4 py-2.5 font-mono text-sm font-semibold uppercase tracking-wider transition-[color,background-color,border-color,transform,box-shadow] duration-150 active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--aesthetic-background)] focus-visible:ring-[var(--aesthetic-accent)]",
        borderless
          ? "text-[var(--aesthetic-accent)] hover:text-[var(--aesthetic-accent)]/80 border border-[var(--aesthetic-accent)]/40 rounded-[var(--aesthetic-radius,2px)] hover:border-[var(--aesthetic-accent)]"
          : "bg-[var(--aesthetic-accent)] text-[var(--aesthetic-background)] hover:bg-[var(--aesthetic-accent)]/90 rounded-[var(--aesthetic-radius,2px)] shadow-[0_2px_12px_color-mix(in_srgb,var(--aesthetic-accent)_25%,transparent)]"
      )}
    >
      {label}
    </button>
  );
}
