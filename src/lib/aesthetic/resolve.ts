/**
 * Unify built-in presets and custom profiles behind ONE resolved shape.
 *
 * Every consumer (renderers, CSS injection, audio, voice, copy) can read a
 * single `ResolvedAesthetic` regardless of whether the active world is a
 * built-in preset or a custom profile layered on top of one. A custom profile
 * is just "base definition + overrides", so this collapses the bespoke
 * `activeProfile?.baseAestheticId ?? settings.aestheticId` pattern scattered
 * across components into one hook.
 *
 * Client-safe: reads AESTHETIC_DEFINITIONS, never the server-only registry.
 */
import type {
  AestheticDefinition,
  AestheticIdentity,
  BuiltInAestheticId,
  ThemeColors,
} from "./types";
import { getAestheticDefinition } from "./definitions";
import type { CustomProfile, ProfileColors } from "@/lib/customization/types";

export interface ResolvedAesthetic {
  /** The custom profile id when a custom world is active, else the built-in id. */
  id: string;
  /** The underlying built-in preset this resolves against. */
  baseId: BuiltInAestheticId;
  /** Human-readable name (custom profile name, or the preset name). */
  name: string;
  /** Merged theme colors (base preset colors with profile overrides applied). */
  colors: ThemeColors;
  /** The full identity layer of the base preset. */
  identity: AestheticIdentity;
  /** Default voice id (profile override or preset default). */
  voiceId: string;
  /** Effective image style prompt (profile override or preset default). */
  imageStylePrompt: string;
  /** True when a custom profile is layered on top of the base preset. */
  isCustom: boolean;
}

/**
 * Merge profile color overrides onto the base preset's colors. Only keys with a
 * defined override win; everything else inherits the base.
 */
function mergeColors(base: ThemeColors, overrides: ProfileColors | undefined): ThemeColors {
  if (!overrides) return base;
  const merged: ThemeColors = { ...base };
  (Object.keys(overrides) as (keyof ProfileColors)[]).forEach((key) => {
    const value = overrides[key];
    if (value) merged[key] = value;
  });
  return merged;
}

/**
 * Resolve a built-in preset id (and optional custom profile) into one merged
 * ResolvedAesthetic. Falls back to noir for unknown ids.
 */
export function resolveAesthetic(
  baseId: string | undefined,
  customProfile?: CustomProfile | null
): ResolvedAesthetic {
  const def: AestheticDefinition = getAestheticDefinition(customProfile?.baseAestheticId ?? baseId);

  if (!customProfile) {
    return {
      id: def.id,
      baseId: def.id,
      name: def.name,
      colors: def.theme.colors,
      identity: def.identity,
      voiceId: def.voiceId,
      imageStylePrompt: def.imageStylePrompt,
      isCustom: false,
    };
  }

  return {
    id: customProfile.id,
    baseId: def.id,
    name: customProfile.name || def.name,
    colors: mergeColors(def.theme.colors, customProfile.colors),
    identity: def.identity,
    voiceId: customProfile.voice?.voiceId || def.voiceId,
    imageStylePrompt: customProfile.imageStylePrompt || def.imageStylePrompt,
    isCustom: true,
  };
}
