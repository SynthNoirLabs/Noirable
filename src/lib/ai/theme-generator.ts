import "server-only";

import { generateText, tool } from "ai";
import { z } from "zod";
import {
  profileColorsSchema,
  profileFontsSchema,
  profileAudioSchema,
  profileVoiceSchema,
  profileEffectsSchema,
  profileAtmosphereSchema,
} from "@/lib/customization/types";
import { contrastRatio, nudgeToAA, normalizeHex } from "@/lib/customization/contrast";
import type { CustomProfile } from "@/lib/customization/types";
import { getDefaultVoiceId } from "@/lib/aesthetic/voice-defaults";
import { BUILT_IN_AESTHETIC_IDS } from "@/lib/aesthetic/types";
import type { BuiltInAestheticId } from "@/lib/aesthetic/types";
import type { ProviderResult } from "@/lib/ai/factory";

/**
 * The slice of a CustomProfile the model is allowed to author. We omit the
 * store-owned fields (`id`/`createdAt`/`updatedAt`) — the client mints those
 * when it persists the profile — and `backgroundImageUrl` (uploaded, not
 * generated). Everything else mirrors `customProfileSchema` field-for-field so
 * a generated theme drops straight into `updateProfile`.
 */
export type GeneratedProfile = Pick<
  CustomProfile,
  | "name"
  | "description"
  | "baseAestheticId"
  | "colors"
  | "fonts"
  | "audio"
  | "voice"
  | "effects"
  | "atmosphere"
  | "imageStylePrompt"
  | "systemPrompt"
> & {
  /**
   * Free-text description of the world's VOICE (e.g. "a weary baritone with a
   * slight rasp, speaks slowly"). Not part of the stored profile — the client
   * sends it to /api/voice-design to MINT a real ElevenLabs voice for the
   * world, then stores the returned voiceId.
   */
  voiceDescription?: string;
};

/**
 * The base preset the model picks as scaffolding. Mirrors the
 * `baseAestheticId` enum of `customProfileSchema` so the generated profile
 * inherits a coherent audio/effects/voice foundation it only needs to tweak.
 */
const baseAestheticIdSchema = z
  .enum(BUILT_IN_AESTHETIC_IDS)
  .describe(
    "The CLOSEST built-in preset to use as scaffolding so audio, effects, and voice inherit sensibly: 'noir' (dark detective, amber accents, rain/jazz), 'minimal' (clean light, neutral), 'cyber-fixer' (neon cyberpunk, magenta/cyan), 'nostromo-console' (retro green-phosphor terminal), 'gothic-manor' (dark Victorian gothic, crimson), 'grand-hotel' (1920s art-deco, brass and champagne gold). Pick the one whose mood is nearest the requested vibe."
  );

/**
 * Generation-only palette schema (Copilot review C7). The SHARED
 * `profileColorsSchema` makes every color optional — correct for profile editing
 * (a user may override just one swatch) but it lets the model emit `colors: {}`
 * and produce a base-identical "generated" theme. For generation we require the
 * four legibility-critical anchors so the model is forced to actually author a
 * palette; the rest stay optional and inherit the chosen base preset.
 */
const generatedColorsSchema = profileColorsSchema.extend({
  background: z.string(),
  surface: z.string(),
  text: z.string(),
  accent: z.string(),
});

/**
 * Tool the model fills to author a full custom profile from a free-text vibe.
 * The inputSchema mirrors `customProfileSchema` minus the store-owned id/time
 * fields. Required: name + baseAestheticId. Everything else is an OPTIONAL
 * override layered on top of the inherited base preset — the model should only
 * emit the fields it actually wants to change so the rest stays coherent.
 */
