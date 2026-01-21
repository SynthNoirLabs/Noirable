// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
import { saveImageBase64 } from "./imageStore";

const BASE64_PNG =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO8G2X8AAAAASUVORK5CYII=";

describe("saveImageBase64", () => {
  const originalDir = process.env.A2UI_IMAGE_DIR;
  let tempDir = "";

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "a2ui-images-"));
    process.env.A2UI_IMAGE_DIR = tempDir;
  });

  afterEach(async () => {
    process.env.A2UI_IMAGE_DIR = originalDir;
    if (tempDir) {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });

  it("persists base64 data and returns an api url", async () => {
    const result = await saveImageBase64({
      base64: BASE64_PNG,
      mediaType: "image/png",
    });

    expect(result?.url).toMatch(/^\/api\/images\/.+\.png$/);
    expect(result?.filePath).toBeTruthy();

    const fileName = result?.url.split("/").pop();
    expect(fileName).toBeTruthy();

    const filePath = path.join(tempDir, fileName ?? "");
    const stat = await fs.stat(filePath);
    expect(stat.size).toBeGreaterThan(0);
  });
});
