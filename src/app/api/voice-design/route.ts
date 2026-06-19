import "server-only";

import { elevenLabsFetch } from "@/lib/elevenlabs/client";
import { apiSecurityCheck } from "@/lib/api/security";
import { apiError, parseJsonBody } from "@/lib/api/responses";

/**
 * POST /api/voice-design — mint a brand-new ElevenLabs voice from a text
 * description (the Voice Design API), so an AI-generated world can SPEAK as
 * itself instead of borrowing a preset's voice.
 *
 * Two-step upstream flow: design (returns ephemeral previews) → create (saves
 * the first preview as a permanent voice). Returns { voiceId }.
 */

interface VoiceDesignRequest {
  /** The voice's character, e.g. "a weary baritone with a slight rasp". */
  description?: string;
  /** Display name for the saved voice (the world's name). */
  name?: string;
}

export async function POST(request: Request): Promise<Response> {
  const securityError = apiSecurityCheck(request);
  if (securityError) return securityError;

  const body = await parseJsonBody<VoiceDesignRequest>(request);

  const description = body?.description?.trim() ?? "";
  const name = (body?.name?.trim() || "Generated World Voice").slice(0, 80);
  // The design endpoint requires a reasonably specific description.
  if (description.length < 20) {
    return apiError("Voice description must be at least 20 characters.", 400);
  }

  if (!process.env.ELEVENLABS_API_KEY) {
    return apiError("Missing ELEVENLABS_API_KEY", 503);
  }

  try {
    // 1. Design: generate voice previews from the description.
    const designRes = await elevenLabsFetch("/text-to-voice/design", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        voice_description: description.slice(0, 1000),
        model_id: "eleven_multilingual_ttv_v2",
        auto_generate_text: true,
      }),
    });
    if (!designRes.ok) {
      const detail = await designRes.text().catch(() => "");
      console.error("[voice-design] design failed:", designRes.status, detail);
      return apiError("Voice design failed", designRes.status);
    }
    const design = (await designRes.json()) as {
      previews?: Array<{ generated_voice_id?: string }>;
    };
    const generatedVoiceId = design.previews?.[0]?.generated_voice_id;
    if (!generatedVoiceId) {
      return apiError("Voice design returned no previews", 502);
    }

    // 2. Create: persist the first preview as a permanent voice.
    const createRes = await elevenLabsFetch("/text-to-voice", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        voice_name: name,
        voice_description: description.slice(0, 1000),
        generated_voice_id: generatedVoiceId,
      }),
    });
    if (!createRes.ok) {
      const detail = await createRes.text().catch(() => "");
      console.error("[voice-design] create failed:", createRes.status, detail);
      return apiError("Voice creation failed", createRes.status);
    }
    const created = (await createRes.json()) as { voice_id?: string };
    if (!created.voice_id) {
      return apiError("Voice creation returned no id", 502);
    }

    return Response.json({ voiceId: created.voice_id });
  } catch (error) {
    console.error("[voice-design] error:", error);
    return apiError("Voice design failed", 500);
  }
}
