import "server-only";
import crypto from "node:crypto";

import { ELEVENLABS_CONFIG } from "@/lib/elevenlabs/config";
import { apiSecurityCheck } from "@/lib/api/security";
import { readRecordingFile, saveRecordingBuffer } from "@/lib/ai/recordingStore";
import { getAestheticProfile } from "@/lib/aesthetic/registry";
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
}

export async function POST(request: Request) {
  const securityError = apiSecurityCheck(request);
  if (securityError) return securityError;

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "Missing ELEVENLABS_API_KEY" },
      { status: 503, statusText: "ElevenLabs not configured" }
    );
  }

  let body: TTSRequest | null = null;
  try {
    body = (await request.json()) as TTSRequest;
  } catch {
    body = null;
  }

  const rawText = body?.text?.trim() ?? "";
  if (!rawText) {
    return Response.json({ error: "Missing text" }, { status: 400 });
  }

  const text = rawText.length > MAX_TTS_CHARS ? `${rawText.slice(0, MAX_TTS_CHARS)}...` : rawText;

  let defaultVoiceId = ELEVENLABS_CONFIG.voiceId;
  if (body?.aestheticId) {
    const profile = getAestheticProfile(body.aestheticId as AestheticId);
    if (profile?.voiceId) {
      defaultVoiceId = profile.voiceId;
    }
  }

  const voiceId = body?.voiceSettings?.voiceId ?? body?.voiceId ?? defaultVoiceId;
  const stability = body?.voiceSettings?.stability ?? ELEVENLABS_CONFIG.stability;
  const similarityBoost = body?.voiceSettings?.similarityBoost ?? ELEVENLABS_CONFIG.similarityBoost;
  const style = body?.voiceSettings?.style ?? ELEVENLABS_CONFIG.style;
  const speed = body?.voiceSettings?.speed ?? ELEVENLABS_CONFIG.speed;

  // Compute a unique hash of the speech parameters
  const hash = crypto
    .createHash("sha256")
    .update(JSON.stringify({ text, voiceId, stability, similarityBoost, style, speed }))
    .digest("hex");

  // Check if we have this audio cached locally
  const cachedAudio = await readRecordingFile(hash);
  if (cachedAudio) {
    return new Response(new Uint8Array(cachedAudio), {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=31536000, immutable",
        "x-recording-hash": hash,
      },
    });
  }

  let response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": apiKey,
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text,
        model_id: ELEVENLABS_CONFIG.model,
        voice_settings: {
          stability,
          similarity_boost: similarityBoost,
          style,
          speed,
        },
      }),
    }
  );

  if (!response.ok && voiceId !== ELEVENLABS_CONFIG.voiceId) {
    try {
      const clone = response.clone();
      const errText = await clone.text();
      if (errText.includes("voice_not_found")) {
        console.warn(
          `Voice ID ${voiceId} not found. Falling back to default voice ID: ${ELEVENLABS_CONFIG.voiceId}`
        );
        response = await fetch(
          `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_CONFIG.voiceId}?output_format=mp3_44100_128`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "xi-api-key": apiKey,
              Accept: "audio/mpeg",
            },
            body: JSON.stringify({
              text,
              model_id: ELEVENLABS_CONFIG.model,
              voice_settings: {
                stability,
                similarity_boost: similarityBoost,
                style,
                speed,
              },
            }),
          }
        );
      }
    } catch (e) {
      console.error("Failed to fallback voice:", e);
    }
  }

  if (!response.ok) {
    const errorText = await response.text();
    return Response.json(
      { error: "ElevenLabs TTS failed", details: errorText },
      { status: response.status }
    );
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
