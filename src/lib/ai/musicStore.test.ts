// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
import { saveMusicBuffer, readMusicFile } from "./musicStore";

describe("musicStore", () => {
  const originalDir = process.env.A2UI_MUSIC_DIR;
  let tempDir = "";

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "a2ui-music-"));
    process.env.A2UI_MUSIC_DIR = tempDir;
  });

  afterEach(async () => {
    process.env.A2UI_MUSIC_DIR = originalDir;
    if (tempDir) {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });

  it("persists audio buffer and returns an api url", async () => {
    const dummyBuffer = Buffer.from("dummy-audio-content");
    const result = await saveMusicBuffer(dummyBuffer, "audio/mpeg");

    expect(result?.url).toMatch(/^\/api\/music\/file\/.+\.mp3$/);
    expect(result?.filePath).toBeTruthy();

    const fileName = result?.url.split("/").pop();
    expect(fileName).toBeTruthy();

    // Verify it is readable
    const readResult = await readMusicFile(fileName ?? "");
    expect(readResult).toBeTruthy();
    expect(readResult?.contentType).toBe("audio/mpeg");
    expect(readResult?.data.toString()).toBe("dummy-audio-content");
  });
});
