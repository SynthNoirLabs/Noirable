import "server-only";

import { getImageSpec } from "@/lib/aesthetic/identity";
import { getModelInfo } from "@/lib/ai/model-registry";
import type { AestheticId } from "@/lib/aesthetic/types";

/**
 * Direct REST integration for Google Veo text→video generation.
 *
 * Veo is a LONG-RUNNING operation: start → poll the operation → download the
 * finished clip (up to a few minutes).
 *
 * Why direct REST instead of the AI SDK? The SDK does have video generation
 * (`experimental_generateVideo`, which lists Veo models), but it doesn't fit
 * here: (1) it is NOT present in our installed `ai@6.0.41` / `@ai-sdk/google@3.0.10`
 * (no `generateVideo` export, no `google.video()`); (2) `generateVideo` is
 * synchronous — it awaits the entire multi-minute generation, which would hang
 * a serverless function (our start→poll→download split is exactly what avoids
 * that timeout); and (3) its Veo path goes through the AI Gateway string form
 * (`google/veo-…`), whereas we authenticate Google directly with the same key
 * as images. If a future SDK upgrade exposes an operation-handle (non-blocking)
 * video API, this can be revisited.
 *
 * Invoked ONLY on demand (Video Lab / explicit per-component button) — never
 * bundled into UI/chat generation the way images are — because each clip is
 * comparatively expensive.
 */

const BASE_URL = "https://generativelanguage.googleapis.com/v1beta";
// Default to Veo 3.1 Fast — the current generation (3.0-fast is slated for
// discontinuation). NOTE the id is PREVIEW-suffixed: the real Gemini id is
// `veo-3.1-fast-generate-preview` (there is NO `veo-3.1-fast-generate-001` — a
// wrong id 404s on predictLongRunning). `veo-3.0-fast-generate-001` stays
// registered as the stable fallback. Override with AI_VIDEO_MODEL.
const DEFAULT_VIDEO_MODEL = "veo-3.1-fast-generate-preview";

/** Aspect ratios Veo accepts; anything else is dropped to the provider default. */
const VEO_ASPECTS = new Set(["16:9", "9:16"]);

/**
 * Max "asset" reference images Veo 3.1 accepts in one request (subject/character
 * consistency). Extra images beyond this are dropped.
 */
const MAX_REFERENCE_IMAGES = 3;

/** A reference image already resolved to inline base64 bytes, ready for Veo. */
export interface VideoReferenceImage {
  base64: string;
  mimeType: string;
}

/**
 * Hosts the finished-clip download URI is allowed to point at. The URI comes
 * from Google's authenticated Veo response, but we still constrain it (host +
 * https) before fetching with the API key, so a compromised/malformed response
 * can never exfiltrate the key to an arbitrary or internal host (SSRF guard).
 */
const ALLOWED_VIDEO_HOSTS = [
  "generativelanguage.googleapis.com",
  "storage.googleapis.com",
  "googleusercontent.com",
];

function isAllowedVideoUri(videoUri: string): boolean {
  try {
    const url = new URL(videoUri);
    if (url.protocol !== "https:") return false;
    return ALLOWED_VIDEO_HOSTS.some(
      (host) => url.hostname === host || url.hostname.endsWith(`.${host}`)
    );
  } catch {
    return false;
  }
}

export function getVideoApiKey(): string | undefined {
  return process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;
}

export function isVideoGenerationConfigured(): boolean {
  return Boolean(getVideoApiKey());
}

/**
 * Resolve the Veo model id: explicit arg → AI_VIDEO_MODEL env → default. Only
 * honored when the registry marks it videoGen-capable; otherwise the default.
 */
export function resolveVideoModel(videoModel?: string): string {
  const candidate = videoModel || process.env.AI_VIDEO_MODEL;
  if (candidate && getModelInfo(candidate)?.capabilities.videoGen) {
    return candidate;
  }
  return DEFAULT_VIDEO_MODEL;
}

/**
 * Fold the active aesthetic's visual language into the user's clip prompt so a
 * generated video matches the look of its surface (reusing the image spec's
 * medium/lighting/palette/lens, minus the still-photo framing). Falls back to
 * the bare prompt when no spec resolves.
 */
export function buildVideoPrompt(prompt: string, aestheticId?: string): string {
  const base = prompt.trim();
  const spec = getImageSpec(aestheticId as AestheticId | undefined);
  if (!spec) return base || "A short cinematic clip.";

  const styleParts = [spec.medium, spec.lighting, spec.palette, spec.lens].filter(
    (part) => part && part.trim().length > 0
  );
  if (styleParts.length === 0) return base;
  const style = styleParts.join(", ");
  return base ? `${base}. Cinematic style: ${style}.` : style;
}

export interface StartVideoResult {
  ok: boolean;
  /** Veo long-running operation name (operations/...), present when ok. */
  operationName?: string;
  /** HTTP-ish status for the caller to relay. */
  status: number;
  error?: string;
}

/**
 * Kick off a Veo generation. Returns the long-running operation name to poll;
 * does NOT wait for completion (that would risk a serverless timeout on a
 * multi-minute clip).
 */
