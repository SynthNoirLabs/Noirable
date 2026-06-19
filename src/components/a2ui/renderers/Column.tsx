"use client";

import type { SurfaceComponent } from "@/lib/a2ui/surfaces/manager";
import { cn } from "@/lib/utils";
import type { ComponentProps } from "../internal/context";
import { ChildList } from "../internal/registry";

export function ColumnRenderer({ component }: ComponentProps) {
  const col = component as SurfaceComponent & { justify?: string; align?: string };
  return (
    <div
      className={cn(
        "flex flex-col gap-3",
        col.justify === "center" && "justify-center",
        col.justify === "end" && "justify-end",
        col.align === "center" && "items-center",
        col.align === "end" && "items-end",
        col.align === "stretch" && "items-stretch"
      )}
    >
      <ChildList childList={(component as { children?: unknown }).children} applyWeight />
    </div>
  );
}
