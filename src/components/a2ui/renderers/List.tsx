"use client";

import type { SurfaceComponent } from "@/lib/a2ui/surfaces/manager";
import { cn } from "@/lib/utils";
import type { ComponentProps } from "../internal/context";
import { ChildList } from "../internal/registry";

export function ListRenderer({ component }: ComponentProps) {
  const list = component as SurfaceComponent & { direction?: string };
  return (
    <div
      className={cn(
        "flex gap-2",
        list.direction === "horizontal" ? "flex-row overflow-x-auto" : "flex-col"
      )}
    >
      <ChildList childList={(component as { children?: unknown }).children} />
    </div>
  );
}
