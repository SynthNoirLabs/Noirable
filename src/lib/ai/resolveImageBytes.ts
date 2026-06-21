import "server-only";

import path from "node:path";
import { Buffer } from "node:buffer";
import { readImageFile, getPendingImageMetadata, saveImageWithId } from "@/lib/ai/imageStore";
import { setCastEntry } from "@/lib/ai/castStore";
import { generateImageDataUrl } from "@/lib/ai/images";

export interface ResolvedImageBytes {
  data: Buffer;
  /** MIME type, e.g. "image/png" / "image/jpeg". */
  contentType: string;
}

/**
 * Resolve a stored-image filename (`<uuid>.<ext>`, as used in `/api/images/...`
 * urls) to its raw bytes + content type, generating it on demand if it's still
 * a deferred/pending image (the same lazy path the image GET route uses).
 *
 * Shared by the image GET route and the video route (which base64-encodes the
 * bytes to feed a profile pic as a Veo reference image). Returns null when the
 * filename is invalid, unknown, or generation fails.
 */
export async function resolveImageBytes(fileName: string): Promise<ResolvedImageBytes | null> {
  let file = await readImageFile(fileName);
  if (file) return file;

  // Not on disk yet — it may be a deferred image whose metadata describes how to
  // generate it. Generate, persist under its real extension, and return bytes.
  const ext = path.extname(fileName);
  const uuid = path.basename(fileName, ext);
  const metadata = await getPendingImageMetadata(uuid);
  if (!metadata) return null;

  // Cast continuity: when this image depicts an already-registered character,
  // resolve the canonical face FIRST (recursing generates it if still pending)
  // and pass it as a reference so the same person appears in the new scene.
  let referenceImage: { data: Buffer; mediaType: string } | undefined;
  if (metadata.referenceImageId && metadata.referenceImageId !== uuid) {
    const reference = await resolveImageBytes(`${metadata.referenceImageId}.jpg`);
    if (reference) {
      referenceImage = { data: reference.data, mediaType: reference.contentType };
    }
  }

  const dataUrl = await generateImageDataUrl(
    metadata.prompt,
    metadata.aestheticId,
    metadata.customImageStylePrompt,
    metadata.imageModel,
    metadata.aspectRatio,
    metadata.sessionSeed,
    metadata.imageIndex,
    referenceImage
  );
  if (!dataUrl) return null;

  const match = /^data:([^;]+);base64,(.+)$/.exec(dataUrl);
  if (!match) return null;
  const mediaType = match[1];
  const base64 = match[2];

  await saveImageWithId({ id: uuid, mediaType, base64 });
  // Register a tagged character's FIRST image as their canonical face (the
  // cast store keeps the first writer, so later takes don't re-cast the role).
  if (metadata.characterName) {
    await setCastEntry(metadata.aestheticId, metadata.characterName, uuid);
  }
  // The metadata (the image's "recipe") is deliberately KEPT after generation
  // so the per-image re-develop route can re-roll the same prompt with the
  // imageIndex advanced. readImageFile() short-circuits before the metadata is
  // consulted, so a lingering recipe file costs nothing.

  file = { data: Buffer.from(base64, "base64"), contentType: mediaType };
  return file;
}
