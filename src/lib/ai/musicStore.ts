import { promises as fs } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const MEDIA_TYPE_TO_EXT: Record<string, string> = {
  "audio/mpeg": "mp3",
  "audio/mp3": "mp3",
  "audio/wav": "wav",
  "audio/x-wav": "wav",
  "audio/webm": "webm",
  "audio/ogg": "ogg",
};

const EXT_TO_MEDIA_TYPE: Record<string, string> = {
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".webm": "audio/webm",
  ".ogg": "audio/ogg",
};

const FILENAME_PATTERN = /^[a-zA-Z0-9_-]+\.(mp3|wav|webm|ogg)$/;

export function getMusicStoreDir() {
  return process.env.A2UI_MUSIC_DIR ?? path.join(process.cwd(), ".data", "music");
}

export function isValidMusicFilename(fileName: string) {
  return FILENAME_PATTERN.test(fileName);
}

export async function saveMusicBuffer(
  buffer: Buffer,
  mediaType: string
): Promise<{ url: string; filePath: string } | null> {
  const ext = MEDIA_TYPE_TO_EXT[mediaType] || "mp3";
  const dir = getMusicStoreDir();
  await fs.mkdir(dir, { recursive: true });

  const id = crypto.randomUUID();
  const fileName = `${id}.${ext}`;
  const filePath = path.join(dir, fileName);

  await fs.writeFile(filePath, buffer);

  return { url: `/api/music/file/${fileName}`, filePath };
}

export async function readMusicFile(fileName: string): Promise<{
  data: Buffer;
  contentType: string;
} | null> {
  if (!isValidMusicFilename(fileName)) return null;

  const dir = getMusicStoreDir();
  const filePath = path.join(dir, fileName);
  const data = await fs.readFile(filePath).catch(() => null);
  if (!data) return null;

  const ext = path.extname(fileName).toLowerCase();
  const contentType = EXT_TO_MEDIA_TYPE[ext] || "audio/mpeg";

  return { data, contentType };
}
