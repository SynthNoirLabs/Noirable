import "server-only";

import { ELEVENLABS_CONFIG } from "@/lib/elevenlabs/config";
import { apiSecurityCheck } from "@/lib/api/security";

const MAX_TTS_CHARS = 520;

interface TTSRequest {
  text?: string;
  voiceSettings?: {
    voiceId?: string;
    stability?: number;
    similarityBoost?: number;
    style?: number;
    speed?: number;
  };
}

export async function POST(request: Request) {
  const securityError = await apiSecurityCheck(request);
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

  // Strip ASCII control characters except common whitespace (\t, \n, \r) and
  // the DEL byte. Leaves regular printable text and unicode unchanged.
  // eslint-disable-next-line no-control-regex
  const sanitized = (body?.text ?? "").replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "").trim();
  if (!sanitized) {
    return Response.json({ error: "Missing text" }, { status: 400 });
  }

  const text =
    sanitized.length > MAX_TTS_CHARS ? `${sanitized.slice(0, MAX_TTS_CHARS)}...` : sanitized;

  const voiceId = body?.voiceSettings?.voiceId ?? ELEVENLABS_CONFIG.voiceId;
  const stability = body?.voiceSettings?.stability ?? ELEVENLABS_CONFIG.stability;
  const similarityBoost = body?.voiceSettings?.similarityBoost ?? ELEVENLABS_CONFIG.similarityBoost;
  const style = body?.voiceSettings?.style ?? ELEVENLABS_CONFIG.style;
  const speed = body?.voiceSettings?.speed ?? ELEVENLABS_CONFIG.speed;

  const response = await fetch(
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

  if (!response.ok) {
    const errorText = await response.text();
    return Response.json(
      { error: "ElevenLabs TTS failed", details: errorText },
      { status: response.status }
    );
  }

  const audioBuffer = await response.arrayBuffer();
  return new Response(audioBuffer, {
    status: 200,
    headers: {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "no-store",
    },
  });
}
