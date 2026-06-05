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
export type BuiltInAestheticId =
  | "noir"
  | "minimal"
  | "cyber-fixer"
  | "nostromo-console"
  | "gothic-manor";

// Custom profiles use prefixed IDs
export type CustomProfileId = `custom-${string}`;

// Update AestheticId to be union (REPLACE existing definition)
export type AestheticId = BuiltInAestheticId | CustomProfileId;

// Add type guards
export function isCustomProfileId(id: string): id is CustomProfileId {
  return id.startsWith("custom-");
}

export function isBuiltInAestheticId(id: string): id is BuiltInAestheticId {
  return (
    id === "noir" ||
    id === "minimal" ||
    id === "cyber-fixer" ||
    id === "nostromo-console" ||
    id === "gothic-manor"
  );
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
 * Per-preset ElevenLabs prosody direction. Resolved as the fallback layer
 * BEFORE the global ELEVENLABS_CONFIG, so each world speaks with its own
 * character (noir weary, nostromo flat-robotic, cyber amped, gothic theatrical,
 * minimal neutral). Explicit user voiceSettings still win over this.
 */
export interface VoiceDirection {
  stability: number;
  similarityBoost: number;
  style: number;
  speed: number;
}

/**
 * A quick-pick music-generation preset (label + prompt seed).
 */
export interface MusicPreset {
  icon: string;
  name: string;
  prompt: string;
}

/**
 * Per-preset chrome copy / microcopy. Drives the workspace labels and the
 * "pending" placeholders so a Nostromo session reads as a mainframe and a
 * Gothic session as a manuscript, instead of noir leaking everywhere.
 */
export interface AestheticCopy {
  /** Header of the JSON editor pane, e.g. "CASE FILE // JSON DATA" */
  editorTitle: string;
  /** Label on the main surface header, e.g. "Evidence Board" */
  workspaceTitle: string;
  /** Placeholder when a generated image hasn't arrived yet */
  imagePending: string;
  /** Placeholder when an audio clip hasn't loaded */
  audioPending: string;
  /** Placeholder when a video hasn't loaded */
  videoPending: string;
  /** Dictaphone/recorder panel title */
  dictaphoneTitle: string;
  /** Per-recording label, e.g. "Cassette Log" */
  dictaphoneItemLabel: string;
  /** Delete-recording tooltip, e.g. "Incinerate Tape" */
  dictaphoneDeleteLabel: string;
  /** Hint shown when no recording is loaded */
  dictaphoneEmptyHint: string;
}

/**
 * The data-driven identity layer that makes each preset feel like a different
 * world rather than a recolor. Pure data, client-safe; lives on the
 * AestheticDefinition and is consumed by renderers, CSS, audio, voice, image,
 * and copy alike.
 */
export interface AestheticIdentity {
  /** 0-1+ multiplier for desk-lamp glow / CRT bloom / scrollbar accent. */
  glowStrength: number;
  /** Per-preset ElevenLabs prosody direction. */
  voiceDirection: VoiceDirection;
  /** Default music-generation style prompt. */
  musicStylePrompt: string;
  /** Quick-pick music presets seeded into the composer. */
  musicPresets: MusicPreset[];
  /** Chrome copy / microcopy. */
  copy: AestheticCopy;
  /** Themed example prompts for the empty state. */
  samplePrompts: string[];
  /** Preview sentence used by VoiceCustomization. */
  voicePreviewLine: string;
  /** Layout doctrine appended to the persona prompt (per-preset composition). */
  layoutDoctrine: string;
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
  /** Default ElevenLabs voice ID for this preset */
  voiceId?: string;
  /** Default image style prompt for this preset */
  imageStylePrompt?: string;
  /** Data-driven identity layer (glow/voice/music/copy/samples/doctrine). */
  identity: AestheticIdentity;
}

/**
 * Client-safe, pure-data definition of a built-in aesthetic. This is the single
 * source of truth for everything that does NOT need the server-only persona
 * body: theme colors/fonts, audio pack, voice id, image style, terminology, and
 * the full identity layer. registry.ts (server-only) spreads this and attaches
 * the persona system prompt; audio-packs.ts / voice-defaults.ts /
 * ColorCustomization PRESET_COLORS all re-derive from these definitions so a
 * preset's literals live in exactly one place.
 */
export interface AestheticDefinition {
  id: BuiltInAestheticId;
  name: string;
  description: string;
  theme: ThemeConfig;
  audio: AudioPack;
  /** Optional terminology mappings, copied onto the persona at registry build. */
  terminology?: Record<string, string>;
  voiceId: string;
  imageStylePrompt: string;
  identity: AestheticIdentity;
}

/**
 * Registry type for all available aesthetic profiles.
 */
export type AestheticRegistry = Record<AestheticId, AestheticProfile>;
