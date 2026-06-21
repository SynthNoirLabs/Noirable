import "server-only";

import path from "node:path";
import fs from "node:fs/promises";
import { Buffer } from "node:buffer";

/**
 * Disk cache for generated per-world atmosphere music (ElevenLabs Music),
 * mirroring the SFX store: one file per <world>, generated lazily on first
 * request by /api/music/[world]/atmosphere and immutable afterwards.
 */

function getAtmosphereMusicStoreDir() {
  return (
    process.env.A2UI_ATMOSPHERE_MUSIC_DIR ?? path.join(process.cwd(), ".data", "atmosphere-music")
  );
}

/** Only allow simple slug names so the path can't escape the store dir. */
function isSafeSlug(value: string): boolean {
  return /^[a-z0-9-]{1,64}$/.test(value);
}

function atmosphereMusicFilePath(world: string): string | null {
  if (!isSafeSlug(world)) return null;
  return path.join(getAtmosphereMusicStoreDir(), `${world}.mp3`);
}

export async function readAtmosphereMusic(
  world: string
): Promise<{ data: Buffer; contentType: string } | null> {
  const filePath = atmosphereMusicFilePath(world);
  if (!filePath) return null;
  const data = await fs.readFile(filePath).catch(() => null);
  if (!data) return null;
  return { data, contentType: "audio/mpeg" };
}

export async function saveAtmosphereMusic(world: string, data: Buffer): Promise<boolean> {
  const filePath = atmosphereMusicFilePath(world);
  if (!filePath) return false;
  await fs.mkdir(getAtmosphereMusicStoreDir(), { recursive: true });
  await fs.writeFile(filePath, data);
  return true;
}

export async function deleteAtmosphereMusic(world: string): Promise<void> {
  const filePath = atmosphereMusicFilePath(world);
  if (!filePath) return;
  await fs.unlink(filePath).catch(() => null);
}
