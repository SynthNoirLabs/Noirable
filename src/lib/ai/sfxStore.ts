import "server-only";

import path from "node:path";
import fs from "node:fs/promises";
import { Buffer } from "node:buffer";

/**
 * Disk cache for generated world foley (ElevenLabs text-to-SFX), mirroring the
 * image/music stores: one file per <world>/<kind>, generated lazily on first
 * request by /api/sfx/[world]/[kind] and immutable afterwards.
 */

export type SfxKind = "typewriter" | "thunder" | "phone" | "ambient" | "crackle";

export const SFX_KINDS: readonly SfxKind[] = [
  "typewriter",
  "thunder",
  "phone",
  "ambient",
  "crackle",
] as const;

export function isSfxKind(value: string): value is SfxKind {
  return (SFX_KINDS as readonly string[]).includes(value);
}

function getSfxStoreDir() {
  return process.env.A2UI_SFX_DIR ?? path.join(process.cwd(), ".data", "sfx");
}

/** Only allow simple slug names so the path can't escape the store dir. */
function isSafeSlug(value: string): boolean {
  return /^[a-z0-9-]{1,64}$/.test(value);
}

function sfxFilePath(world: string, kind: SfxKind): string | null {
  if (!isSafeSlug(world)) return null;
  return path.join(getSfxStoreDir(), `${world}--${kind}.mp3`);
}

export async function readSfxFile(
  world: string,
  kind: SfxKind
): Promise<{ data: Buffer; contentType: string } | null> {
  const filePath = sfxFilePath(world, kind);
  if (!filePath) return null;
  const data = await fs.readFile(filePath).catch(() => null);
  if (!data) return null;
  return { data, contentType: "audio/mpeg" };
}

export async function saveSfxFile(world: string, kind: SfxKind, data: Buffer): Promise<boolean> {
  const filePath = sfxFilePath(world, kind);
  if (!filePath) return false;
  await fs.mkdir(getSfxStoreDir(), { recursive: true });
  await fs.writeFile(filePath, data);
  return true;
}

export async function deleteSfxFile(world: string, kind: SfxKind): Promise<void> {
  const filePath = sfxFilePath(world, kind);
  if (!filePath) return;
  await fs.unlink(filePath).catch(() => null);
}