export async function startVideoGeneration(opts: {
  prompt: string;
  aestheticId?: string;
  videoModel?: string;
  aspectRatio?: string;
  /**
   * Up to 3 "asset" reference images for subject/character consistency (e.g. a
   * suspect's generated mugshot, so the footage looks like the same person).
   * Veo 3.1 only — and using them forces an 8s duration + allow_adult person
   * generation (Google API constraints). Extras beyond 3 are dropped.
   */
  referenceImages?: VideoReferenceImage[];
}): Promise<StartVideoResult> {
  const apiKey = getVideoApiKey();
  if (!apiKey) {
    return { ok: false, status: 503, error: "Video generation is not configured" };
  }

  const model = resolveVideoModel(opts.videoModel);
  const styledPrompt = buildVideoPrompt(opts.prompt, opts.aestheticId);

  // Veo wraps each asset image as { image: { inlineData }, referenceType }, sitting
  // INSIDE the instance alongside `prompt` (not under `parameters`).
  const referenceImages = (opts.referenceImages ?? []).slice(0, MAX_REFERENCE_IMAGES);
  const hasReferences = referenceImages.length > 0;
  const instance: Record<string, unknown> = { prompt: styledPrompt };
  if (hasReferences) {
    instance.referenceImages = referenceImages.map((ref) => ({
      image: { inlineData: { mimeType: ref.mimeType, data: ref.base64 } },
      referenceType: "asset",
    }));
  }

  const parameters: Record<string, unknown> = {};
  if (opts.aspectRatio && VEO_ASPECTS.has(opts.aspectRatio)) {
    parameters.aspectRatio = opts.aspectRatio;
  }
  if (hasReferences) {
    // Reference images require an 8s clip and adult-only person generation per
    // the Veo API; set both explicitly so the request isn't rejected.
    parameters.durationSeconds = "8";
    parameters.personGeneration = "allow_adult";
  }

  try {
    const res = await fetch(`${BASE_URL}/models/${model}:predictLongRunning`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        instances: [instance],
        ...(Object.keys(parameters).length > 0 ? { parameters } : {}),
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error("[Veo] start failed:", res.status, model, detail);
      // 404 from predictLongRunning means the model id is wrong or video
      // generation isn't enabled for this key — call that out specifically so
      // it isn't mistaken for a transient failure.
      const error =
        res.status === 404
          ? `Video model "${model}" is unavailable for this API key`
          : "Video generation request failed";
      return { ok: false, status: res.status, error };
    }

    const data = (await res.json()) as { name?: string };
    if (!data.name) {
      return { ok: false, status: 502, error: "No operation name returned" };
    }
    return { ok: true, status: 200, operationName: data.name };
  } catch (error) {
    console.error("[Veo] start exception:", error);
    return { ok: false, status: 500, error: "Video generation failed to start" };
  }
}

export interface PollVideoResult {
  ok: boolean;
  done: boolean;
  /** Signed download URI for the finished clip, present when done + ok. */
  videoUri?: string;
  status: number;
  error?: string;
}

/**
 * Poll a Veo operation once. When `done`, extracts the signed video download
 * URI from the response. The caller decides cadence (the client polls the
 * status route every ~10s) so each request stays short.
 */
export async function pollVideoOperation(operationName: string): Promise<PollVideoResult> {
  const apiKey = getVideoApiKey();
  if (!apiKey) {
    return { ok: false, done: false, status: 503, error: "Video generation is not configured" };
  }

  try {
    const res = await fetch(`${BASE_URL}/${operationName}`, {
      headers: { "x-goog-api-key": apiKey },
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error("[Veo] poll failed:", res.status, detail);
      return { ok: false, done: false, status: res.status, error: "Failed to poll video status" };
    }

    const data = (await res.json()) as {
      done?: boolean;
      error?: { message?: string };
      response?: {
        generateVideoResponse?: {
          generatedSamples?: Array<{ video?: { uri?: string } }>;
        };
      };
    };

    if (!data.done) {
      return { ok: true, done: false, status: 200 };
    }

    if (data.error) {
      return {
        ok: false,
        done: true,
        status: 200,
        error: data.error.message || "Video generation failed",
      };
    }

    const videoUri =
      data.response?.generateVideoResponse?.generatedSamples?.[0]?.video?.uri ?? undefined;
    if (!videoUri) {
      return { ok: false, done: true, status: 200, error: "No video produced" };
    }
    return { ok: true, done: true, status: 200, videoUri };
  } catch (error) {
    console.error("[Veo] poll exception:", error);
    return { ok: false, done: false, status: 500, error: "Failed to poll video status" };
  }
}

/**
 * Download the finished clip bytes from the signed Veo URI (the API key is
 * required even on the signed URL).
 */
export async function downloadVideo(
  videoUri: string
): Promise<{ buffer: Buffer; mediaType: string } | null> {
  const apiKey = getVideoApiKey();
  if (!apiKey) return null;

  // SSRF guard: never send the API key anywhere but a known Google host.
  if (!isAllowedVideoUri(videoUri)) {
    console.error("[Veo] refusing to download from disallowed URI host");
    return null;
  }

  try {
    const res = await fetch(videoUri, { headers: { "x-goog-api-key": apiKey } });
    if (!res.ok) {
      console.error("[Veo] download failed:", res.status);
      return null;
    }
    const mediaType = res.headers.get("content-type") || "video/mp4";
    const buffer = Buffer.from(await res.arrayBuffer());
    return { buffer, mediaType: mediaType.includes("webm") ? "video/webm" : "video/mp4" };
  } catch (error) {
    console.error("[Veo] download exception:", error);
    return null;
  }
}
