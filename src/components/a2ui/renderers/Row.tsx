"use client";

import type { SurfaceComponent } from "@/lib/a2ui/surfaces/manager";
import { cn } from "@/lib/utils";
import type { ComponentProps } from "../internal/context";
import { ChildList } from "../internal/registry";

export function RowRenderer({ component }: ComponentProps) {
  const row = component as SurfaceComponent & { justify?: string; align?: string };
  return (
    <div
      className={cn(
        // flex-wrap so a tight row (e.g. a strip of badges) wraps instead of
        // overflowing/compressing its children.
        "flex flex-row flex-wrap gap-2",
        row.justify === "center" && "justify-center",
        row.justify === "end" && "justify-end",
        row.justify === "spaceBetween" && "justify-between",
        row.justify === "spaceAround" && "justify-around",
        row.justify === "spaceEvenly" && "justify-evenly",
        row.align === "center" ? "items-center" : "items-start",
        row.align === "end" && "items-end",
        row.align === "stretch" && "items-stretch"
      )}
    >
      <ChildList childList={(component as { children?: unknown }).children} applyWeight />
    </div>
  );
}
