import { isBuiltInAestheticId } from "./types";
import type { AestheticId, BuiltInAestheticId, VoiceDirection } from "./types";
import { AESTHETIC_DEFINITIONS } from "./definitions";

/**
 * Default ElevenLabs voice IDs per aesthetic.
 *
 * Derived from the single client-safe source of truth in definitions.ts so
 * client components — which can't import the `server-only` registry — can
 * resolve and preview a preset's default voice. (Previously a hand-copied
 * mirror of the registry; now there's nothing to keep in sync.)
 */
export const AESTHETIC_DEFAULT_VOICE_IDS: Record<BuiltInAestheticId, string> = {
  noir: AESTHETIC_DEFINITIONS.noir.voiceId,
  minimal: AESTHETIC_DEFINITIONS.minimal.voiceId,
  "cyber-fixer": AESTHETIC_DEFINITIONS["cyber-fixer"].voiceId,
  "nostromo-console": AESTHETIC_DEFINITIONS["nostromo-console"].voiceId,
  "gothic-manor": AESTHETIC_DEFINITIONS["gothic-manor"].voiceId,
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

/**
 * Resolve the per-preset prosody direction (stability/style/speed/similarity),
 * falling back to noir for custom/unknown ids. Used by the TTS route as the
 * fallback layer before the global ELEVENLABS_CONFIG.
 */
export function getVoiceDirection(aestheticId: AestheticId | undefined): VoiceDirection {
  if (aestheticId && isBuiltInAestheticId(aestheticId)) {
    return AESTHETIC_DEFINITIONS[aestheticId].identity.voiceDirection;
  }
  return AESTHETIC_DEFINITIONS.noir.identity.voiceDirection;
}

/**
 * Per-preset voice preview line for VoiceCustomization. Falls back to noir.
 */
export function getVoicePreviewLine(aestheticId: AestheticId | undefined): string {
  if (aestheticId && isBuiltInAestheticId(aestheticId)) {
    return AESTHETIC_DEFINITIONS[aestheticId].identity.voicePreviewLine;
  }
  return AESTHETIC_DEFINITIONS.noir.identity.voicePreviewLine;
}
