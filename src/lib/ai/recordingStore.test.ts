// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
import { saveRecordingBuffer, readRecordingFile, isValidRecordingHash } from "./recordingStore";

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

  // Recording hashes are sha256 hex digests (64 lowercase hex chars).
  const hash = "a".repeat(64);

  it("saves and retrieves a recording buffer by hash", async () => {
    const dummyBuffer = Buffer.from("dummy-tts-content");
    await saveRecordingBuffer(hash, dummyBuffer);

    // Verify it is readable
    const data = await readRecordingFile(hash);
    expect(data).toBeTruthy();
    expect(data?.toString()).toBe("dummy-tts-content");
  });

  it("returns null if a file does not exist", async () => {
    const data = await readRecordingFile("b".repeat(64));
    expect(data).toBeNull();
  });

  it("rejects hashes that aren't bare sha256 digests (path-traversal guard)", async () => {
    expect(isValidRecordingHash("../../etc/passwd")).toBe(false);
    expect(isValidRecordingHash("dummyhash12345")).toBe(false);
    expect(isValidRecordingHash("a".repeat(64))).toBe(true);

    // A traversal-style hash must not read or write outside the store.
    await saveRecordingBuffer("../escape", Buffer.from("x"));
    expect(await readRecordingFile("../escape")).toBeNull();
  });
});
