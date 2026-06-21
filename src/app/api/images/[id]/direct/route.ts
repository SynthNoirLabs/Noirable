import path from "node:path";
import fs from "node:fs/promises";
import { Buffer } from "node:buffer";
import { NextRequest } from "next/server";
import { generateText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { getImageStoreDir, saveImageWithId } from "@/lib/ai/imageStore";
import { resolveImageBytes } from "@/lib/ai/resolveImageBytes";
import { getImageGenerationModels } from "@/lib/ai/model-registry";
import { apiSecurityCheck } from "@/lib/api/security";
import { apiError, parseJsonBody } from "@/lib/api/responses";

export const runtime = "nodejs";

/**
 * POST /api/images/<uuid>.<ext>/direct — "Direct" mode for a board image:
 * a conversational EDIT of the existing picture via Gemini's native image
 * editing ("same mugshot, profile view"; "add an evidence marker"; "age him
 * twenty years"). Unlike /redevelop (a re-roll of the recipe), the current
 * pixels are sent as input, so the scene, subject, and style survive the edit.
 * The result overwrites the stored file under the same uuid; the client
 * cache-busts with the returned `?v=` url.
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
  const ext = path.extname(id ?? "");
  const uuid = path.basename(id ?? "", ext);

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

    // Clear other-extension files so a stale earlier render can't shadow the
    // edit through readImageFile's extension fallback.
    const dir = getImageStoreDir();
    for (const staleExt of [".png", ".jpg", ".jpeg", ".webp"]) {
      await fs.unlink(path.join(dir, `${uuid}${staleExt}`)).catch(() => null);
    }
    const saved = await saveImageWithId({
      id: uuid,
      mediaType: file.mediaType ?? "image/png",
      base64: file.base64,
    });
    if (!saved) {
      return apiError("Could not persist the edited image.", 500);
    }
    return Response.json({ url: `${saved.url}?v=${Buffer.byteLength(file.base64)}` });
  } catch (error) {
    console.error("[direct] image edit failed:", error);
    return apiError("Image editing failed.", 500);
  }
}
