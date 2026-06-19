import "server-only";

import path from "node:path";
import fs from "node:fs/promises";

/**
 * The CAST FILE — persistent character continuity for generated imagery.
 *
 * When the model tags an image prompt with `[character: Name]`, the first
 * generated image of that character is registered here (per world, so casts
 * don't cross-contaminate). Every LATER image of the same name passes the
 * registered image as a Gemini reference, so V. Kessler has the same face in
 * his mugshot, the surveillance still, and the Veo footage.
 *
 * One JSON file, keyed `<world>::<name-lower>` → image uuid. Local single-user
 * app: a module-level lock keeps concurrent writes from clobbering each other.
 */

function getCastFilePath() {
  return process.env.A2UI_CAST_FILE ?? path.join(process.cwd(), ".data", "cast.json");
}

type CastMap = Record<string, string>;

let writeChain: Promise<void> = Promise.resolve();

function castKey(world: string | undefined, name: string): string {
  return `${world ?? "noir"}::${name.trim().toLowerCase()}`;
}

async function readCastMap(): Promise<CastMap> {
  const data = await fs.readFile(getCastFilePath(), "utf8").catch(() => null);
  if (!data) return {};
  try {
    return JSON.parse(data) as CastMap;
  } catch {
    return {};
  }
}

/** The registered image uuid for a character, or null if unseen. */
export async function getCastEntry(
  world: string | undefined,
  name: string
): Promise<string | null> {
  const map = await readCastMap();
  return map[castKey(world, name)] ?? null;
}

/** Register a character's canonical image (first writer wins). */
export async function setCastEntry(
  world: string | undefined,
  name: string,
  imageUuid: string
): Promise<void> {
  const task = writeChain.then(async () => {
    const map = await readCastMap();
    const key = castKey(world, name);
    if (map[key]) return; // first face wins — later images reference it
    map[key] = imageUuid;
    const filePath = getCastFilePath();
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(map, null, 2), "utf8");
  });
  writeChain = task.catch(() => undefined);
  return task;
}

/**
 * Extract a `[character: Name]` tag from an image prompt. Returns the cleaned
 * prompt and the character name (or null). Case-insensitive, tolerant of
 * `[character:Name]` spacing.
 */
export function extractCharacterTag(prompt: string): { prompt: string; name: string | null } {
  const match = /\[character:\s*([^\]]{1,80})\]/i.exec(prompt);
  if (!match) return { prompt, name: null };
  const cleaned = prompt
    .replace(match[0], "")
    .replace(/\s{2,}/g, " ")
    .trim();
  return { prompt: cleaned, name: match[1].trim() };
}
