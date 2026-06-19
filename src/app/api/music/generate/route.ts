import "server-only";

import { elevenLabsFetch } from "@/lib/elevenlabs/client";
import { apiSecurityCheck } from "@/lib/api/security";
import { apiError, parseJsonBody } from "@/lib/api/responses";
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

  const body = await parseJsonBody<MusicGenerateRequest>(request);

  const provider = body?.provider ?? "elevenlabs";
  const prompt = body?.prompt?.trim() ?? "";
  const durationMs = body?.durationMs ?? 30000;
  const usePro = body?.usePro ?? false;

  if (!prompt) {
    return apiError("Missing prompt", 400);
  }

  try {
    if (provider === "elevenlabs") {
      // Check API key before calling elevenLabsFetch
      if (!process.env.ELEVENLABS_API_KEY) {
        return apiError("Missing ELEVENLABS_API_KEY", 503);
      }
      // Call ElevenLabs Music Generation API
      const response = await elevenLabsFetch("/music", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
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
        return apiError("ElevenLabs music generation failed", response.status, {
          details: errorText,
        });
      }

      const audioBuffer = Buffer.from(await response.arrayBuffer());
      const saved = await saveMusicBuffer(audioBuffer, "audio/mpeg");
      if (!saved) {
        return apiError("Failed to save generated audio", 500);
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
        return apiError("Missing GOOGLE_GENERATIVE_AI_API_KEY or GEMINI_API_KEY", 503);
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
        return apiError("Google Lyria music generation failed", response.status, {
          details: errorText,
        });
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
        return apiError("Lyria response did not contain inline audio data", 500, { details: data });
      }

      const audioBuffer = Buffer.from(base64Data, "base64");
      const saved = await saveMusicBuffer(audioBuffer, mimeType);
      if (!saved) {
        return apiError("Failed to save generated audio", 500);
      }

      return Response.json({
        url: saved.url,
        prompt,
        provider: "lyria",
        createdAt: Date.now(),
      });
    } else {
      return apiError("Unsupported provider", 400);
    }
  } catch (error) {
    console.error("Music generation exception:", error);
    return apiError("Music generation failed", 500, { details: String(error) });
  }
}
