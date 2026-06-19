// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
import {
  saveAtmosphereMusic,
  readAtmosphereMusic,
  deleteAtmosphereMusic,
} from "./atmosphereMusicStore";

describe("atmosphereMusicStore", () => {
  const originalDir = process.env.A2UI_ATMOSPHERE_MUSIC_DIR;
  let tempDir = "";

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "a2ui-atmosphere-music-"));
    process.env.A2UI_ATMOSPHERE_MUSIC_DIR = tempDir;
  });

  afterEach(async () => {
    process.env.A2UI_ATMOSPHERE_MUSIC_DIR = originalDir;
    if (tempDir) {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });

  it("saves, reads, and deletes a world's music (round-trip)", async () => {
    const dummyBuffer = Buffer.from("dummy-music-content");
    const saved = await saveAtmosphereMusic("grand-hotel", dummyBuffer);
    expect(saved).toBe(true);

    const read = await readAtmosphereMusic("grand-hotel");
    expect(read?.contentType).toBe("audio/mpeg");
    expect(read?.data.toString()).toBe("dummy-music-content");

    await deleteAtmosphereMusic("grand-hotel");
    expect(await readAtmosphereMusic("grand-hotel")).toBeNull();
  });

  it("returns null if a world has no cached music", async () => {
    expect(await readAtmosphereMusic("noir")).toBeNull();
  });

  it("rejects slugs that aren't simple names (path-traversal guard)", async () => {
    const saved = await saveAtmosphereMusic("../escape", Buffer.from("x"));
    expect(saved).toBe(false);
    expect(await readAtmosphereMusic("../escape")).toBeNull();
  });
});
