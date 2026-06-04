import { promises as fs } from "node:fs";
import path from "node:path";

export function getRecordingStoreDir() {
  return process.env.A2UI_RECORDING_DIR ?? path.join(process.cwd(), ".data", "tts");
}

export async function saveRecordingBuffer(hash: string, buffer: Buffer): Promise<void> {
  const dir = getRecordingStoreDir();
  await fs.mkdir(dir, { recursive: true });
  const filePath = path.join(dir, `${hash}.mp3`);
  await fs.writeFile(filePath, buffer);
}

export async function readRecordingFile(hash: string): Promise<Buffer | null> {
  const dir = getRecordingStoreDir();
  const filePath = path.join(dir, `${hash}.mp3`);
  return fs.readFile(filePath).catch(() => null);
}
