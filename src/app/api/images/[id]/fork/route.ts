import { Buffer } from "node:buffer";
import { NextRequest } from "next/server";
import { generateText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { saveImageBase64 } from "@/lib/ai/imageStore";
import { resolveImageBytes } from "@/lib/ai/resolveImageBytes";
import { getImageGenerationModels } from "@/lib/ai/model-registry";
import { apiSecurityCheck } from "@/lib/api/security";
import { apiError, parseJsonBody } from "@/lib/api/responses";

export const runtime = "nodejs";

/**
 * POST /api/images/<uuid>.<ext>/fork — like `/direct` (a conversational edit of
 * an existing picture via Gemini's native image editing), but NON-DESTRUCTIVE:
 * the edited result is saved under a BRAND-NEW uuid instead of overwriting the
 * source. This is what a `stateImage` uses to derive its alternate states (e.g.
 * "the blast door is now open") while keeping the base image intact, so the
 * surface can flip between states without regenerating either one.
 *
 * Returns the new image's url; the caller caches it per-state.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  const securityError = apiSecurityCheck(request);
  if (securityError) return securityError;

  const body = await parseJsonBody<{ instruction?: string }>(request);
  const instruction = body?.instruction?.trim() ?? "";
  if (!instruction) {
    return apiError("Missing instruction", 400);
  }

  const googleKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;
  if (!googleKey) {
    return apiError("Image editing needs GOOGLE_GENERATIVE_AI_API_KEY", 503);
  }

  const { id } = await params;
  const current = await resolveImageBytes(id ?? "");
  if (!current) {
    return apiError("Image not found", 404);
  }

  // Editing needs a Gemini-native image model (image in → image out); Imagen's
  // generateImage path is generation-only.
  const editModel =
    getImageGenerationModels().find(
      (m) => m.provider === "google" && m.capabilities.imageGenMethod === "generateText"
    )?.id ?? "gemini-3-pro-image";

  try {
    const google = createGoogleGenerativeAI({ apiKey: googleKey });
    const result = await generateText({
      model: google(editModel),
      providerOptions: { google: { responseModalities: ["IMAGE"] } },
      messages: [
        {
          role: "user",
          content: [
            { type: "image", image: current.data, mediaType: current.contentType },
            {
              type: "text",
              text: `Edit this image: ${instruction}. Keep the same scene, subject, medium, and overall style — change only what the instruction asks. No text or watermark.`,
            },
          ],
        },
      ],
      maxRetries: 1,
    });
    const file = result.files?.find((f) => f.mediaType?.startsWith("image/"));
    if (!file) {
      return apiError("The model returned no edited image.", 502);
    }

    // Save under a NEW uuid (non-destructive): the base image is untouched, so
    // the surface can swap back to it without regenerating.
    const saved = await saveImageBase64({
      mediaType: file.mediaType ?? "image/png",
      base64: file.base64,
    });
    if (!saved) {
      return apiError("Could not persist the forked image.", 500);
    }
    return Response.json({ url: `${saved.url}?v=${Buffer.byteLength(file.base64)}` });
  } catch (error) {
    console.error("[fork] image edit failed:", error);
    return apiError("Image editing failed.", 500);
  }
}
