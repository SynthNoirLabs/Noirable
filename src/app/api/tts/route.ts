import "server-only";

import { ELEVENLABS_CONFIG } from "@/lib/elevenlabs/config";

const MAX_TTS_CHARS = 520;

export async function POST(request: Request) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "Missing ELEVENLABS_API_KEY" },
      { status: 503, statusText: "ElevenLabs not configured" }
    );
  }

  let body: { text?: string } | null = null;
  try {
    body = (await request.json()) as { text?: string };
  } catch {
    body = null;
  }

  const rawText = body?.text?.trim() ?? "";
  if (!rawText) {
    return Response.json({ error: "Missing text" }, { status: 400 });
  }

  const text = rawText.length > MAX_TTS_CHARS ? `${rawText.slice(0, MAX_TTS_CHARS)}...` : rawText;

  const response = await fetch(
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
          stability: ELEVENLABS_CONFIG.stability,
          similarity_boost: ELEVENLABS_CONFIG.similarityBoost,
          style: ELEVENLABS_CONFIG.style,
          speed: ELEVENLABS_CONFIG.speed,
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
