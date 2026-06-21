import { NextRequest } from "next/server";
import { Buffer } from "node:buffer";
import { isBuiltInAestheticId } from "@/lib/aesthetic/types";
import { getAestheticDefinition } from "@/lib/aesthetic/definitions";
import { elevenLabsFetch } from "@/lib/elevenlabs/client";
import {
  readAtmosphereMusic,
  saveAtmosphereMusic,
  deleteAtmosphereMusic,
} from "@/lib/ai/atmosphereMusicStore";

export const runtime = "nodejs";

/** Recorded noir score served when generation is unavailable. */
const FALLBACK_MUSIC = "/assets/noir/noir-jazz-loop.mp3";

/**
 * Lazy generated per-world atmosphere music — the music twin of the SFX route.
 *
 * A world's music src may point at `/api/music/<world>/atmosphere` instead of a
 * recorded loop (grand-hotel does). On first request the world's
 * `identity.musicStylePrompt` is rendered through the ElevenLabs Music API,
 * cached to disk, and served immutable. Without an ELEVENLABS_API_KEY (or on
 * failure) the request redirects to the noir fallback loop so music never
 * hard-breaks.
 *
 * `?regen=1` busts the cache and re-renders the score.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ world: string }> }
): Promise<Response> {
  const { world } = await params;
  // The route accepts `<world>` or `<world>.mp3` (audio elements like a real ext).
  const cleanWorld = (world ?? "").replace(/\.mp3$/, "");
  if (!isBuiltInAestheticId(cleanWorld)) {
    return new Response("Not found", { status: 404 });
  }

  const regen = request.nextUrl.searchParams.get("regen") === "1";

  if (regen) {
    await deleteAtmosphereMusic(cleanWorld);
  } else {
    const cached = await readAtmosphereMusic(cleanWorld);
    if (cached) {
      return new Response(new Uint8Array(cached.data), {
        status: 200,
        headers: {
          "Content-Type": cached.contentType,
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    }
  }

  const prompt = getAestheticDefinition(cleanWorld).identity.musicStylePrompt;
  const apiKey = process.env.ELEVENLABS_API_KEY;

  if (apiKey && prompt) {
    try {
      const response = await elevenLabsFetch("/music", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          music_length_ms: 30000,
          force_instrumental: true,
        }),
      });
      if (response.ok) {
        const data = Buffer.from(await response.arrayBuffer());
        await saveAtmosphereMusic(cleanWorld, data);
        return new Response(new Uint8Array(data), {
          status: 200,
          headers: {
            "Content-Type": "audio/mpeg",
            "Cache-Control": "public, max-age=31536000, immutable",
          },
        });
      }
      console.error(
        `[atmosphere-music] generation failed for ${cleanWorld}:`,
        response.status,
        await response.text().catch(() => "")
      );
    } catch (error) {
      console.error(`[atmosphere-music] generation error for ${cleanWorld}:`, error);
    }
  }

  // No key / generation failed — fall back to the recorded noir loop so the
  // world still has a score. Temporary redirect: a later request retries
  // generation instead of caching the fallback forever.
  return Response.redirect(new URL(FALLBACK_MUSIC, request.nextUrl.origin), 307);
}
