import { promises as fs } from "node:fs";
import path from "node:path";

export function getRecordingStoreDir() {
  return process.env.A2UI_RECORDING_DIR ?? path.join(process.cwd(), ".data", "tts");
}

// Recording hashes are sha256 hex digests (see api/tts/route.ts). Constrain the
// filename to that shape so a request-supplied id can never traverse out of the
// store directory (mirrors the guard on the uploads/[id] route).
const RECORDING_HASH_PATTERN = /^[a-f0-9]{64}$/;

export function isValidRecordingHash(hash: string): boolean {
  return RECORDING_HASH_PATTERN.test(hash);
}

export async function saveRecordingBuffer(hash: string, buffer: Buffer): Promise<void> {
  if (!isValidRecordingHash(hash)) return;
  const dir = getRecordingStoreDir();
  await fs.mkdir(dir, { recursive: true });
  const filePath = path.join(dir, `${hash}.mp3`);
  await fs.writeFile(filePath, buffer);
}

export async function readRecordingFile(hash: string): Promise<Buffer | null> {
  if (!isValidRecordingHash(hash)) return null;
  const dir = getRecordingStoreDir();
  const filePath = path.join(dir, `${hash}.mp3`);
  return fs.readFile(filePath).catch(() => null);
}

/**
 * Character-level alignment for a recording (ElevenLabs /with-timestamps) —
 * cached as a JSON sidecar so replays keep frame-accurate cue timing.
 */
export interface RecordingAlignment {
  characters: string[];
  characterStartTimesSeconds: number[];
  characterEndTimesSeconds: number[];
}

export async function saveRecordingAlignment(
  hash: string,
  alignment: RecordingAlignment
): Promise<void> {
  if (!isValidRecordingHash(hash)) return;
  const dir = getRecordingStoreDir();
  await fs.mkdir(dir, { recursive: true });
  const filePath = path.join(dir, `${hash}.alignment.json`);
  await fs.writeFile(filePath, JSON.stringify(alignment), "utf8");
}

export async function readRecordingAlignment(hash: string): Promise<RecordingAlignment | null> {
  if (!isValidRecordingHash(hash)) return null;
  const dir = getRecordingStoreDir();
  const filePath = path.join(dir, `${hash}.alignment.json`);
  const data = await fs.readFile(filePath, "utf8").catch(() => null);
  if (!data) return null;
  try {
    return JSON.parse(data) as RecordingAlignment;
  } catch {
    return null;
  }
}
