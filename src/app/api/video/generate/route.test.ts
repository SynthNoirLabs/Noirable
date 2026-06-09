import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

vi.mock("server-only", () => ({}));

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("/api/video/generate", () => {
  let dir: string;

  beforeEach(async () => {
    vi.resetModules();
    mockFetch.mockReset();
    dir = await fs.mkdtemp(path.join(os.tmpdir(), "videogen-"));
    process.env.A2UI_VIDEO_DIR = dir;
    delete process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    delete process.env.GEMINI_API_KEY;
  });

  afterEach(async () => {
    delete process.env.A2UI_VIDEO_DIR;
    vi.unstubAllEnvs();
    await fs.rm(dir, { recursive: true, force: true });
  });

  it("returns 503 (and never calls Veo) when no Google key is configured", async () => {
    const { POST } = await import("./route");
    const request = new Request("http://localhost/api/video/generate", {
      method: "POST",
      body: JSON.stringify({ prompt: "a clip" }),
    });
    const response = await POST(request);
    expect(response.status).toBe(503);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("returns 400 when the prompt is missing", async () => {
    process.env.GEMINI_API_KEY = "k";
    const { POST } = await import("./route");
    const request = new Request("http://localhost/api/video/generate", {
      method: "POST",
      body: JSON.stringify({ prompt: "   " }),
    });
    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it("starts a job and returns a jobId immediately (does not block on completion)", async () => {
    process.env.GEMINI_API_KEY = "k";
    // Only the predictLongRunning start call should happen — NOT a poll/download.
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ name: "operations/op-1" }),
    });

    const { POST } = await import("./route");
    const request = new Request("http://localhost/api/video/generate", {
      method: "POST",
      body: JSON.stringify({ prompt: "a neon alley", aestheticId: "noir", aspectRatio: "16:9" }),
    });
    const response = await POST(request);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.jobId).toBeTruthy();
    expect(data.status).toBe("pending");
    // Exactly one Veo call (the start) — the route must not poll synchronously.
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch.mock.calls[0][0]).toContain("predictLongRunning");

    // The job record was persisted as pending for the status route to pick up.
    const jobFile = path.join(dir, `job-${data.jobId}.json`);
    const saved = JSON.parse(await fs.readFile(jobFile, "utf8"));
    expect(saved.status).toBe("pending");
    expect(saved.operationName).toBe("operations/op-1");
  });
});
