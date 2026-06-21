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
  | "gothic-manor"
  | "grand-hotel";

/**
 * Runtime list mirroring BuiltInAestheticId — the one place to extend when
 * adding a world. The zod enums in tools.ts / theme-generator.ts and the
 * isBuiltInAestheticId guard all derive from it.
 */
export const BUILT_IN_AESTHETIC_IDS = [
  "noir",
  "minimal",
  "cyber-fixer",
  "nostromo-console",
  "gothic-manor",
  "grand-hotel",
] as const;

// Custom profiles use prefixed IDs
export type CustomProfileId = `custom-${string}`;

// Update AestheticId to be union (REPLACE existing definition)
export type AestheticId = BuiltInAestheticId | CustomProfileId;

// Add type guards
export function isCustomProfileId(id: string): id is CustomProfileId {
  return id.startsWith("custom-");
}

export function isBuiltInAestheticId(id: string): id is BuiltInAestheticId {
  return (BUILT_IN_AESTHETIC_IDS as readonly string[]).includes(id);
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
  /** Label inside the loading skeleton's image placeholder, e.g. "Generating..." */
  loadingImageLabel: string;
  /** Status line under the loading skeleton's typing indicator, e.g. "Compiling evidence" */
  loadingStatus: string;
  /** Empty-state headline, e.g. "Case File // Unopened" */
  emptyTitle: string;
  /** Empty-state body copy explaining what to do, in-world. */
  emptyBody: string;
  /** Label over the clickable sample prompts, e.g. "Leads to pursue" */
  emptyLeadsLabel: string;
  /** Footer hint pointing at the chat input, e.g. "Begin in the Interrogation Log" */
  emptyHint: string;
  /** Caption prefix for a developed image, e.g. "Exhibit" / "IMG" / "Plate" */
  exhibitLabel: string;
  /** World-arrival title card headline, e.g. "USCSS NOSTROMO" */
  arrivalTitle: string;
  /** World-arrival title card tagline, e.g. "MU-TH-UR 6000 ONLINE" */
  arrivalTagline: string;
  /** Chat header title, e.g. "INTERROGATION LOG" / "TRANSMISSION LOG". */
  logTitle: string;
  /**
   * Rotating in-character "the AI is generating" lines shown in the chat loader.
   * One is picked per generation (by index), so the loader reads in-world.
   */
  thinkingLines: string[];
  /** Empty chat state line, e.g. "No record found. Begin interrogation." */
  chatEmptyLine: string;
  /** Shown when TTS is unavailable, e.g. "Wire dead — set ELEVENLABS_API_KEY". */
  ttsUnavailableLine: string;
  /** Dictaphone "no tape loaded" slot label, e.g. "NO TAPE MOUNTED". */
  dictaphoneEmpty: string;
  /** Header over the archived-recordings list, e.g. "Archived Tape Cassettes". */
  dictaphoneArchiveTitle: string;
  /** Hint inside the empty-archive box, e.g. "No cassettes recorded." */
  dictaphoneArchiveHint: string;
  /** Secondary hint under the empty archive, e.g. "Click play on a chat message…". */
  dictaphoneArchiveSubhint: string;
  /** Two-voice recorder section title, e.g. "Interrogation Room". */
  interrogationTitle: string;
  /** Recorder input placeholder, e.g. "Suspect's name". */
  interrogationPlaceholder: string;
  /** Recorder in-progress button label, e.g. "On the wire…". */
  interrogationRecordingLine: string;
  /** Recorder idle/start button label, e.g. "Interrogate". */
  interrogationActionLine: string;
}

/**
 * Visual style tokens — decouple palette (colors) from treatment (shape/case).
 * Emitted as CSS vars at the layout root so renderers read one set of tokens
 * instead of branching on the aesthetic id. (Bigger Bet 2.)
 */
export interface StyleTokens {
  /** Card / control border radius, e.g. "2px" (noir, sharp) … "10px" (minimal, soft). */
  radius: string;
  /** Border treatment for cards and panels. */
  borderStyle: "sharp" | "soft" | "beveled" | "double";
  /** Case transform applied to surface headings. */
  headerCase: "uppercase" | "titlecase" | "normal";
}

/**
 * Declarative material + screen effects, emitted as `data-effect-*` attributes
 * on the layout root so globals.css can light up the right card material
 * (parchment / hologram / wireframe / paper) and screen treatment (scanlines /
 * phosphor) without per-aesthetic CSS duplication. (Bigger Bet 2.)
 */
export interface EffectsProfile {
  /** Card material treatment (drives `[data-effect-card="…"]` rules). */
  card: "paper" | "parchment" | "hologram" | "wireframe" | "flat" | "gilded";
  /** Decorative stamp / seal on cards. */
  stamp: "wax" | "digital" | "blood" | "none";
  /** Full-surface screen treatment (drives `[data-effect-screen="…"]`). */
  screen: "scanlines" | "phosphor" | "none";
  /** 0–1+ bloom intensity for accent glows. */
  bloom: number;
}

/**
 * Per-preset atmosphere block driving the ambient overlays (rain / fog /
 * lightning / vignette). Re-skins the previously noir-hardcoded blue rain and
 * white flash from CSS vars so every world's weather matches it. (Bigger Bet 3.)
 */
