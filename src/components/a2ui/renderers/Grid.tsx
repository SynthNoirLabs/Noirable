"use client";

import type { SurfaceComponent } from "@/lib/a2ui/surfaces/manager";
import { cn } from "@/lib/utils";
import type { ComponentProps } from "../internal/context";
import { ChildList } from "../internal/registry";

// Grid — a real CSS grid so multi-column layouts aren't flattened to a stack.
export function GridRenderer({ component }: ComponentProps) {
  const grid = component as SurfaceComponent & { columns?: unknown };
  const cols = Number(grid.columns);
  const colsClass =
    cols === 4
      ? "grid-cols-2 sm:grid-cols-4"
      : cols === 3
        ? "grid-cols-2 sm:grid-cols-3"
        : "grid-cols-1 sm:grid-cols-2";
  return (
    <div className={cn("grid gap-3", colsClass)}>
      <ChildList childList={(component as { children?: unknown }).children} />
    </div>
  );
}