export const themeGeneratorTool = tool({
  description:
    "Author a complete, internally-coherent custom visual+audio theme ('world') from a free-text vibe description. " +
    "REQUIRED fields: `name` (short, evocative title) and `baseAestheticId` (the closest built-in preset used as scaffolding). " +
    "OPTIONAL overrides (emit only what you want to change from the base preset): " +
    "`colors` — a full, internally-coherent palette where text on background and surface meets WCAG AA legibility (contrast >= 4.5:1); " +
    "`fonts` — a body/heading pair from system|serif|typewriter|mono that suits the mood; " +
    "`voice` — a prosody descriptor (stability/similarityBoost/style 0-1, speed 0.7-1.2); a `voiceId` is OPTIONAL and only useful if you know a specific ElevenLabs id, otherwise omit it and the app inherits the base preset's voice; " +
    "`effects` — rain/fog/crackle intensities (0-1) and typewriterSpeed (ms/char) matching the atmosphere; " +
    "`imageStylePrompt` — a vivid one-line image-generation style for any pictures in this world; " +
    "`systemPrompt` — the PERSONA VOICE ONLY (how the assistant speaks/thinks in this world). Do NOT include UI-generation or component instructions: the app appends its own immutable UI directives at runtime. " +
    "`description` — a one-line summary of the world. " +
    "Make every field reinforce the same mood so the result feels like one coherent place.",
  inputSchema: z.object({
    name: z
      .string()
      .min(1)
      .max(50)
      .describe("Short, evocative theme name (e.g. 'Sunken Cathedral', 'Neon Bazaar')."),
    description: z.string().max(200).optional().describe("One-line summary of the world's mood."),
    baseAestheticId: baseAestheticIdSchema,
    colors: generatedColorsSchema.describe(
      "REQUIRED coherent palette (hex / rgb() / hsl()). Must include at least background, surface, text, and accent — invent a real palette, do not omit it. Ensure text vs background and text vs surface meet WCAG AA (>= 4.5:1)."
    ),
    fonts: profileFontsSchema
      .optional()
      .describe("Body + heading font presets from system|serif|typewriter|mono."),
    audio: profileAudioSchema
      .optional()
      .describe("Optional ambient/music/sfx volume tweaks (0-1)."),
    voice: profileVoiceSchema
      .optional()
      .describe(
        "Persona prosody: stability/similarityBoost/style (0-1), speed (0.7-1.2). Leave voiceId out unless you know a specific ElevenLabs id."
      ),
    voiceDescription: z
      .string()
      .min(20)
      .max(400)
      .optional()
      .describe(
        "A vivid description of the world's SPEAKING VOICE (age, timbre, pace, accent, mood — e.g. 'a weary baritone with a slight rasp, speaks slowly like he's seen too much'). The app mints a real voice from it."
      ),
    effects: profileEffectsSchema
      .optional()
      .describe("Visual effect intensities: rain/fog/crackle (0-1), typewriterSpeed (ms/char)."),
    atmosphere: profileAtmosphereSchema
      .optional()
      .describe(
        "The world's WEATHER: particle ('rain'|'fog'|'grain'|'ember'|'none'), an optional secondary fog (boolean), and the particleColor/lightningColor (hex) the overlays render in. Pick what the vibe implies — golden motes for a temple, cyan rain for a flooded city."
      ),
    imageStylePrompt: z
      .string()
      .max(500)
      .optional()
      .describe("Vivid one-line image-generation style for pictures in this world."),
    systemPrompt: z
      .string()
      .max(3000)
      .optional()
      .describe(
        "PERSONA VOICE ONLY — how the assistant speaks and thinks. No UI/component instructions; the app appends those at runtime."
      ),
  }),
});

/**
 * Build the deterministic mock profile returned in E2E mode (and as a graceful
 * fallback). Keyed loosely off the prompt so tests can assert the vibe carries
 * through, but always a valid, self-coherent theme that needs no API key.
 */
function buildMockProfile(prompt: string, baseAestheticId?: BuiltInAestheticId): GeneratedProfile {
  const lower = prompt.toLowerCase();
  const base: BuiltInAestheticId =
    baseAestheticId ??
    (lower.includes("neon") || lower.includes("cyber")
      ? "cyber-fixer"
      : lower.includes("gothic") || lower.includes("vampire")
        ? "gothic-manor"
        : lower.includes("terminal") || lower.includes("retro")
          ? "nostromo-console"
          : lower.includes("clean") || lower.includes("bright")
            ? "minimal"
            : "noir");

  const trimmed = prompt.trim();
  const name = trimmed.length > 0 ? trimmed.slice(0, 50) : "Generated World";

  return {
    name,
    description: "A mock world generated without an AI provider.",
    baseAestheticId: base,
    colors: {
      background: "#0d0d12",
      surface: "#181820",
      surfaceAlt: "#26262f",
      text: "#ececf2",
      textMuted: "#9a9aa6",
      accent: "#8ab4ff",
      accentMuted: "#5a78b0",
      border: "#2c2c36",
      error: "#ff5c5c",
    },
    fonts: { body: "serif", heading: "system" },
    voice: { stability: 0.4, similarityBoost: 0.5, style: 0.5, speed: 0.95 },
    effects: { rain: 0.3, fog: 0.4, crackle: 0.2, typewriterSpeed: 40 },
    imageStylePrompt: `atmospheric concept art capturing the mood of "${name}", cinematic lighting, rich detail, no text or watermark`,
    systemPrompt: `You speak in a voice that embodies the world of "${name}". Stay in character: evocative, atmospheric, and concise.`,
  };
}

/**
 * Server-side validation schema mirroring the tool inputSchema. Kept separate
 * from the `tool()` so route handlers can hand-validate the raw tool args
 * before trusting them.
 */
const generatedProfileSchema = z.object({
  name: z.string().min(1).max(50),
  description: z.string().max(200).optional(),
  baseAestheticId: z.enum(BUILT_IN_AESTHETIC_IDS),
  colors: profileColorsSchema.optional(),
  fonts: profileFontsSchema.optional(),
  audio: profileAudioSchema.optional(),
  voice: profileVoiceSchema.optional(),
  effects: profileEffectsSchema.optional(),
  atmosphere: profileAtmosphereSchema.optional(),
  voiceDescription: z.string().max(400).optional(),
  imageStylePrompt: z.string().max(500).optional(),
  systemPrompt: z.string().max(3000).optional(),
});

