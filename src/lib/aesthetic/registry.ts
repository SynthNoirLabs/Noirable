import "server-only";

import type { AestheticId, AestheticProfile, AestheticRegistry } from "./types";
import { AESTHETIC_DEFINITIONS } from "./definitions";
import { getPersonaPrompt } from "./personas";

// =============================================================================
// REGISTRY
// =============================================================================

/**
 * Build a full server-side profile from a client-safe definition by attaching
 * the server-only persona system-prompt body. Everything else (theme, audio,
 * voiceId, imageStylePrompt, identity, terminology) flows straight from the
 * single source of truth in definitions.ts, so a preset's literals live in
 * exactly one place.
 */
function buildProfile(id: keyof typeof AESTHETIC_DEFINITIONS): AestheticProfile {
  const def = AESTHETIC_DEFINITIONS[id];
  return {
    id: def.id,
    name: def.name,
    description: def.description,
    theme: def.theme,
    audio: def.audio,
    persona: {
      systemPrompt: getPersonaPrompt(def.id),
      terminology: def.terminology,
    },
    voiceId: def.voiceId,
    imageStylePrompt: def.imageStylePrompt,
    identity: def.identity,
  };
}

/**
 * Registry of all available aesthetic profiles.
 */
export const AESTHETIC_REGISTRY: AestheticRegistry = {
  noir: buildProfile("noir"),
  minimal: buildProfile("minimal"),
  "cyber-fixer": buildProfile("cyber-fixer"),
  "nostromo-console": buildProfile("nostromo-console"),
  "gothic-manor": buildProfile("gothic-manor"),
};

/**
 * Default aesthetic ID used when none is specified.
 */
export const DEFAULT_AESTHETIC_ID: AestheticId = "noir";

/**
 * Get an aesthetic profile by ID.
 * Returns undefined if the ID is not found.
 */
export function getAestheticProfile(id: AestheticId): AestheticProfile | undefined {
  return AESTHETIC_REGISTRY[id];
}

/**
 * Get an aesthetic profile by ID, falling back to default if not found.
 */
export function getAestheticProfileOrDefault(id: AestheticId | undefined): AestheticProfile {
  if (!id) return AESTHETIC_REGISTRY[DEFAULT_AESTHETIC_ID];
  return AESTHETIC_REGISTRY[id] ?? AESTHETIC_REGISTRY[DEFAULT_AESTHETIC_ID];
}

/**
 * Get all available aesthetic IDs.
 */
export function getAvailableAesthetics(): AestheticId[] {
  return Object.keys(AESTHETIC_REGISTRY) as AestheticId[];
}

/**
 * Get all aesthetic profiles as an array.
 */
export function getAllAestheticProfiles(): AestheticProfile[] {
  return Object.values(AESTHETIC_REGISTRY);
}

/**
 * Check if an aesthetic ID is valid.
 */
export function isValidAestheticId(id: string): id is AestheticId {
  return id in AESTHETIC_REGISTRY;
}
