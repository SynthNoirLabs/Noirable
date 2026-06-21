"use client";

import { useCallback, useContext } from "react";
import { resolvePointer } from "@/lib/a2ui/binding/pointer";
import { isFunctionCall, evaluateFunctionCall } from "@/lib/a2ui/binding/functions";
import { useA2UIStore } from "@/lib/store/useA2UIStore";
import { useCustomProfileStore } from "@/lib/store/useCustomProfileStore";
import { ScopeContext, useSurfaceContext } from "./context";

// ============================================================================
// Data-binding helpers
// ============================================================================

// Per the A2UI v0.9 catalog, a data binding is the explicit object form
// `{ path: "/json/pointer" }`; a bare string is always a literal. This avoids
// the ambiguity where a literal value that happens to start with "/" (e.g. a
// URL path or "/home") would be mistaken for a pointer.
export function getBindingPath(value: unknown): string | null {
  if (
    value &&
    typeof value === "object" &&
    "path" in value &&
    typeof (value as { path: unknown }).path === "string"
  ) {
    return (value as { path: string }).path;
  }
  return null;
}

/**
 * Resolve a Dynamic value against the data model + current scope:
 * - functionCall `{ call, args }` → evaluated via the built-in registry.
 * - data binding `{ path }` → JSON Pointer resolution (scope-aware).
 * - anything else → literal passthrough.
 */
export function resolveValue(
  value: unknown,
  dataModel: Record<string, unknown>,
  scope: unknown
): unknown {
  if (isFunctionCall(value)) {
    return evaluateFunctionCall(value, dataModel, scope);
  }
  const path = getBindingPath(value);
  if (path !== null) {
    return resolvePointer(dataModel, path, scope);
  }
  return value;
}

/** Hook returning a scope-aware resolver for the current subtree. */
export function useResolve(): (value: unknown) => unknown {
  const { dataModel } = useSurfaceContext();
  const scope = useContext(ScopeContext);
  return useCallback((value: unknown) => resolveValue(value, dataModel, scope), [dataModel, scope]);
}

/**
 * Resolve the active base aesthetic id (a built-in preset key) the same way the
 * rest of the renderer does: a custom profile reports its `baseAestheticId`,
 * otherwise the store's selected aesthetic. Drives effect/style/motion lookups
 * so decoration is data-driven (per the effects profile) rather than keyed on a
 * hardcoded preset id.
 */
export function useBaseAestheticId() {
  const activeProfile = useCustomProfileStore((state) => {
    if (!state.activeCustomProfileId) return null;
    return state.customProfiles.find((p) => p.id === state.activeCustomProfileId) ?? null;
  });
  const fallbackAestheticId = useA2UIStore((state) => state.settings.aestheticId || "noir");
  return activeProfile?.baseAestheticId ?? fallbackAestheticId;
}
