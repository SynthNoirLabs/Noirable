// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
import { saveRecordingBuffer, readRecordingFile } from "./recordingStore";

describe("recordingStore", () => {
  const originalDir = process.env.A2UI_RECORDING_DIR;
  let tempDir = "";

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "a2ui-recording-"));
    process.env.A2UI_RECORDING_DIR = tempDir;
  });

  afterEach(async () => {
    process.env.A2UI_RECORDING_DIR = originalDir;
    if (tempDir) {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });

  it("saves and retrieves a recording buffer by hash", async () => {
    const hash = "dummyhash12345";
    const dummyBuffer = Buffer.from("dummy-tts-content");
    await saveRecordingBuffer(hash, dummyBuffer);

    // Verify it is readable
    const data = await readRecordingFile(hash);
    expect(data).toBeTruthy();
    expect(data?.toString()).toBe("dummy-tts-content");
  });

  it("returns null if a file does not exist", async () => {
    const data = await readRecordingFile("nonexistenthash");
    expect(data).toBeNull();
  });
});
