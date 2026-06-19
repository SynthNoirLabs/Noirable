import "server-only";
import crypto from "node:crypto";

import { ELEVENLABS_CONFIG } from "@/lib/elevenlabs/config";
import { elevenLabsFetch } from "@/lib/elevenlabs/client";
import { apiSecurityCheck } from "@/lib/api/security";
import { apiError, parseJsonBody } from "@/lib/api/responses";
import {
  readRecordingFile,
  saveRecordingBuffer,
  readRecordingAlignment,
  saveRecordingAlignment,
  type RecordingAlignment,
} from "@/lib/ai/recordingStore";
import { getAestheticProfile } from "@/lib/aesthetic/registry";
import { getVoiceDirection } from "@/lib/aesthetic/voice-defaults";
import type { AestheticId } from "@/lib/aesthetic/types";

const MAX_TTS_CHARS = 520;

interface TTSRequest {
  text?: string;
  aestheticId?: string;
  voiceId?: string;
  voiceSettings?: {
    voiceId?: string;
    stability?: number;
    similarityBoost?: number;
    style?: number;
    speed?: number;
  };
  /**
   * When true, render via the /with-timestamps endpoint and return JSON
   * { audioBase64, hash, alignment } with character-level timing — the client
   * uses it to land SFX cues on the exact spoken word.
   */
  withTimestamps?: boolean;
}

