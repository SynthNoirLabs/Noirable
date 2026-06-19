"use client";

import type { SurfaceComponent } from "@/lib/a2ui/surfaces/manager";
import { cn } from "@/lib/utils";
import type { ComponentProps } from "../internal/context";

export function DividerRenderer({ component }: ComponentProps) {
  const divider = component as SurfaceComponent & { axis?: string };
  return (
    <hr
      className={cn(
        "border-[var(--aesthetic-border)]/30",
        divider.axis === "vertical" ? "border-l h-full w-0" : "border-t w-full h-0"
      )}
    />
  );
}
