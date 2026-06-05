import { isBuiltInAestheticId } from "./types";
import type { AestheticId, BuiltInAestheticId } from "./types";

/**
 * Default ElevenLabs voice IDs per aesthetic.
 *
 * Mirrored from the server-only aesthetic registry (registry.ts `voiceId`
 * fields) so client components — which can't import the `server-only`
 * registry — can resolve and preview a preset's default voice. Keep in sync
 * with the registry, like audio-packs.ts.
 */
export const AESTHETIC_DEFAULT_VOICE_IDS: Record<BuiltInAestheticId, string> = {
  noir: "r5wMVcYycQezNCms1jJb",
  minimal: "21m00Tcm4TlvDq8ikWAM",
  "cyber-fixer": "pNInz6obpgDQGcFmaJgB",
  "nostromo-console": "N2lVS1w4EtoT3dr4eOWO",
  "gothic-manor": "JBFqnCBsd6RMkjVDRZzb",
};

/**
 * Resolve the default voice ID for an aesthetic, falling back to noir for
 * custom profile IDs or unknown values.
 */
export function getDefaultVoiceId(aestheticId: AestheticId | undefined): string {
  if (aestheticId && isBuiltInAestheticId(aestheticId)) {
    return AESTHETIC_DEFAULT_VOICE_IDS[aestheticId];
  }
  return AESTHETIC_DEFAULT_VOICE_IDS.noir;
}
