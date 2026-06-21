import { NextRequest } from "next/server";
import { Buffer } from "node:buffer";
import { isBuiltInAestheticId } from "@/lib/aesthetic/types";
import { getAestheticDefinition } from "@/lib/aesthetic/definitions";
import {
  readSfxFile,
  saveSfxFile,
  deleteSfxFile,
  isSfxKind,
  type SfxKind,
} from "@/lib/ai/sfxStore";

export const runtime = "nodejs";

/**
 * Lazy generated world foley — the audio twin of the deferred-image pipeline.
 *
 * A world's audio pack may point its srcs at `/api/sfx/<world>/<kind>` instead
 * of a recorded asset (grand-hotel does; AI worlds can). On first request the
 * world's `sfxPrompts.<kind>` is rendered through the ElevenLabs text-to-SFX
 * API, cached to disk, and served immutable. Without an ELEVENLABS_API_KEY (or
 * on failure) the request redirects to the noir fallback asset so audio never
 * hard-breaks.
 *
 * `?regen=1` busts the cache and re-renders the sound.
 */

/** Per-kind generation shape: clip length + whether it should loop cleanly. */
const KIND_CONFIG: Record<SfxKind, { durationSeconds: number; loop: boolean; fallback: string }> = {
  typewriter: { durationSeconds: 1.5, loop: false, fallback: "/assets/noir/typewriter.mp3" },
  thunder: { durationSeconds: 4, loop: false, fallback: "/assets/noir/thunder.mp3" },
  phone: { durationSeconds: 3, loop: false, fallback: "/assets/noir/phone-ring.mp3" },
  ambient: { durationSeconds: 20, loop: true, fallback: "/assets/noir/rain-loop.wav" },
  crackle: { durationSeconds: 12, loop: true, fallback: "/assets/noir/vinyl-crackle.wav" },
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ world: string; kind: string }> }
): Promise<Response> {
  const { world, kind } = await params;
  // The route accepts `<kind>` or `<kind>.mp3` (audio elements like a real ext).
  const cleanKind = (kind ?? "").replace(/\.mp3$/, "");
  if (!isBuiltInAestheticId(world) || !isSfxKind(cleanKind)) {
    return new Response("Not found", { status: 404 });
  }
  const config = KIND_CONFIG[cleanKind];
  const regen = request.nextUrl.searchParams.get("regen") === "1";

  if (regen) {
    await deleteSfxFile(world, cleanKind);
  } else {
    const cached = await readSfxFile(world, cleanKind);
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

  const prompt = getAestheticDefinition(world).identity.sfxPrompts[cleanKind];
  const apiKey = process.env.ELEVENLABS_API_KEY;

  if (apiKey && prompt) {
    try {
      const response = await fetch("https://api.elevenlabs.io/v1/sound-generation", {
        method: "POST",
        headers: { "Content-Type": "application/json", "xi-api-key": apiKey },
        body: JSON.stringify({
          text: prompt,
          duration_seconds: config.durationSeconds,
          prompt_influence: 0.5,
          ...(config.loop ? { loop: true } : {}),
        }),
      });
      if (response.ok) {
        const data = Buffer.from(await response.arrayBuffer());
        await saveSfxFile(world, cleanKind, data);
        return new Response(new Uint8Array(data), {
          status: 200,
          headers: {
            "Content-Type": "audio/mpeg",
            "Cache-Control": "public, max-age=31536000, immutable",
          },
        });
      }
      console.error(
        `[sfx] generation failed for ${world}/${cleanKind}:`,
        response.status,
        await response.text().catch(() => "")
      );
    } catch (error) {
      console.error(`[sfx] generation error for ${world}/${cleanKind}:`, error);
    }
  }

  // No key / generation failed — fall back to the recorded noir asset so the
  // event still makes a sound. Temporary redirect: a later request retries
  // generation instead of caching the fallback forever.
  return Response.redirect(new URL(config.fallback, request.nextUrl.origin), 307);
}
