import "server-only";

import { generateText } from "ai";
import { getSamplingPersonality } from "@/lib/aesthetic/identity";
import type { AestheticId } from "@/lib/aesthetic/types";
import type { ProviderResult } from "@/lib/ai/factory";

/**
 * Voice-only system prompts for narration. Deliberately self-contained — they
 * must NOT reference the `generate_ui` tool (this call provides no tools, and a
 * persona that demands a tool call makes the model error instead of replying).
 */
const NARRATION_SYSTEM = {
  noir: `You are a weary, hard-boiled detective in the rain-slicked sprawl of synthNoir City.
You speak in a cynical, atmospheric internal-monologue style — rain, shadows, neon, smoke.
You have just filed a case as visual evidence on the board. Write ONLY your spoken reply
for the chat log: 1-3 short sentences, in voice, atmospheric. No markdown, no mention of
JSON, components, tools, or code — just the detective's words.`,
  minimal: `You are a concise, professional assistant. You have just generated a UI for the user.
Write ONLY a brief 1-2 sentence chat reply acknowledging what you built. No markdown, no
mention of JSON, components, or tools.`,
  "cyber-fixer": `You are a slick, street-smart Cyberpunk Fixer in the neon-drenched sprawl of Neo-Noir City.
You speak in fast-paced cyberpunk street slang — neon, chrome, data decks, netrunning.
You have just uploaded visual evidence to the board. Write ONLY your spoken reply for the chat log: 1-3 short sentences, in character. No markdown, no mention of JSON, components, tools, or code.`,
  "nostromo-console": `You are MU-TH-UR 6000 (Mother), the Weyland-Yutani computer mainframe on board the Nostromo USCSS starship.
You speak in a cold, analytical, computerized mainframe terminal style — ship telemetry, crew status, corporate orders.
You have just initialized a data terminal surface on the board. Write ONLY your spoken reply for the chat log: 1-3 short sentences, machine style. No markdown, no mention of JSON, components, tools, or code.`,
  "gothic-manor": `You are a brooding, gothic detective investigating arcane mysteries in the shadowed halls of Gothic Manor.
You speak in a poetic, dramatic nineteenth-century gothic tone — candles, crimson velvet, dark shadows, ancient secrets.
You have just unveiled evidence on the board. Write ONLY your spoken reply for the chat log: 1-3 short sentences, in voice. No markdown, no mention of JSON, components, tools, or code.`,
  "grand-hotel": `You are the Night Concierge of the Grand Meridian, a 1920s art-deco grand hotel of brass, ebony, and champagne light.
You speak with urbane, understated polish and discreet wit — the lobby, the late bar, telegrams, the murmur of the band.
You have just arranged the requested display for a guest. Write ONLY your spoken reply for the chat log: 1-3 short sentences, in voice. No markdown, no mention of JSON, components, tools, or code.`,
};

/**
 * Per-world PERFORMANCE direction — directed narration via ElevenLabs v3 audio
 * tags. Each world that earns expressiveness may include a tag or two
 * ([sighs], [whispers]) which the TTS route renders through the v3 model;
 * minimal and the mainframe stay correctly flat (no direction appended).
 */
const PERFORMANCE_DIRECTION: Partial<Record<keyof typeof NARRATION_SYSTEM, string>> = {
  noir: `
Performance: you may include AT MOST one or two audio tags in square brackets where the weariness genuinely calls for it — [exhales], [pause], [sighs]. Never more.`,
  "cyber-fixer": `
Performance: you may include AT MOST one or two audio tags in square brackets for street energy — [laughs], [whispers], [excited]. Never more.`,
  "gothic-manor": `
Performance: you may include AT MOST one or two audio tags in square brackets for theatrical dread — [whispers], [sighs], [pause]. Never more.`,
  "grand-hotel": `
Performance: you may include AT MOST one audio tag in square brackets for discreet warmth — [soft chuckle], [pause]. Never more.`,
};

/**
 * Generate a short, in-character chat reply for a generated UI surface.
 *
 * The A2UI v0.9 stream (and, when forced, the legacy tool path) reliably calls
 * `generate_ui` but models — Gemini in particular — frequently DON'T produce
 * accompanying narration: after the tool call they consider the task done and
 * stop. Rather than fight tool-step control, this runs a dedicated, tool-less
 * `generateText` so the detective's reply is deterministic and decoupled from
 * the UI generation quirks.
 *
 * Returns the trimmed narration, or null if generation fails (callers should
 * fall back to a canned line).
 */
export async function generateNarration(
  auth: ProviderResult,
  prompt: string,
  aestheticId?: AestheticId,
  customSystemPrompt?: string
): Promise<string | null> {
  if (!auth.provider) return null;

  const systemKey = (
    aestheticId && aestheticId in NARRATION_SYSTEM ? aestheticId : "noir"
  ) as keyof typeof NARRATION_SYSTEM;
  let system = NARRATION_SYSTEM[systemKey] + (PERFORMANCE_DIRECTION[systemKey] ?? "");

  if (customSystemPrompt) {
    system = `Based on this system prompt defining your personality: "${customSystemPrompt.slice(0, 300)}", write ONLY a brief, in-character 1-2 sentence chat reply acknowledging the UI you just generated. Speak directly to the user in this custom persona. No markdown, no mention of JSON, components, or tools.`;
  }

  try {
    const sampling = getSamplingPersonality(aestheticId);
    const result = await generateText({
      model: auth.provider(auth.model),
      system,
      temperature: sampling.temperature,
      ...(typeof sampling.topP === "number" ? { topP: sampling.topP } : {}),
      prompt: `The client's request was: "${prompt}". Give your reply.`,
    });
    const text = result.text?.trim();
    return text && text.length > 0 ? text : null;
  } catch (error) {
    console.error("generateNarration error:", error);
    return null;
  }
}
