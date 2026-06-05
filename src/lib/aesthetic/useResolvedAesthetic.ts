"use client";

import { useMemo } from "react";
import { useA2UIStore } from "@/lib/store/useA2UIStore";
import { useCustomProfileStore } from "@/lib/store/useCustomProfileStore";
import { resolveAesthetic, type ResolvedAesthetic } from "./resolve";

/**
 * The one hook every client component should use to read the active world.
 *
 * Replaces the repeated `activeProfile?.baseAestheticId ?? settings.aestheticId`
 * pattern: it merges the active custom profile (if any) onto its base preset
 * definition and returns a single ResolvedAesthetic.
 */
export function useResolvedAesthetic(): ResolvedAesthetic {
  const activeProfile = useCustomProfileStore((state) => {
    if (!state.activeCustomProfileId) return null;
    return state.customProfiles.find((p) => p.id === state.activeCustomProfileId) ?? null;
  });
  const fallbackAestheticId = useA2UIStore((state) => state.settings.aestheticId || "noir");

  return useMemo(
    () => resolveAesthetic(fallbackAestheticId, activeProfile),
    [fallbackAestheticId, activeProfile]
  );
}
