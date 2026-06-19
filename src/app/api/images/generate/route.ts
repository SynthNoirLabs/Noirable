import crypto from "node:crypto";
import { NextRequest } from "next/server";
import { savePendingImageMetadata } from "@/lib/ai/imageStore";
import { apiSecurityCheck } from "@/lib/api/security";
import { apiError, parseJsonBody } from "@/lib/api/responses";

export const runtime = "nodejs";

/**
 * POST /api/images/generate — mint a DEFERRED image url from a prompt.
 *
 * Registers the recipe and returns `/api/images/<uuid>.jpg` immediately; the
 * pixels render lazily on the first GET (same pipeline as board images). Used
 * by the theme generator to give AI worlds their own desk backdrop without
 * blocking world creation on an image call.
 */
export async function POST(request: NextRequest): Promise<Response> {
  const securityError = apiSecurityCheck(request);
  if (securityError) return securityError;

  interface GenerateImageRequest {
    prompt?: string;
    aestheticId?: string;
    customImageStylePrompt?: string;
    aspectRatio?: string;
  }
  const body = await parseJsonBody<GenerateImageRequest>(request);

  const prompt = body?.prompt?.trim() ?? "";
  if (!prompt) {
    return apiError("Missing prompt", 400);
  }

  const id = crypto.randomUUID();
  await savePendingImageMetadata(id, {
    prompt: prompt.slice(0, 1000),
    aestheticId: body?.aestheticId,
    customImageStylePrompt: body?.customImageStylePrompt?.slice(0, 600),
    ...(body?.aspectRatio ? { aspectRatio: body.aspectRatio } : {}),
  });

  return Response.json({ url: `/api/images/${id}.jpg` });
}