/**
 * Validate a model-emitted profile against the customization schemas and
 * resolve a usable voice. Unknown/blank `voiceId`s fall back to the base
 * preset's default (via voice-defaults) so the generated voice is always
 * playable. Returns null if the required fields don't validate.
 */
export function normalizeGeneratedProfile(raw: unknown): GeneratedProfile | null {
  const result = generatedProfileSchema.safeParse(raw);
  if (!result.success) return null;

  const data = result.data;
  const voice = data.voice ?? {};
  const resolvedVoiceId =
    voice.voiceId && voice.voiceId.trim().length > 0
      ? voice.voiceId
      : getDefaultVoiceId(data.baseAestheticId);

  return {
    ...data,
    colors: data.colors ? enforcePaletteLegibility(data.colors) : data.colors,
    voice: { ...voice, voiceId: resolvedVoiceId },
  };
}

/**
 * Programmatic legibility guardrail: the GENERATOR_SYSTEM asks for WCAG AA in
 * prose, but a model can and will emit a moody #1a1a2e-on-#16161f palette that
 * validates fine and reads terribly. Nudge `text` (and `textMuted`) until they
 * clear AA against both the background and the surface. Hex-only — non-hex
 * values (rgb()/hsl()) pass through untouched, since nudgeToAA operates on hex.
 */
function enforcePaletteLegibility<T extends { [key: string]: string | undefined }>(colors: T): T {
  const next: Record<string, string | undefined> = { ...colors };
  const fixAgainst = (fgKey: string, bgKeys: string[], largeText = false) => {
    let fg = next[fgKey];
    if (!fg || !normalizeHex(fg)) return;
    for (const bgKey of bgKeys) {
      const bg = next[bgKey];
      if (!bg || !normalizeHex(bg)) continue;
      const threshold = largeText ? 3 : 4.5;
      if (contrastRatio(fg, bg) < threshold) {
        fg = nudgeToAA(fg, bg, largeText);
      }
    }
    next[fgKey] = fg;
  };
  fixAgainst("text", ["background", "surface"]);
  // Muted text is secondary/larger-context copy; hold it to the AA-large bar so
  // it stays visibly muted while remaining readable.
  fixAgainst("textMuted", ["background", "surface"], true);
  return next as T;
}

/**
 * System prompt for the generator call. Frames the model as a world-builder and
 * reinforces the two hard rules: coherence + AA legibility, and that the
 * authored systemPrompt is a PERSONA voice only (the app owns UI directives).
 */
const GENERATOR_SYSTEM = `You are a master world-builder for an AI workspace that can adopt fully themed "worlds".
Given a short vibe description, design ONE internally-coherent world by calling the theme_generator tool exactly once.
Rules:
- Pick the closest built-in base preset so audio/effects/voice inherit a sensible foundation; override only what the vibe demands.
- Produce a palette where body text is comfortably legible on the background and surface (WCAG AA, contrast >= 4.5:1). Never pair low-contrast text with its background.
- Make the font pair, palette, effects, atmosphere, image style, voiceDescription, and persona all reinforce the SAME mood.
- The systemPrompt you author is the persona's SPEAKING VOICE only. Do NOT write UI, layout, or component instructions there — the application appends its own immutable UI-generation directives at runtime.`;

export interface GenerateThemeOptions {
  /** Caller-suggested base preset; passed through to the mock and as a hint. */
  baseAestheticId?: BuiltInAestheticId;
}

/**
 * Generate a custom profile from a free-text vibe.
 *
 * Forces the `theme_generator` tool (like the chat/a2ui routes force
 * `generate_ui`) and validates the emitted args against the customization
 * schemas. Honors E2E mode and a missing provider by returning a deterministic
 * mock so CI needs no API key. Returns a validated partial CustomProfile, or
 * throws if the provider errors or the model emits an unusable shape.
 */
export async function generateTheme(
  auth: ProviderResult,
  prompt: string,
  opts: GenerateThemeOptions = {}
): Promise<GeneratedProfile> {
  // Deterministic path for CI / no-key dev — never touches the network.
  if (auth.type === "mock" || !auth.provider || process.env.E2E === "1") {
    return buildMockProfile(prompt, opts.baseAestheticId);
  }

  const hint = opts.baseAestheticId
    ? ` The user suggested starting from the "${opts.baseAestheticId}" preset; honor it unless the vibe clearly fits another.`
    : "";

  const result = await generateText({
    model: auth.provider(auth.model),
    system: GENERATOR_SYSTEM,
    prompt: `Design a world for this vibe: "${prompt.trim()}".${hint}`,
    tools: { theme_generator: themeGeneratorTool },
    toolChoice: { type: "tool", toolName: "theme_generator" },
  });

  const call = result.toolCalls.find((c) => c.toolName === "theme_generator");
  const profile = normalizeGeneratedProfile(call?.input);
  if (!profile) {
    throw new Error("Theme generation returned an invalid profile shape.");
  }

  return profile;
}
