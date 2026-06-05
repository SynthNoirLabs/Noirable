import { isBuiltInAestheticId } from "./types";
import type { AestheticId, AudioPack, BuiltInAestheticId } from "./types";
import { AESTHETIC_DEFINITIONS } from "./definitions";

/**
 * Audio pack configurations for each aesthetic profile.
 *
 * These derive from the single client-safe source of truth in definitions.ts
 * (previously this file hand-duplicated every pack from the server-only
 * registry). Client components can safely import from this module.
 */

/**
 * Registry of audio packs by aesthetic ID, derived from AESTHETIC_DEFINITIONS.
 */
export const AUDIO_PACKS: Record<BuiltInAestheticId, AudioPack> = {
  noir: AESTHETIC_DEFINITIONS.noir.audio,
  minimal: AESTHETIC_DEFINITIONS.minimal.audio,
  "cyber-fixer": AESTHETIC_DEFINITIONS["cyber-fixer"].audio,
  "nostromo-console": AESTHETIC_DEFINITIONS["nostromo-console"].audio,
  "gothic-manor": AESTHETIC_DEFINITIONS["gothic-manor"].audio,
};

/**
 * Get the audio pack for a given aesthetic ID.
 * Falls back to noir if the ID is not found.
 *
 * @param aestheticId - The aesthetic ID to retrieve audio for
 * @returns The audio pack configuration
 *
 * @example
 * ```typescript
 * const pack = getAudioPack("noir");
 * console.log(pack.music.volume); // 0.22
 * ```
 */
export function getAudioPack(aestheticId: AestheticId): AudioPack {
  if (isBuiltInAestheticId(aestheticId)) {
    return AUDIO_PACKS[aestheticId];
  }
  return AUDIO_PACKS.noir;
}

export function getAudioPackSafe(id: AestheticId): AudioPack | null {
  if (isBuiltInAestheticId(id)) {
    return getAudioPack(id);
  }

  return null;
}
