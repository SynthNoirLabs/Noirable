// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
import { NextRequest } from "next/server";
import { GET } from "./route";
import { savePendingImageMetadata } from "@/lib/ai/imageStore";
import { generateImageDataUrl } from "@/lib/ai/images";

vi.mock("@/lib/ai/images", () => ({
  generateImageDataUrl: vi.fn(),
}));

describe("/api/images/[id]", () => {
  const originalDir = process.env.A2UI_IMAGE_DIR;
  let tempDir = "";
  const fileName = "sample.png";
  const fileBytes = Buffer.from([0, 1, 2, 3, 4, 5]);

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "a2ui-images-"));
    process.env.A2UI_IMAGE_DIR = tempDir;
    await fs.writeFile(path.join(tempDir, fileName), fileBytes);
  });

  afterEach(async () => {
    process.env.A2UI_IMAGE_DIR = originalDir;
    if (tempDir) {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });

  it("serves stored images", async () => {
    const req = new NextRequest("http://localhost/api/images/sample");
    const res = await GET(req, {
      params: Promise.resolve({ id: fileName }),
    });

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("image/png");
    const data = Buffer.from(await res.arrayBuffer());
    expect(data.equals(fileBytes)).toBe(true);
  });

  it("generates image on-demand if metadata is present", async () => {
    const uuid = "pending-uuid";
    const pendingMeta = {
      prompt: "gothic manor library",
      aestheticId: "noir",
    };

    // Save metadata
    await savePendingImageMetadata(uuid, pendingMeta);

    // Mock image generation return value
    const base64Bytes = Buffer.from([10, 20, 30]).toString("base64");
    vi.mocked(generateImageDataUrl).mockResolvedValue(`data:image/jpeg;base64,${base64Bytes}`);

    const req = new NextRequest(`http://localhost/api/images/${uuid}.jpg`);
    const res = await GET(req, {
      params: Promise.resolve({ id: `${uuid}.jpg` }),
    });

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("image/jpeg");
    const data = Buffer.from(await res.arrayBuffer());
    expect(data.equals(Buffer.from([10, 20, 30]))).toBe(true);

    // Metadata file should be deleted after successful generation
    const metaExists = await fs
      .access(path.join(tempDir, `${uuid}.json`))
      .then(() => true)
      .catch(() => false);
    expect(metaExists).toBe(false);
  });

  it("returns 404 for invalid ids", async () => {
    const req = new NextRequest("http://localhost/api/images/bad");
    const res = await GET(req, {
      params: Promise.resolve({ id: "../secrets.txt" }),
    });

    expect(res.status).toBe(404);
  });
});
