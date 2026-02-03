"use client";

import React from "react";
import { useSurfaceStore } from "@/lib/a2ui/store/useSurfaceStore";
import { SurfaceRenderer } from "./SurfaceRenderer";

/**
 * A2UI v0.9 Preview Component
 *
 * Renders the active surface from the surface store.
 * Used when A2UI v0.9 mode is enabled.
 */

interface A2UIv09PreviewProps {
  className?: string;
}

export function A2UIv09Preview({ className }: A2UIv09PreviewProps) {
  const { surfaces, getAllSurfaceIds } = useSurfaceStore();
  const surfaceIds = getAllSurfaceIds();

  if (surfaceIds.length === 0) {
    return (
      <div className="bg-[var(--aesthetic-error)]/10 border-2 border-[var(--aesthetic-error)] p-4 rounded-sm animate-pulse max-w-md">
        <h3 className="text-[var(--aesthetic-error)] font-typewriter font-bold mb-2">
          NO SURFACES
        </h3>
        <p className="text-[var(--aesthetic-error)]/80 font-mono text-xs">
          Send a message to generate UI using A2UI v0.9 protocol.
        </p>
      </div>
    );
  }

  // Render the most recent surface
  const lastSurfaceId = surfaceIds[surfaceIds.length - 1];
  const surface = surfaces.get(lastSurfaceId);

  if (!surface) {
    return null;
  }

  return (
    <div className={className}>
      <div className="mb-2 flex items-center gap-2">
        <span className="text-[var(--aesthetic-accent)] font-mono text-xs">
          A2UI v0.9 Surface: {surface.config.surfaceId}
        </span>
        <span className="text-[var(--aesthetic-text)]/50 font-mono text-xs">
          ({surface.components.size} components)
        </span>
      </div>
      <SurfaceRenderer surface={surface} theme="noir" />
    </div>
  );
}
