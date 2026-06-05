// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { promises as fs } from "node:fs";
import path from "node:path";
import { NextRequest } from "next/server";
import { POST } from "./route";

describe("POST /api/uploads", () => {
  let createdFiles: string[] = [];

  beforeEach(() => {
    createdFiles = [];
  });

  afterEach(async () => {
    const uploadsDir = path.join(process.cwd(), ".data", "uploads");
    for (const file of createdFiles) {
      await fs.rm(path.join(uploadsDir, file), { force: true }).catch(() => {});
    }
  });

  it("successfully uploads a valid image file", async () => {
    const formData = new FormData();
    const file = new File([Buffer.from("fake-image-data")], "test.png", { type: "image/png" });
    formData.append("file", file);

    const req = new NextRequest("http://localhost/api/uploads", {
      method: "POST",
      body: formData,
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.url).toMatch(/^\/api\/uploads\/[a-f0-9-]+.png$/);

    const filename = path.basename(body.url);
    createdFiles.push(filename);

    const uploadsDir = path.join(process.cwd(), ".data", "uploads");
    const exists = await fs
      .stat(path.join(uploadsDir, filename))
      .then(() => true)
      .catch(() => false);
    expect(exists).toBe(true);
  });

  it("successfully uploads a valid audio file", async () => {
    const formData = new FormData();
    const file = new File([Buffer.from("fake-audio-data")], "test.mp3", { type: "audio/mpeg" });
    formData.append("file", file);

    const req = new NextRequest("http://localhost/api/uploads", {
      method: "POST",
      body: formData,
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.url).toMatch(/^\/api\/uploads\/[a-f0-9-]+.mp3$/);

    const filename = path.basename(body.url);
    createdFiles.push(filename);
  });

  it("rejects invalid file types", async () => {
    const formData = new FormData();
    const file = new File([Buffer.from("fake-text-data")], "test.txt", { type: "text/plain" });
    formData.append("file", file);

    const req = new NextRequest("http://localhost/api/uploads", {
      method: "POST",
      body: formData,
    });

    const res = await POST(req);
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.error).toContain("is not allowed");
  });

  it("rejects image files exceeding size limit", async () => {
    const formData = new FormData();
    const largeBuffer = Buffer.alloc(11 * 1024 * 1024);
    const file = new File([largeBuffer], "large.png", { type: "image/png" });
    formData.append("file", file);

    const req = new NextRequest("http://localhost/api/uploads", {
      method: "POST",
      body: formData,
    });

    const res = await POST(req);
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.error).toContain("Image size exceeds");
  });

  it("rejects audio files exceeding size limit", async () => {
    const formData = new FormData();
    const largeBuffer = Buffer.alloc(21 * 1024 * 1024);
    const file = new File([largeBuffer], "large.mp3", { type: "audio/mpeg" });
    formData.append("file", file);

    const req = new NextRequest("http://localhost/api/uploads", {
      method: "POST",
      body: formData,
    });

    const res = await POST(req);
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.error).toContain("Audio size exceeds");
  });
});
