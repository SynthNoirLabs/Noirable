// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
import { resolveA2UIImagePrompts } from "./images";

const BASE64_PNG =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO8G2X8AAAAASUVORK5CYII=";

describe("resolveA2UIImagePrompts", () => {
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

  it("replaces data urls with api urls", async () => {
    const input = {
      type: "image",
      src: `data:image/png;base64,${BASE64_PNG}`,
      alt: "Evidence photo",
    };

    const result = await resolveA2UIImagePrompts(input);

    expect(result.type).toBe("image");
    expect(result.src).toMatch(/^\/api\/images\/.+\.png$/);
    expect(result.src).not.toMatch(/^data:/);

    const fileName = result.src.split("/").pop();
    expect(fileName).toBeTruthy();
    const filePath = path.join(tempDir, fileName ?? "");
    const stat = await fs.stat(filePath);
    expect(stat.size).toBeGreaterThan(0);
  });
});
