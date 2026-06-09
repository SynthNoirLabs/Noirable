import "server-only";

import path from "node:path";
import { Buffer } from "node:buffer";
import {
  readImageFile,
  getPendingImageMetadata,
  saveImageWithId,
  deletePendingImageMetadata,
} from "@/lib/ai/imageStore";
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

  const dataUrl = await generateImageDataUrl(
    metadata.prompt,
    metadata.aestheticId,
    metadata.customImageStylePrompt,
    metadata.imageModel,
    metadata.aspectRatio,
    metadata.sessionSeed,
    metadata.imageIndex
  );
  if (!dataUrl) return null;

  const match = /^data:([^;]+);base64,(.+)$/.exec(dataUrl);
  if (!match) return null;
  const mediaType = match[1];
  const base64 = match[2];

  await saveImageWithId({ id: uuid, mediaType, base64 });
  await deletePendingImageMetadata(uuid);

  file = { data: Buffer.from(base64, "base64"), contentType: mediaType };
  return file;
}
