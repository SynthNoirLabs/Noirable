/**
 * Aesthetic system type definitions.
 * These types are client-safe (no server-only import).
 * The registry implementation (registry.ts) is server-only.
 */

/**
 * Available aesthetic profile identifiers.
 * Each ID corresponds to a full AestheticProfile in the registry.
 */
// Keep existing for backwards compat
export type BuiltInAestheticId = "noir" | "minimal";

// Custom profiles use prefixed IDs
export type CustomProfileId = `custom-${string}`;

// Update AestheticId to be union (REPLACE existing definition)
export type AestheticId = BuiltInAestheticId | CustomProfileId;

// Add type guards
export function isCustomProfileId(id: string): id is CustomProfileId {
  return id.startsWith("custom-");
}

export function isBuiltInAestheticId(id: string): id is BuiltInAestheticId {
  return id === "noir" || id === "minimal";
}

/**
 * Sound effect configuration for a single effect.
 */
export interface SfxConfig {
  src: string;
  volume: number;
}

/**
 * Sound effect names available in the system.
 */
export type SfxName = "typewriter" | "thunder" | "phone";

/**
 * Music track configuration.
 */
export interface MusicConfig {
  src: string;
  volume: number;
}

/**
 * Ambient audio configuration (rain, crackle, etc).
 */
export interface AmbientAudioConfig {
  rain?: {
    src: string;
    /** Volume multipliers by intensity level */
    intensityVolume: {
      low: number;
      medium: number;
      high: number;
    };
  };
  crackle?: {
    src: string;
    volume: number;
  };
}

/**
 * Complete audio pack for an aesthetic profile.
 */
export interface AudioPack {
  sfx: Record<SfxName, SfxConfig>;
  music: MusicConfig;
  ambient: AmbientAudioConfig;
}

/**
 * Theme color tokens for visual styling.
 * These map to CSS variables (--aesthetic-*).
 */
export interface ThemeColors {
  background: string;
  surface: string;
  surfaceAlt: string;
  text: string;
  textMuted: string;
  accent: string;
  accentMuted: string;
  border: string;
  error: string;
}

/**
 * Theme font configuration.
 */
export interface ThemeFonts {
  body: string;
  mono: string;
  heading: string;
}

/**
 * Complete theme tokens for an aesthetic profile.
 */
export interface ThemeConfig {
  colors: ThemeColors;
  fonts: ThemeFonts;
}

/**
 * AI persona configuration for an aesthetic profile.
 */
export interface PersonaConfig {
  /** The system prompt defining the AI's personality and behavior */
  systemPrompt: string;
  /** Optional terminology mappings (e.g., "evidence" -> "data" for minimal) */
  terminology?: Record<string, string>;
}

/**
 * Complete aesthetic profile bundling theme, audio, and persona.
 *
 * @example
 * ```typescript
 * const noir: AestheticProfile = {
 *   id: "noir",
 *   name: "Noir Detective",
 *   description: "Hard-boiled detective aesthetic with amber accents",
 *   theme: { colors: {...}, fonts: {...} },
 *   audio: { sfx: {...}, music: {...}, ambient: {...} },
 *   persona: { systemPrompt: "..." },
 * };
 * ```
 */
export interface AestheticProfile {
  /** Unique identifier matching AestheticId */
  id: AestheticId;
  /** Human-readable name */
  name: string;
  /** Brief description of the aesthetic */
  description: string;
  /** Visual theme configuration */
  theme: ThemeConfig;
  /** Audio configuration (SFX, music, ambient) */
  audio: AudioPack;
  /** AI persona configuration */
  persona: PersonaConfig;
}

/**
 * Registry type for all available aesthetic profiles.
 */
export type AestheticRegistry = Record<AestheticId, AestheticProfile>;
