import { getDefaultVoiceId } from "@/lib/aesthetic/voice-defaults";
import type { GeneratedProfile } from "@/lib/ai/theme-generator";

/**
 * Offline, hand-curated "Surprise Me" worlds.
 *
 * These are full coherent themes — palette + font pair + effects + persona +
 * image style — built as pure data so the Lab can hand a user a finished world
 * with NO API key and NO network call. They use the SAME shape the AI generator
 * emits (`GeneratedProfile`), so the UI can persist either through the identical
 * createProfile -> updateProfile path. Each seed leaves `voice.voiceId` unset;
 * `pickSurpriseProfile` resolves it from the base preset's default voice so the
 * curated list never hard-codes ElevenLabs ids.
 *
 * Deliberately deterministic: no module-scope RNG. The caller passes an index
 * (or a seed it derives) so renders are reproducible and testable.
 */

/** A curated seed minus the voice id, which is resolved on pick. */
type SurpriseSeed = Omit<GeneratedProfile, "voice"> & {
  voice?: Omit<NonNullable<GeneratedProfile["voice"]>, "voiceId">;
};

const SURPRISE_SEEDS: readonly SurpriseSeed[] = [
  {
    name: "Sunken Cathedral",
    description: "Drowned gothic halls lit by bioluminescent candlelight.",
    baseAestheticId: "gothic-manor",
    colors: {
      background: "#080b12",
      surface: "#10151f",
      surfaceAlt: "#1b2330",
      text: "#e6ecf5",
      textMuted: "#8a97ab",
      accent: "#3fd2c7",
      accentMuted: "#1f6e6a",
      border: "#222c3a",
      error: "#ff5d6c",
    },
    fonts: { body: "serif", heading: "serif" },
    effects: { rain: 0.2, fog: 0.7, crackle: 0.1, typewriterSpeed: 55 },
    imageStylePrompt:
      "submerged gothic cathedral, teal bioluminescent light, drifting silt, cold cinematic underwater haze, baroque stone arches, no text or watermark",
    systemPrompt:
      "You speak as the keeper of a drowned cathedral — solemn, hushed, and reverent. Every reply feels like it echoes off wet stone. Be poetic but never verbose.",
  },
  {
    name: "Neon Bazaar",
    description: "A rain-soaked night market wired with chrome and signage.",
    baseAestheticId: "cyber-fixer",
    colors: {
      background: "#0a0712",
      surface: "#160c26",
      surfaceAlt: "#271646",
      text: "#f4ecff",
      textMuted: "#9a82bf",
      accent: "#ff4fd8",
      accentMuted: "#7a2fae",
      border: "#3a1f66",
      error: "#ff4d4d",
    },
    fonts: { body: "system", heading: "mono" },
    effects: { rain: 0.5, fog: 0.3, crackle: 0.25, typewriterSpeed: 22 },
    imageStylePrompt:
      "neon night bazaar, magenta and cyan signage, rain-slick pavement reflections, dense cyberpunk crowd, volumetric haze, cinematic, no text or watermark",
    systemPrompt:
      "You speak like a fast-talking night-market fixer — slick, streetwise, and a little conspiratorial. Trade in fragments of slang and never waste a word.",
  },
  {
    name: "Salt Flat Noon",
    description: "Bleached desert minimalism under a flat white sun.",
    baseAestheticId: "minimal",
    colors: {
      background: "#fbfaf6",
      surface: "#f1efe7",
      surfaceAlt: "#e3e0d4",
      text: "#1f1d18",
      textMuted: "#6b675c",
      accent: "#c4622d",
      accentMuted: "#9a4d23",
      border: "#ddd9cc",
      error: "#b91c1c",
    },
    fonts: { body: "system", heading: "system" },
    effects: { rain: 0, fog: 0.05, crackle: 0, typewriterSpeed: 18 },
    imageStylePrompt:
      "vast cracked salt flat at high noon, bleached minimal palette, single rust-orange accent, harsh flat sunlight, wide negative space, no text or watermark",
    systemPrompt:
      "You speak with arid clarity — plain, unhurried, and exact. No ornament, no shadows. Say only what is needed.",
  },
  {
    name: "Amber Stakeout",
    description: "Classic rain-noir with warm amber desk light.",
    baseAestheticId: "noir",
    colors: {
      background: "#0f0d0a",
      surface: "#1b1712",
      surfaceAlt: "#2b241a",
      text: "#f0e6d2",
      textMuted: "#a99a7d",
      accent: "#ffb347",
      accentMuted: "#b5812f",
      border: "#2d261b",
      error: "#9a2b2b",
    },
    fonts: { body: "typewriter", heading: "serif" },
    effects: { rain: 0.6, fog: 0.4, crackle: 0.4, typewriterSpeed: 38 },
    imageStylePrompt:
      "1940s noir stakeout, warm amber desk lamp glow, rain on the window, heavy film grain, low-key chiaroscuro, 35mm, no text or watermark",
    systemPrompt:
      "You speak as a weary detective on a long stakeout — cynical, atmospheric, and dry. Internal-monologue cadence, never more than a few sentences.",
  },
  {
    name: "Green Phosphor",
    description: "A retro mainframe terminal humming in the dark.",
    baseAestheticId: "nostromo-console",
    colors: {
      background: "#020804",
      surface: "#05160b",
      surfaceAlt: "#0a2815",
      text: "#39ff7a",
      textMuted: "#1f9d49",
      accent: "#39ff7a",
      accentMuted: "#ff9900",
      border: "#0d3b1f",
      error: "#ff3300",
    },
    fonts: { body: "mono", heading: "mono" },
    effects: { rain: 0, fog: 0.1, crackle: 0.5, typewriterSpeed: 14 },
    imageStylePrompt:
      "retro green-phosphor CRT terminal, scanlines, monochrome green glow, dim engineering bay, analog hardware, no text or watermark",
    systemPrompt:
      "You speak as a ship's mainframe — cold, analytical, and precise. Report in clipped machine cadence. No warmth, no flourish.",
  },
];

/** Number of curated worlds available. */
export const SURPRISE_PROFILE_COUNT = SURPRISE_SEEDS.length;

/**
 * Return one curated world, selected by a caller-supplied index. The index is
 * taken modulo the seed count so any integer (e.g. a click counter or a derived
 * seed) maps to a valid world. Resolves the base preset's default voice so the
 * returned profile is immediately playable.
 */
export function pickSurpriseProfile(index: number): GeneratedProfile {
  const safeIndex =
    ((Math.trunc(index) % SURPRISE_PROFILE_COUNT) + SURPRISE_PROFILE_COUNT) %
    SURPRISE_PROFILE_COUNT;
  const seed = SURPRISE_SEEDS[safeIndex];

  return {
    ...seed,
    voice: { ...seed.voice, voiceId: getDefaultVoiceId(seed.baseAestheticId) },
  };
}