export async function POST(request: Request) {
  const securityError = apiSecurityCheck(request);
  if (securityError) return securityError;

  if (!process.env.ELEVENLABS_API_KEY) {
    return apiError("Missing ELEVENLABS_API_KEY", 503);
  }

  const body = await parseJsonBody<TTSRequest>(request);

  const rawText = body?.text?.trim() ?? "";
  if (!rawText) {
    return apiError("Missing text", 400);
  }

  const text = rawText.length > MAX_TTS_CHARS ? `${rawText.slice(0, MAX_TTS_CHARS)}...` : rawText;

  let defaultVoiceId = ELEVENLABS_CONFIG.voiceId;
  if (body?.aestheticId) {
    const profile = getAestheticProfile(body.aestheticId as AestheticId);
    if (profile?.voiceId) {
      defaultVoiceId = profile.voiceId;
    }
  }

  // Per-preset voice DIRECTION layer: explicit voiceSettings win, then the
  // preset's voiceDirection, then the single global ELEVENLABS_CONFIG. The
  // direction values are always defined (getVoiceDirection falls back to noir
  // for undefined/custom ids), so the trailing `?? ELEVENLABS_CONFIG` is just
  // belt-and-suspenders.
  const direction = getVoiceDirection(body?.aestheticId as AestheticId | undefined);

  const voiceId = body?.voiceSettings?.voiceId ?? body?.voiceId ?? defaultVoiceId;
  const stability =
    body?.voiceSettings?.stability ?? direction.stability ?? ELEVENLABS_CONFIG.stability;
  const similarityBoost =
    body?.voiceSettings?.similarityBoost ??
    direction.similarityBoost ??
    ELEVENLABS_CONFIG.similarityBoost;
  const style = body?.voiceSettings?.style ?? direction.style ?? ELEVENLABS_CONFIG.style;
  const rawSpeed = body?.voiceSettings?.speed ?? direction.speed ?? ELEVENLABS_CONFIG.speed;
  // `??` only substitutes for null/undefined; a non-numeric value would survive
  // as NaN and be sent to ElevenLabs / folded into the cache hash. Coerce.
  const numericSpeed =
    typeof rawSpeed === "number" && Number.isFinite(rawSpeed) ? rawSpeed : ELEVENLABS_CONFIG.speed;
  const speed = Math.max(0.7, Math.min(1.2, numericSpeed));

  // Directed narration (ElevenLabs v3 audio tags): when the text carries
  // performance tags like [sighs] / [whispers], render through the expressive
  // v3 model, which acts them out. v3 takes a DISCRETE stability
  // (creative/natural/robust), so the preset's value is snapped. If v3 is
  // unavailable for this key, the request falls back to the default model with
  // the tags stripped, so narration never breaks.
  const AUDIO_TAG_RE = /\[[a-z][a-z .,'-]{1,32}\]/i;
  const hasAudioTags = AUDIO_TAG_RE.test(text);
  const modelId = hasAudioTags ? "eleven_v3" : ELEVENLABS_CONFIG.model;
  const strippedText = text
    .replace(/\[[a-z][a-z .,'-]{1,32}\]/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();

  // Compute a unique hash of the speech parameters
  const hash = crypto
    .createHash("sha256")
    .update(JSON.stringify({ text, voiceId, stability, similarityBoost, style, speed, modelId }))
    .digest("hex");

  const withTimestamps = body?.withTimestamps === true;

  // Check if we have this audio cached locally
  const cachedAudio = await readRecordingFile(hash);
  if (cachedAudio) {
    if (withTimestamps) {
      const alignment = await readRecordingAlignment(hash);
      return Response.json({
        audioBase64: cachedAudio.toString("base64"),
        hash,
        alignment,
      });
    }
    return new Response(new Uint8Array(cachedAudio), {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=31536000, immutable",
        "x-recording-hash": hash,
      },
    });
  }

  const requestSpeech = (targetVoiceId: string, speechText: string, speechModel: string) => {
    // v3 takes a discrete stability and no speed/style knobs; the default
    // model keeps the full prosody direction.
    const voiceSettings =
      speechModel === "eleven_v3"
        ? { stability: stability < 0.25 ? 0 : stability < 0.75 ? 0.5 : 1 }
        : { stability, similarity_boost: similarityBoost, style, speed };
    const path = withTimestamps
      ? `/text-to-speech/${targetVoiceId}/with-timestamps?output_format=mp3_44100_128`
      : `/text-to-speech/${targetVoiceId}?output_format=mp3_44100_128`;
    return elevenLabsFetch(path, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: withTimestamps ? "application/json" : "audio/mpeg",
      },
      body: JSON.stringify({
        text: speechText,
        model_id: speechModel,
        voice_settings: voiceSettings,
      }),
    });
  };

  let response = await requestSpeech(voiceId, text, modelId);

  // v3 unavailable (no access / model rejection) — strip the performance tags
  // and read flat on the default model rather than failing the narration.
  if (!response.ok && hasAudioTags) {
    console.warn("eleven_v3 request failed; retrying without audio tags.");
    response = await requestSpeech(voiceId, strippedText, ELEVENLABS_CONFIG.model);
  }

  if (!response.ok && voiceId !== ELEVENLABS_CONFIG.voiceId) {
    try {
      const clone = response.clone();
      const errText = await clone.text();
      if (errText.includes("voice_not_found")) {
        console.warn(
          `Voice ID ${voiceId} not found. Falling back to default voice ID: ${ELEVENLABS_CONFIG.voiceId}`
        );
        response = await requestSpeech(
          ELEVENLABS_CONFIG.voiceId,
          hasAudioTags ? strippedText : text,
          ELEVENLABS_CONFIG.model
        );
      }
    } catch (e) {
      console.error("Failed to fallback voice:", e);
    }
  }

  if (!response.ok) {
    const errorText = await response.text();
    return apiError("ElevenLabs TTS failed", response.status, { details: errorText });
  }

  if (withTimestamps) {
    // The /with-timestamps endpoint returns JSON: base64 audio + per-character
    // alignment. Persist both (audio + sidecar) so replays keep exact timing.
    const payload = (await response.json()) as {
      audio_base64?: string;
      alignment?: {
        characters?: string[];
        character_start_times_seconds?: number[];
        character_end_times_seconds?: number[];
      };
    };
    if (!payload.audio_base64) {
      return apiError("ElevenLabs returned no audio", 502);
    }
    const buffer = Buffer.from(payload.audio_base64, "base64");
    await saveRecordingBuffer(hash, buffer);
    let alignment: RecordingAlignment | null = null;
    if (payload.alignment?.characters && payload.alignment.character_start_times_seconds) {
      alignment = {
        characters: payload.alignment.characters,
        characterStartTimesSeconds: payload.alignment.character_start_times_seconds,
        characterEndTimesSeconds: payload.alignment.character_end_times_seconds ?? [],
      };
      await saveRecordingAlignment(hash, alignment);
    }
    return Response.json({ audioBase64: payload.audio_base64, hash, alignment });
  }

  const audioBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(audioBuffer);

  // Cache on disk
  await saveRecordingBuffer(hash, buffer);

  return new Response(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "no-store",
      "x-recording-hash": hash,
    },
  });
}
