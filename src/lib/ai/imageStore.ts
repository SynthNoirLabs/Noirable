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
  return (
    process.env.A2UI_IMAGE_DIR ?? path.join(process.cwd(), ".data", "images")
  );
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
