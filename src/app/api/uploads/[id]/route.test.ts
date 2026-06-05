// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { promises as fs } from "node:fs";
import path from "node:path";
import { NextRequest } from "next/server";
import { GET } from "./route";

describe("GET /api/uploads/[id]", () => {
  const uploadsDir = path.join(process.cwd(), ".data", "uploads");
  const fileName = "test-file.png";
  const fileContent = Buffer.from("test-content");

  beforeEach(async () => {
    await fs.mkdir(uploadsDir, { recursive: true });
    await fs.writeFile(path.join(uploadsDir, fileName), fileContent);
  });

  afterEach(async () => {
    await fs.rm(path.join(uploadsDir, fileName), { force: true }).catch(() => {});
  });

  it("serves uploaded files with correct content type and headers", async () => {
    const req = new NextRequest(`http://localhost/api/uploads/${fileName}`);
    const res = await GET(req, {
      params: Promise.resolve({ id: fileName }),
    });

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("image/png");
    expect(res.headers.get("Cache-Control")).toBe("public, max-age=31536000, immutable");

    const body = Buffer.from(await res.arrayBuffer());
    expect(body.toString()).toBe("test-content");
  });

  it("returns 400 for invalid ID format (path traversal attempt)", async () => {
    const req = new NextRequest("http://localhost/api/uploads/../../secrets.png");
    const res = await GET(req, {
      params: Promise.resolve({ id: "../../secrets.png" }),
    });

    expect(res.status).toBe(400);
  });

  it("returns 400 for unsupported extension", async () => {
    const req = new NextRequest("http://localhost/api/uploads/something.txt");
    const res = await GET(req, {
      params: Promise.resolve({ id: "something.txt" }),
    });

    expect(res.status).toBe(400);
  });

  it("returns 404 for non-existent file", async () => {
    const req = new NextRequest("http://localhost/api/uploads/non-existent.png");
    const res = await GET(req, {
      params: Promise.resolve({ id: "non-existent.png" }),
    });

    expect(res.status).toBe(404);
  });
});
