"use client";

import { useState } from "react";
import type { SurfaceComponent } from "@/lib/a2ui/surfaces/manager";
import { cn } from "@/lib/utils";
import { useSurfaceContext, type ComponentProps } from "../internal/context";
import { useResolve } from "../internal/binding";
import { ComponentRenderer, MissingComponent } from "../internal/registry";

interface TabItem {
  title?: unknown;
  child?: string;
}

export function TabsRenderer({ component }: ComponentProps) {
  const { getComponent } = useSurfaceContext();
  const resolve = useResolve();
  const tabs = component as SurfaceComponent & { tabs?: TabItem[] };
  const items = Array.isArray(tabs.tabs) ? tabs.tabs : [];
  const [active, setActive] = useState(0);

  if (items.length === 0) {
    return <MissingComponent id={`${component.id} (no tabs)`} />;
  }

  const safeActive = Math.min(active, items.length - 1);
  const activeChild = items[safeActive]?.child ? getComponent(items[safeActive].child!) : null;

  return (
    <div className="flex flex-col gap-3">
      <div
        role="tablist"
        className="flex flex-row gap-1 border-b border-[var(--aesthetic-border)]/30"
      >
        {items.map((tab, index) => {
          const title = String(resolve(tab.title) ?? `Tab ${index + 1}`);
          const selected = index === safeActive;
          return (
            <button
              key={`${component.id}-tab-${index}`}
              role="tab"
              type="button"
              aria-selected={selected}
              onClick={() => setActive(index)}
              className={cn(
                "px-3 py-1.5 font-typewriter text-xs uppercase tracking-widest transition-colors -mb-px border-b-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--aesthetic-accent)]",
                selected
                  ? "border-[var(--aesthetic-accent)] text-[var(--aesthetic-accent)]"
                  : "border-transparent text-[var(--aesthetic-text)]/60 hover:text-[var(--aesthetic-accent)]"
              )}
            >
              {title}
            </button>
          );
        })}
      </div>
      <div role="tabpanel">
        {activeChild ? (
          <ComponentRenderer component={activeChild} />
        ) : (
          <MissingComponent id={items[safeActive]?.child || "unknown"} />
        )}
      </div>
    </div>
  );
}
