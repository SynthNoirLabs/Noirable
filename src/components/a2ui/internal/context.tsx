"use client";

import { createContext, useContext } from "react";
import type { SurfaceState, SurfaceComponent } from "@/lib/a2ui/surfaces/manager";

// ============================================================================
// Context for component resolution
// ============================================================================

export interface SurfaceContextValue {
  surface: SurfaceState;
  getComponent: (id: string) => SurfaceComponent | undefined;
  /** The live (working) data model — root for JSON Pointer resolution. */
  dataModel: Record<string, unknown>;
  /** Write a value back into the data model (two-way binding). */
  setData: (path: string, value: unknown) => void;
  /**
   * Dispatch a component action (server event or local function call). The
   * optional `label` (e.g. the button's text) is used for the click
   * acknowledgement toast when the action has no otherwise-visible effect.
   */
  runAction: (componentId: string, action: unknown, label?: string) => void;
  theme: "noir" | "standard";
}

export const SurfaceContext = createContext<SurfaceContextValue | null>(null);

/**
 * Per-subtree data scope, set by template-expanded children so that relative
 * JSON Pointers and function-call args resolve against the current item rather
 * than the surface root. Undefined at the top level.
 */
export const ScopeContext = createContext<unknown>(undefined);

export function useSurfaceContext(): SurfaceContextValue {
  const ctx = useContext(SurfaceContext);
  if (!ctx) {
    throw new Error("useSurfaceContext must be used within SurfaceRenderer");
  }
  return ctx;
}

export interface ComponentProps {
  component: SurfaceComponent;
}
