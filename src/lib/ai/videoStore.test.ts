import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  isValidVideoFilename,
  isValidJobId,
  saveVideoJob,
  getVideoJob,
  deleteVideoJob,
  saveVideoBuffer,
  readVideoFile,
  type VideoJob,
} from "./videoStore";

describe("videoStore validators", () => {
  it("accepts mp4/webm filenames and rejects traversal/other extensions", () => {
    expect(isValidVideoFilename("abc-123.mp4")).toBe(true);
    expect(isValidVideoFilename("clip_1.webm")).toBe(true);
    expect(isValidVideoFilename("evil.mp4/../../etc/passwd")).toBe(false);
    expect(isValidVideoFilename("song.mp3")).toBe(false);
    expect(isValidVideoFilename("../secret.mp4")).toBe(false);
  });

  it("accepts safe job ids and rejects path-ish ones", () => {
    expect(isValidJobId("a1b2-c3d4")).toBe(true);
    expect(isValidJobId("../escape")).toBe(false);
    expect(isValidJobId("with/slash")).toBe(false);
  });
});

describe("videoStore persistence", () => {
  let dir: string;

  beforeEach(async () => {
    dir = await fs.mkdtemp(path.join(os.tmpdir(), "videostore-"));
    process.env.A2UI_VIDEO_DIR = dir;
  });

  afterEach(async () => {
    delete process.env.A2UI_VIDEO_DIR;
    await fs.rm(dir, { recursive: true, force: true });
  });

  it("round-trips a job record across the pending → ready lifecycle", async () => {
    const job: VideoJob = {
      status: "pending",
      operationName: "operations/xyz",
      prompt: "a rainy street",
      createdAt: 1000,
    };
    await saveVideoJob("job1", job);

    const loaded = await getVideoJob("job1");
    expect(loaded?.status).toBe("pending");
    expect(loaded?.operationName).toBe("operations/xyz");

    await saveVideoJob("job1", { ...job, status: "ready", url: "/api/video/file/clip.mp4" });
    const finished = await getVideoJob("job1");
    expect(finished?.status).toBe("ready");
    expect(finished?.url).toBe("/api/video/file/clip.mp4");

    await deleteVideoJob("job1");
    expect(await getVideoJob("job1")).toBeNull();
  });

  it("saves and serves mp4 bytes through a /api/video/file url", async () => {
    const saved = await saveVideoBuffer(Buffer.from("fake-mp4-bytes"), "video/mp4");
    expect(saved).not.toBeNull();
    expect(saved?.url).toMatch(/^\/api\/video\/file\/[\w-]+\.mp4$/);

    const file = await readVideoFile(saved!.fileName);
    expect(file?.contentType).toBe("video/mp4");
    expect(file?.data.toString()).toBe("fake-mp4-bytes");
  });

  it("returns null for an invalid filename read", async () => {
    expect(await readVideoFile("../escape.mp4")).toBeNull();
  });
});
