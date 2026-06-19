import path from "node:path";
import fs from "node:fs/promises";
import { NextRequest } from "next/server";
import {
  getImageStoreDir,
  getPendingImageMetadata,
  savePendingImageMetadata,
  saveImageWithId,
} from "@/lib/ai/imageStore";
import { generateImageDataUrl } from "@/lib/ai/images";
import { apiSecurityCheck } from "@/lib/api/security";

export const runtime = "nodejs";

/**
 * POST /api/images/<uuid>.<ext>/redevelop
 *
 * Per-image re-roll: regenerate ONE image from its persisted recipe (prompt +
 * aesthetic + seed family) with the imageIndex advanced, so the spec motif
 * rotates and the result is a genuinely different take on the same subject.
 * The new bytes overwrite the stored file under the same uuid, so the surface's
 * existing `/api/images/<uuid>.jpg` url keeps working — the client only needs a
 * `?v=` cache-buster to see the fresh print.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  const securityError = apiSecurityCheck(request);
  if (securityError) return securityError;

  const { id } = await params;
  const ext = path.extname(id ?? "");
  const uuid = path.basename(id ?? "", ext);

  const metadata = await getPendingImageMetadata(uuid);
  if (!metadata) {
    return Response.json(
      { error: "No recipe for this image (it predates re-develop support)." },
      { status: 404 }
    );
  }

  const nextIndex = (metadata.imageIndex ?? 0) + 1;
  const dataUrl = await generateImageDataUrl(
    metadata.prompt,
    metadata.aestheticId,
    metadata.customImageStylePrompt,
    metadata.imageModel,
    metadata.aspectRatio,
    metadata.sessionSeed,
    nextIndex
  );
  if (!dataUrl) {
    return Response.json({ error: "Image generation failed." }, { status: 502 });
  }

  const match = /^data:([^;]+);base64,(.+)$/.exec(dataUrl);
  if (!match) {
    return Response.json({ error: "Unexpected generation output." }, { status: 502 });
  }

  // Clear other-extension files for this uuid so a stale earlier render can't
  // shadow the new one through readImageFile's extension fallback.
  const dir = getImageStoreDir();
  for (const staleExt of [".png", ".jpg", ".jpeg", ".webp"]) {
    await fs.unlink(path.join(dir, `${uuid}${staleExt}`)).catch(() => null);
  }

  const saved = await saveImageWithId({ id: uuid, mediaType: match[1], base64: match[2] });
  if (!saved) {
    return Response.json({ error: "Could not persist the regenerated image." }, { status: 500 });
  }

  // Persist the advanced index so the NEXT re-develop walks further around the
  // motif ring instead of bouncing between two takes.
  await savePendingImageMetadata(uuid, { ...metadata, imageIndex: nextIndex });

  return Response.json({ url: `${saved.url}?v=${nextIndex}` });
}
