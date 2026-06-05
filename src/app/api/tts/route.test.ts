// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
import { POST } from "./route";
import { GET } from "./file/[id]/route";
import { NextRequest } from "next/server";

// Mock apiSecurityCheck
vi.mock("@/lib/api/security", () => ({
  apiSecurityCheck: () => null,
}));

describe("/api/tts API endpoints", () => {
  const originalApiKey = process.env.ELEVENLABS_API_KEY;
  const originalDir = process.env.A2UI_RECORDING_DIR;
  let tempDir = "";

  beforeEach(async () => {
    process.env.ELEVENLABS_API_KEY = "test-elevenlabs-key";
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "a2ui-recording-test-"));
    process.env.A2UI_RECORDING_DIR = tempDir;
    vi.restoreAllMocks();
  });

  afterEach(async () => {
    process.env.ELEVENLABS_API_KEY = originalApiKey;
    process.env.A2UI_RECORDING_DIR = originalDir;
    if (tempDir) {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });

  it("handles missing text in request", async () => {
    const req = new Request("http://localhost/api/tts", {
      method: "POST",
      body: JSON.stringify({}),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Missing text");
  });

  it("calls ElevenLabs on cache miss, caches buffer, and serves from cache on subsequent calls", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockImplementation(() =>
      Promise.resolve(
        new Response(Buffer.from("mock-audio-stream"), {
          status: 200,
          headers: { "Content-Type": "audio/mpeg" },
        })
      )
    );

    const textToSpeak = "This is a test of voice cache.";
    const payload = { text: textToSpeak };

    // 1. First Call: Cache Miss
    const req1 = new Request("http://localhost/api/tts", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    const res1 = await POST(req1);
    expect(res1.status).toBe(200);
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    const hash = res1.headers.get("x-recording-hash");
    expect(hash).toBeTruthy();

    const data1 = await res1.arrayBuffer();
    expect(Buffer.from(data1).toString()).toBe("mock-audio-stream");

    // 2. Second Call: Cache Hit (should NOT call fetch again)
    fetchSpy.mockClear();

    const req2 = new Request("http://localhost/api/tts", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    const res2 = await POST(req2);
    expect(res2.status).toBe(200);
    expect(fetchSpy).not.toHaveBeenCalled(); // served from cache
    expect(res2.headers.get("x-recording-hash")).toBe(hash);

    const data2 = await res2.arrayBuffer();
    expect(Buffer.from(data2).toString()).toBe("mock-audio-stream");

    // 3. GET /api/tts/file/[id] serves the cached file
    const getRequest = new NextRequest(`http://localhost/api/tts/file/${hash}`);
    const getResponse = await GET(getRequest, { params: Promise.resolve({ id: hash as string }) });
    expect(getResponse.status).toBe(200);
    const getData = await getResponse.arrayBuffer();
    expect(Buffer.from(getData).toString()).toBe("mock-audio-stream");
  });

  it("returns 404 for a valid-format hash with no cached file", async () => {
    const absentHash = "a".repeat(64); // valid sha256 shape, no file on disk
    const getRequest = new NextRequest(`http://localhost/api/tts/file/${absentHash}`);
    const getResponse = await GET(getRequest, { params: Promise.resolve({ id: absentHash }) });
    expect(getResponse.status).toBe(404);
  });

  it("returns 400 for a malformed id (path-traversal guard)", async () => {
    const getRequest = new NextRequest("http://localhost/api/tts/file/..%2f..%2fsecret");
    const getResponse = await GET(getRequest, {
      params: Promise.resolve({ id: "../../secret" }),
    });
    expect(getResponse.status).toBe(400);
  });
});
