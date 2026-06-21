import "server-only";

import { Buffer } from "node:buffer";
import { generateText } from "ai";
import { getProviderWithOverrides, type ModelOverride } from "@/lib/ai/factory";
import { getSamplingPersonality } from "@/lib/aesthetic/identity";
import { saveMusicBuffer } from "@/lib/ai/musicStore";
import { apiSecurityCheck } from "@/lib/api/security";
import { apiError, parseJsonBody } from "@/lib/api/responses";
import type { AestheticId } from "@/lib/aesthetic/types";

/**
 * POST /api/interrogation — a generated TWO-VOICE interrogation recording.
 *
 * 1. The chat model writes a short DETECTIVE ↔ SUSPECT dialogue in the active
 *    world's register.
 * 2. Gemini's multi-speaker TTS reads it with two distinct prebuilt voices in
 *    ONE generated clip (returned as raw 24kHz PCM, wrapped into a WAV here).
 * 3. The clip is persisted to the music store and returned as a playable url
 *    alongside the script, for the dictaphone.
 */

interface InterrogationRequest {
  /** The suspect's name (the second speaker). */
  suspect?: string;
  /** Optional subject of the questioning. */
  topic?: string;
  aestheticId?: string;
  modelConfig?: ModelOverride;
}

const TTS_MODEL = process.env.AI_TTS_MODEL ?? "gemini-2.5-flash-preview-tts";
/** Two clearly-distinct prebuilt Gemini voices. */
const DETECTIVE_VOICE = "Charon";
const SUSPECT_VOICE = "Kore";

/** Wrap raw 16-bit mono PCM in a WAV container (Gemini TTS returns bare PCM). */
function wavFromPcm(pcm: Buffer, sampleRate = 24000): Buffer {
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16); // PCM chunk size
  header.writeUInt16LE(1, 20); // PCM format
  header.writeUInt16LE(1, 22); // mono
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * 2, 28); // byte rate (16-bit mono)
  header.writeUInt16LE(2, 32); // block align
  header.writeUInt16LE(16, 34); // bits per sample
  header.write("data", 36);
  header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]);
}

export async function POST(request: Request): Promise<Response> {
  const securityError = apiSecurityCheck(request);
  if (securityError) return securityError;

  const body = await parseJsonBody<InterrogationRequest>(request);
  const suspect = body?.suspect?.trim() || "The Suspect";
  const topic = body?.topic?.trim() || "where they were last night";
  const aestheticId = body?.aestheticId as AestheticId | undefined;

  const googleKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;
  if (!googleKey) {
    return apiError("Interrogations need GOOGLE_GENERATIVE_AI_API_KEY", 503);
  }

  // 1. The script — terse, in-world, strictly speaker-prefixed lines.
  let auth;
  try {
    auth = getProviderWithOverrides(body?.modelConfig);
  } catch {
    return apiError("No AI provider configured", 500);
  }
  if (!auth.provider) {
    return apiError("No AI provider configured", 500);
  }

  let script: string;
  try {
    const sampling = getSamplingPersonality(aestheticId);
    const result = await generateText({
      model: auth.provider(auth.model),
      temperature: sampling.temperature,
      system: `You write terse interrogation-room dialogue for an atmospheric detective fiction. Output ONLY dialogue lines, strictly alternating, 6 to 8 lines total, each on its own line in exactly this format:
Detective: <line>
${suspect}: <line>
No stage directions, no markdown, no extra text.`,
      prompt: `The detective questions ${suspect} about ${topic}. The suspect is evasive but lets one detail slip.`,
    });
    script = result.text.trim();
  } catch (error) {
    console.error("[interrogation] script generation failed:", error);
    return apiError("Script generation failed", 502);
  }
  if (!script) {
    return apiError("Script generation returned nothing", 502);
  }

  // 2. Multi-speaker TTS — one clip, two voices.
  try {
    const ttsRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${TTS_MODEL}:generateContent`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": googleKey },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `TTS the following conversation:\n${script}` }] }],
          generationConfig: {
            responseModalities: ["AUDIO"],
            speechConfig: {
              multiSpeakerVoiceConfig: {
                speakerVoiceConfigs: [
                  {
                    speaker: "Detective",
                    voiceConfig: { prebuiltVoiceConfig: { voiceName: DETECTIVE_VOICE } },
                  },
                  {
                    speaker: suspect,
                    voiceConfig: { prebuiltVoiceConfig: { voiceName: SUSPECT_VOICE } },
                  },
                ],
              },
            },
          },
        }),
      }
    );
    if (!ttsRes.ok) {
      const detail = await ttsRes.text().catch(() => "");
      console.error("[interrogation] TTS failed:", ttsRes.status, detail);
      return apiError("Multi-speaker TTS failed", 502, { script });
    }
    const payload = (await ttsRes.json()) as {
      candidates?: Array<{
        content?: { parts?: Array<{ inlineData?: { data?: string; mimeType?: string } }> };
      }>;
    };
    const inline = payload.candidates?.[0]?.content?.parts?.find(
      (p) => p.inlineData?.data
    )?.inlineData;
    if (!inline?.data) {
      return apiError("TTS returned no audio", 502, { script });
    }

    // Gemini returns raw PCM (audio/L16;rate=24000); wrap it for <audio>.
    const pcm = Buffer.from(inline.data, "base64");
    const rateMatch = /rate=(\d+)/.exec(inline.mimeType ?? "");
    const wav = wavFromPcm(pcm, rateMatch ? Number(rateMatch[1]) : 24000);
    const saved = await saveMusicBuffer(wav, "audio/wav");
    if (!saved) {
      return apiError("Could not persist the recording", 500, { script });
    }
    return Response.json({ url: saved.url, script, suspect });
  } catch (error) {
    console.error("[interrogation] error:", error);
    return apiError("Interrogation failed", 500, { script });
  }
}
