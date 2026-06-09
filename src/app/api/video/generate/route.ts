import "server-only";

import crypto from "node:crypto";
import { apiSecurityCheck } from "@/lib/api/security";
import {
  isVideoGenerationConfigured,
  startVideoGeneration,
  type VideoReferenceImage,
} from "@/lib/ai/video";
import { resolveImageBytes } from "@/lib/ai/resolveImageBytes";
import { isValidImageFilename } from "@/lib/ai/imageStore";
import { saveVideoJob } from "@/lib/ai/videoStore";

interface VideoGenerateRequest {
  prompt?: string;
  aestheticId?: string;
  videoModel?: string;
  aspectRatio?: string;
  /**
   * Same-origin `/api/images/<uuid>.<ext>` urls of generated images to feed as
   * Veo "asset" reference images (subject consistency). Resolved to bytes
   * server-side; up to 3 are used. Anything not matching that shape is ignored.
   */
  referenceImageUrls?: string[];
}

/** Veo accepts these as reference-image inline data; others are skipped. */
const VEO_REFERENCE_MIME_TYPES = new Set(["image/png", "image/jpeg"]);

/**
 * Pull the `<uuid>.<ext>` filename out of a same-origin image url and resolve it
 * to inline base64 bytes for Veo. Returns only PNG/JPEG (Veo's accepted inline
 * types) and silently drops anything malformed, cross-origin, or unresolvable —
 * a missing reference should degrade to a normal generation, not a hard error.
 */
async function resolveReferenceImages(urls: string[]): Promise<VideoReferenceImage[]> {
  const refs: VideoReferenceImage[] = [];
  for (const raw of urls) {
    if (typeof raw !== "string") continue;
    // Accept only our own image path; take the last segment as the filename.
    const match = /^\/api\/images\/([^/?#]+)$/.exec(raw.trim());
    if (!match) continue;
    const fileName = match[1];
    if (!isValidImageFilename(fileName)) continue;

    const file = await resolveImageBytes(fileName).catch(() => null);
    if (!file || !VEO_REFERENCE_MIME_TYPES.has(file.contentType)) continue;

    refs.push({ base64: file.data.toString("base64"), mimeType: file.contentType });
    if (refs.length >= 3) break;
  }
  return refs;
}

/**
 * POST /api/video/generate
 *
 * Starts an on-demand Veo generation and returns a `jobId` IMMEDIATELY (the
 * long-running operation is polled separately via /api/video/status/[jobId]).
 * Never invoked during UI/chat generation — video is explicit + on demand.
 */
export async function POST(request: Request) {
  const securityError = apiSecurityCheck(request);
  if (securityError) return securityError;

  if (!isVideoGenerationConfigured()) {
    return Response.json(
      { error: "Set GOOGLE_GENERATIVE_AI_API_KEY or GEMINI_API_KEY to enable video generation" },
      { status: 503 }
    );
  }

  let body: VideoGenerateRequest | null = null;
  try {
    body = (await request.json()) as VideoGenerateRequest;
  } catch {
    body = null;
  }

  const prompt = body?.prompt?.trim() ?? "";
  if (!prompt) {
    return Response.json({ error: "Missing prompt" }, { status: 400 });
  }

  const referenceImageUrls = Array.isArray(body?.referenceImageUrls) ? body.referenceImageUrls : [];
  const referenceImages =
    referenceImageUrls.length > 0 ? await resolveReferenceImages(referenceImageUrls) : [];

  const result = await startVideoGeneration({
    prompt,
    aestheticId: body?.aestheticId,
    videoModel: body?.videoModel,
    aspectRatio: body?.aspectRatio,
    referenceImages,
  });

  if (!result.ok || !result.operationName) {
    return Response.json({ error: result.error ?? "Failed to start" }, { status: result.status });
  }

  const jobId = crypto.randomUUID();
  await saveVideoJob(jobId, {
    status: "pending",
    operationName: result.operationName,
    prompt,
    createdAt: Date.now(),
  });

  return Response.json({ jobId, status: "pending" });
}
