/**
 * Client-safe accessors for the per-preset identity layer (copy, music presets,
 * sample prompts, glow strength). These read AESTHETIC_DEFINITIONS, so any
 * client component can theme its chrome without touching the server-only
 * registry. Custom profiles resolve through their baseAestheticId.
 */
import { isBuiltInAestheticId } from "./types";
import type { AestheticCopy, AestheticId, MusicPreset } from "./types";
import { AESTHETIC_DEFINITIONS, getAestheticDefinition } from "./definitions";

/**
 * Per-preset chrome copy (workspace/editor titles, pending placeholders,
 * dictaphone labels). Falls back to noir for custom/unknown ids.
 */
export function getAestheticCopy(aestheticId: AestheticId | undefined): AestheticCopy {
  return getAestheticDefinition(aestheticId).identity.copy;
}

/**
 * Default music-generation style prompt for a preset.
 */
export function getMusicStylePrompt(aestheticId: AestheticId | undefined): string {
  return getAestheticDefinition(aestheticId).identity.musicStylePrompt;
}

/**
 * Per-preset quick-pick music presets for the composer.
 */
export function getMusicPresets(aestheticId: AestheticId | undefined): MusicPreset[] {
  return getAestheticDefinition(aestheticId).identity.musicPresets;
}

/**
 * Themed example prompts for the empty state. Falls back to noir.
 */
export function getSamplePrompts(aestheticId: AestheticId | undefined): string[] {
  return getAestheticDefinition(aestheticId).identity.samplePrompts;
}

/**
 * Per-preset glow strength multiplier (desk lamp / CRT bloom / scrollbar).
 */
export function getGlowStrength(aestheticId: AestheticId | undefined): number {
  if (aestheticId && isBuiltInAestheticId(aestheticId)) {
    return AESTHETIC_DEFINITIONS[aestheticId].identity.glowStrength;
  }
  return AESTHETIC_DEFINITIONS.noir.identity.glowStrength;
}
