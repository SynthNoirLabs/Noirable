// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
import { GET } from "./route";

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
    const res = await GET(new Request("http://localhost/api/images/sample"), {
      params: { id: fileName },
    });

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("image/png");
    const data = Buffer.from(await res.arrayBuffer());
    expect(data.equals(fileBytes)).toBe(true);
  });

  it("returns 404 for invalid ids", async () => {
    const res = await GET(new Request("http://localhost/api/images/bad"), {
      params: { id: "../secrets.txt" },
    });

    expect(res.status).toBe(404);
  });
});
