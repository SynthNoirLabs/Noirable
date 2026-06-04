import "server-only";

import { apiSecurityCheck } from "@/lib/api/security";
import { saveMusicBuffer } from "@/lib/ai/musicStore";

interface MusicGenerateRequest {
  provider?: "elevenlabs" | "lyria";
  prompt?: string;
  durationMs?: number;
  usePro?: boolean;
}

export async function POST(request: Request) {
  const securityError = apiSecurityCheck(request);
  if (securityError) return securityError;

  let body: MusicGenerateRequest | null = null;
  try {
    body = (await request.json()) as MusicGenerateRequest;
  } catch {
    body = null;
  }

  const provider = body?.provider ?? "elevenlabs";
  const prompt = body?.prompt?.trim() ?? "";
  const durationMs = body?.durationMs ?? 30000;
  const usePro = body?.usePro ?? false;

  if (!prompt) {
    return Response.json({ error: "Missing prompt" }, { status: 400 });
  }

  try {
    if (provider === "elevenlabs") {
      const apiKey = process.env.ELEVENLABS_API_KEY;
      if (!apiKey) {
        return Response.json(
          { error: "Missing ELEVENLABS_API_KEY" },
          { status: 503, statusText: "ElevenLabs not configured" }
        );
      }

      // Call ElevenLabs Music Generation API
      const response = await fetch("https://api.elevenlabs.io/v1/music", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": apiKey,
        },
        body: JSON.stringify({
          prompt,
          music_length_ms: durationMs,
          force_instrumental: true,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("ElevenLabs music generation failed:", errorText);
        return Response.json(
          { error: "ElevenLabs music generation failed", details: errorText },
          { status: response.status }
        );
      }

      const audioBuffer = Buffer.from(await response.arrayBuffer());
      const saved = await saveMusicBuffer(audioBuffer, "audio/mpeg");
      if (!saved) {
        return Response.json({ error: "Failed to save generated audio" }, { status: 500 });
      }

      return Response.json({
        url: saved.url,
        prompt,
        provider: "elevenlabs",
        createdAt: Date.now(),
      });
    } else if (provider === "lyria") {
      const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return Response.json(
          { error: "Missing GOOGLE_GENERATIVE_AI_API_KEY or GEMINI_API_KEY" },
          { status: 503, statusText: "Gemini API key not configured" }
        );
      }

      const modelId = usePro ? "lyria-3-pro-preview" : "lyria-3-clip-preview";
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`;

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Google Lyria generation failed:", errorText);
        return Response.json(
          { error: "Google Lyria music generation failed", details: errorText },
          { status: response.status }
        );
      }

      const data = await response.json();
      const candidate = data.candidates?.[0];
      const parts = candidate?.content?.parts;
      let base64Data: string | null = null;
      let mimeType = "audio/mp3";

      if (parts && Array.isArray(parts)) {
        for (const part of parts) {
          if (part.inlineData) {
            base64Data = part.inlineData.data;
            mimeType = part.inlineData.mimeType || mimeType;
            break;
          }
        }
      }

      if (!base64Data) {
        console.error("Lyria response did not contain inline audio data:", JSON.stringify(data));
        return Response.json(
          { error: "Lyria response did not contain inline audio data", details: data },
          { status: 500 }
        );
      }

      const audioBuffer = Buffer.from(base64Data, "base64");
      const saved = await saveMusicBuffer(audioBuffer, mimeType);
      if (!saved) {
        return Response.json({ error: "Failed to save generated audio" }, { status: 500 });
      }

      return Response.json({
        url: saved.url,
        prompt,
        provider: "lyria",
        createdAt: Date.now(),
      });
    } else {
      return Response.json({ error: "Unsupported provider" }, { status: 400 });
    }
  } catch (error) {
    console.error("Music generation exception:", error);
    return Response.json(
      { error: "Music generation failed", details: String(error) },
      { status: 500 }
    );
  }
}
