// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
import { saveImageBase64, saveImageWithId, readImageFile } from "./imageStore";

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

  // Regression (Codex P1): a deferred image is referenced as `<uuid>.jpg` but
  // saved under the model's real media type (e.g. `<uuid>.png`). After a reload
  // the pending metadata is gone, so reading by the requested `.jpg` name must
  // still resolve the persisted `.png` rather than 404.
  it("resolves a uuid by its real extension when the requested one differs", async () => {
    const uuid = "11111111-1111-1111-1111-111111111111";
    await saveImageWithId({ id: uuid, base64: BASE64_PNG, mediaType: "image/png" });

    const exact = await readImageFile(`${uuid}.png`);
    expect(exact?.contentType).toBe("image/png");

    // The .jpg URL the board hardcodes must still find the stored .png bytes.
    const viaJpg = await readImageFile(`${uuid}.jpg`);
    expect(viaJpg).not.toBeNull();
    expect(viaJpg?.contentType).toBe("image/png");
    expect(viaJpg?.data.length).toBe(exact?.data.length);
  });

  it("returns null for a uuid with no stored file in any extension", async () => {
    const missing = await readImageFile("22222222-2222-2222-2222-222222222222.jpg");
    expect(missing).toBeNull();
  });
});