export interface Atmosphere {
  /** Dominant particle system for the ambient layer. */
  particle: "rain" | "fog" | "grain" | "ember" | "none";
  /**
   * Secondary fog haze layered UNDER the dominant particle. Lets a world have
   * embers AND fog (gothic) instead of one-or-the-other. The user's fog toggle
   * still gates it. Defaults to false when omitted.
   */
  fog?: boolean;
  /** Particle color (CSS color) — fed to `--aesthetic-particle-color`. */
  particleColor: string;
  /** Lightning / arrival-flash color (CSS color). */
  lightningColor: string;
  /** Vignette tint (CSS color). */
  vignetteColor: string;
  /** 0–1 vignette darkness multiplier. */
  vignetteIntensity: number;
  /** 0–1+ flash/lightning frequency & intensity multiplier (0 = no flash). */
  lightningFrequency: number;
}

/**
 * Motion personality — how the generated surface materializes and how images
 * develop. Drives the framer-motion staggered Reveal in SurfaceRenderer and the
 * PhotoDeveloper reveal keyframe set. All gated by prefers-reduced-motion at the
 * consumer. (Bigger Bet 3.)
 */
export interface MotionPersonality {
  /** Entrance style for surface children. */
  entrance: "cinematic" | "crisp" | "glitch" | "terminal" | "candle" | "waltz";
  /** Per-child reveal duration in ms. */
  durationMs: number;
  /** Stagger between sibling children in ms. */
  staggerMs: number;
  /** CSS/framer easing for the reveal. */
  easing: string;
  /** Which PhotoDeveloper reveal keyframe set this world uses. */
  imageReveal: "darkroom" | "crisp" | "scanline" | "raster" | "candle" | "flashbulb";
}

/**
 * Structured image spec assembled into an ordered positive prompt + a true
 * negative prompt, with rotating motifs for intra-preset variety. Additive: the
 * flat `imageStylePrompt` string stays as the fallback/back-compat form; image
 * generation prefers this spec when present. (Bigger Bet 7.)
 */
export interface ImageStyleSpec {
  /** Medium / format, e.g. "1940s black-and-white evidence photograph, 35mm film". */
  medium: string;
  /** Lighting description. */
  lighting: string;
  /** Color palette description. */
  palette: string;
  /** Lens / optics description. */
  lens: string;
  /** Framing / composition description. */
  framing: string;
  /** True-negative terms, threaded to the provider's negative prompt when supported. */
  negative: string[];
  /** Rotating motifs — one is selected per image by index for coherent variety. */
  motifs: string[];
  /**
   * Default aspect ratio ("w:h") for this world's images when the component
   * variant doesn't imply one (header → wide, avatar → square). Lets the
   * doctrines' "wide HUD banner" / "portrait beside the text" actually happen.
   */
  aspect?: string;
}

/**
 * Maps semantic generation events to SFX names, replacing the noir-only English
 * keyword scan so every preset is reactive. Keys are optional; an unset event
 * simply fires nothing. (Bigger Bet 4.)
 */
export interface AudioEventMap {
  "message.start"?: SfxName;
  "message.complete"?: SfxName;
  "component.placed"?: SfxName;
  error?: SfxName;
  "dramatic.beat"?: SfxName;
  /** Fired once when the user switches into this world (the arrival sting). */
  "world.arrived"?: SfxName;
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
  /** Visual style tokens (shape/case), decoupled from palette. (Bet 2.) */
  styleTokens: StyleTokens;
  /** Material + screen effects profile, emitted as data-effect-* attrs. (Bet 2.) */
  effects: EffectsProfile;
  /** Ambient atmosphere block driving the overlays. (Bet 3.) */
  atmosphere: Atmosphere;
  /** Motion personality — entrance + image-reveal character. (Bet 3.) */
  motion: MotionPersonality;
  /** Structured image spec; preferred over the flat imageStylePrompt. (Bet 7.) */
  imageSpec: ImageStyleSpec;
  /** Base layout-composition seed; offset per variant for "Take 1/2/3". (Bet 6.) */
  compositionSeed: number;
  /**
   * The world's personality expressed as SAMPLING parameters: the mainframe
   * generates rigidly and repeatably (low temperature), the gothic narrator
   * florid and varied (high). Threaded into the UI-generation and narration
   * calls.
   */
  sampling: { temperature: number; topP?: number };
  /**
   * Text-to-SFX prompts for this world's foley (ElevenLabs sound generation).
   * Worlds with recorded assets keep them as the regeneration recipe; worlds
   * without (grand-hotel) point their audio srcs at /api/sfx/<world>/<kind>
   * and the route renders these lazily. `ambient` and `crackle` are looping
   * beds (the "rain" and "crackle" channels); the rest are one-shot cues.
   */
  sfxPrompts: {
    typewriter: string;
    thunder: string;
    phone: string;
    ambient: string;
    crackle: string;
  };
  /** Semantic-event → SFX mapping for the reactive audio bus. (Bet 4.) */
  audioEvents: AudioEventMap;
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
  /** Preferred image-generation model id for this preset (optional). (Bet 7.) */
  imageModel?: string;
  identity: AestheticIdentity;
}

/**
 * Registry type for all available aesthetic profiles.
 */
export type AestheticRegistry = Record<AestheticId, AestheticProfile>;
