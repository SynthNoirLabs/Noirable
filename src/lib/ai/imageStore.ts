import { promises as fs } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const MEDIA_TYPE_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const EXT_TO_MEDIA_TYPE: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

const FILENAME_PATTERN = /^[a-zA-Z0-9_-]+\.(jpg|jpeg|png|webp)$/;

export function getImageStoreDir() {
  return process.env.A2UI_IMAGE_DIR ?? path.join(process.cwd(), ".data", "images");
}

export function isValidImageFilename(fileName: string) {
  return FILENAME_PATTERN.test(fileName);
}

export async function saveImageBase64(input: {
  base64: string;
  mediaType: string;
}): Promise<{ url: string; filePath: string } | null> {
  const ext = MEDIA_TYPE_TO_EXT[input.mediaType];
  if (!ext) return null;

  const dir = getImageStoreDir();
  await fs.mkdir(dir, { recursive: true });

  const id = crypto.randomUUID();
  const fileName = `${id}.${ext}`;
  const filePath = path.join(dir, fileName);

  const buffer = Buffer.from(input.base64, "base64");
  await fs.writeFile(filePath, buffer);

  return { url: `/api/images/${fileName}`, filePath };
}

export async function saveImageWithId(input: {
  id: string;
  base64: string;
  mediaType: string;
}): Promise<{ url: string; filePath: string } | null> {
  const ext = MEDIA_TYPE_TO_EXT[input.mediaType];
  if (!ext) return null;

  const dir = getImageStoreDir();
  await fs.mkdir(dir, { recursive: true });

  const fileName = `${input.id}.${ext}`;
  const filePath = path.join(dir, fileName);

  const buffer = Buffer.from(input.base64, "base64");
  await fs.writeFile(filePath, buffer);

  return { url: `/api/images/${fileName}`, filePath };
}

export async function readImageFile(fileName: string): Promise<{
  data: Buffer;
  contentType: string;
} | null> {
  if (!isValidImageFilename(fileName)) return null;

  const dir = getImageStoreDir();
  const filePath = path.join(dir, fileName);
  const data = await fs.readFile(filePath).catch(() => null);
  if (!data) return null;

  const ext = path.extname(fileName).toLowerCase();
  const contentType = EXT_TO_MEDIA_TYPE[ext];
  if (!contentType) return null;

  return { data, contentType };
}

export interface PendingImageMetadata {
  prompt: string;
  aestheticId?: string;
  customImageStylePrompt?: string | null;
  imageModel?: string;
  /** `{width}:{height}` aspect ratio threaded to the provider when supported. (Bet 7.) */
  aspectRatio?: string;
  /** Deterministic seed for this image (typically sessionSeed + imageIndex). (Bet 7.) */
  seed?: number;
  /** Per-board seed family; combined with imageIndex for intra-board variety. (Bet 7.) */
  sessionSeed?: number;
  /** Index of this image within its board; rotates the spec motif. (Bet 7.) */
  imageIndex?: number;
}

export async function savePendingImageMetadata(
  id: string,
  metadata: PendingImageMetadata
): Promise<void> {
  const dir = getImageStoreDir();
  await fs.mkdir(dir, { recursive: true });
  const filePath = path.join(dir, `${id}.json`);
  await fs.writeFile(filePath, JSON.stringify(metadata, null, 2), "utf8");
}

export async function getPendingImageMetadata(id: string): Promise<PendingImageMetadata | null> {
  const dir = getImageStoreDir();
  const filePath = path.join(dir, `${id}.json`);
  const data = await fs.readFile(filePath, "utf8").catch(() => null);
  if (!data) return null;
  try {
    return JSON.parse(data) as PendingImageMetadata;
  } catch {
    return null;
  }
}

export async function deletePendingImageMetadata(id: string): Promise<void> {
  const dir = getImageStoreDir();
  const filePath = path.join(dir, `${id}.json`);
  await fs.unlink(filePath).catch(() => null);
}
