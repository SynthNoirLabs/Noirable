/**
 * Client-safe accessors for the per-preset identity layer (copy, music presets,
 * sample prompts, glow strength). These read AESTHETIC_DEFINITIONS, so any
 * client component can theme its chrome without touching the server-only
 * registry. Custom profiles resolve through their baseAestheticId.
 */
import { isBuiltInAestheticId } from "./types";
import type {
  AestheticCopy,
  AestheticId,
  Atmosphere,
  AudioEventMap,
  EffectsProfile,
  ImageStyleSpec,
  MotionPersonality,
  MusicPreset,
  StyleTokens,
} from "./types";
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

/**
 * Visual style tokens (radius / border / header case). Falls back to noir.
 */
export function getStyleTokens(aestheticId: AestheticId | undefined): StyleTokens {
  return getAestheticDefinition(aestheticId).identity.styleTokens;
}

/**
 * Material + screen effects profile (card material, stamp, screen, bloom).
 */
export function getEffectsProfile(aestheticId: AestheticId | undefined): EffectsProfile {
  return getAestheticDefinition(aestheticId).identity.effects;
}

/**
 * Ambient atmosphere block (particle/lightning/vignette colors + intensities).
 */
export function getAtmosphere(aestheticId: AestheticId | undefined): Atmosphere {
  return getAestheticDefinition(aestheticId).identity.atmosphere;
}

/**
 * Motion personality (entrance + image-reveal character).
 */
export function getMotionPersonality(aestheticId: AestheticId | undefined): MotionPersonality {
  return getAestheticDefinition(aestheticId).identity.motion;
}

/**
 * Structured image spec (preferred over the flat imageStylePrompt).
 */
export function getImageSpec(aestheticId: AestheticId | undefined): ImageStyleSpec {
  return getAestheticDefinition(aestheticId).identity.imageSpec;
}

/**
 * Semantic-event → SFX mapping for the reactive audio bus.
 */
export function getAudioEvents(aestheticId: AestheticId | undefined): AudioEventMap {
  return getAestheticDefinition(aestheticId).identity.audioEvents;
}

/**
 * Base composition seed for a preset (offset per variant for "Take 1/2/3").
 */
export function getCompositionSeed(aestheticId: AestheticId | undefined): number {
  return getAestheticDefinition(aestheticId).identity.compositionSeed;
}
