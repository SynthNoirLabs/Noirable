import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("server-only", () => ({}));

const mockFetch = vi.fn();
global.fetch = mockFetch;

import {
  buildVideoPrompt,
  resolveVideoModel,
  isVideoGenerationConfigured,
  startVideoGeneration,
  pollVideoOperation,
  downloadVideo,
} from "./video";

describe("buildVideoPrompt", () => {
  it("folds the aesthetic's cinematic style into the prompt", () => {
    const out = buildVideoPrompt("a detective lights a cigarette", "noir");
    expect(out.startsWith("a detective lights a cigarette")).toBe(true);
    expect(out).toMatch(/Cinematic style:/);
  });

  it("returns a sensible default for an empty prompt", () => {
    const out = buildVideoPrompt("   ", undefined);
    expect(out.length).toBeGreaterThan(0);
  });
});

describe("resolveVideoModel", () => {
  beforeEach(() => {
    delete process.env.AI_VIDEO_MODEL;
  });

  it("defaults to veo-3.1-fast-generate-001", () => {
    expect(resolveVideoModel()).toBe("veo-3.1-fast-generate-001");
  });

  it("honors an explicit video-capable model", () => {
    expect(resolveVideoModel("veo-3.1-fast-generate-001")).toBe("veo-3.1-fast-generate-001");
  });

  it("ignores a non-video model id and falls back to the default", () => {
    expect(resolveVideoModel("imagen-4.0-generate-001")).toBe("veo-3.1-fast-generate-001");
  });
});

describe("video generation REST integration", () => {
  beforeEach(() => {
    mockFetch.mockReset();
    delete process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    delete process.env.GEMINI_API_KEY;
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("reports not-configured without a Google key", () => {
    expect(isVideoGenerationConfigured()).toBe(false);
  });

  it("startVideoGeneration 503s without a key and never calls fetch", async () => {
    const result = await startVideoGeneration({ prompt: "a clip" });
    expect(result.ok).toBe(false);
    expect(result.status).toBe(503);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("startVideoGeneration POSTs predictLongRunning and returns the operation name", async () => {
    process.env.GEMINI_API_KEY = "k";
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ name: "operations/abc-123" }),
    });

    const result = await startVideoGeneration({
      prompt: "a neon alley",
      aestheticId: "noir",
      aspectRatio: "16:9",
    });

    expect(result.ok).toBe(true);
    expect(result.operationName).toBe("operations/abc-123");
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toContain("veo-3.1-fast-generate-001:predictLongRunning");
    expect(init.headers["x-goog-api-key"]).toBe("k");
    const sent = JSON.parse(init.body);
    expect(sent.instances[0].prompt).toMatch(/neon alley/);
    expect(sent.parameters.aspectRatio).toBe("16:9");
  });

  it("drops an unsupported aspect ratio from the request", async () => {
    process.env.GEMINI_API_KEY = "k";
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ name: "operations/x" }) });

    await startVideoGeneration({ prompt: "a clip", aspectRatio: "21:9" });

    const sent = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(sent.parameters).toBeUndefined();
  });

  it("pollVideoOperation returns not-done while the op is running", async () => {
    process.env.GEMINI_API_KEY = "k";
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ done: false }) });

    const result = await pollVideoOperation("operations/abc");
    expect(result.done).toBe(false);
    expect(result.ok).toBe(true);
  });

  it("pollVideoOperation extracts the signed video URI when done", async () => {
    process.env.GEMINI_API_KEY = "k";
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        done: true,
        response: {
          generateVideoResponse: {
            generatedSamples: [{ video: { uri: "https://example.com/clip.mp4?key=x" } }],
          },
        },
      }),
    });

    const result = await pollVideoOperation("operations/abc");
    expect(result.done).toBe(true);
    expect(result.ok).toBe(true);
    expect(result.videoUri).toBe("https://example.com/clip.mp4?key=x");
  });

  it("pollVideoOperation surfaces a done-with-error operation", async () => {
    process.env.GEMINI_API_KEY = "k";
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ done: true, error: { message: "safety blocked" } }),
    });

    const result = await pollVideoOperation("operations/abc");
    expect(result.done).toBe(true);
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/safety blocked/);
  });

  it("downloadVideo refuses a non-Google URI without sending the API key (SSRF guard)", async () => {
    process.env.GEMINI_API_KEY = "k";
    const result = await downloadVideo("http://169.254.169.254/latest/meta-data/");
    expect(result).toBeNull();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("downloadVideo refuses a non-https Google URI (SSRF guard)", async () => {
    process.env.GEMINI_API_KEY = "k";
    const result = await downloadVideo("http://storage.googleapis.com/clip.mp4");
    expect(result).toBeNull();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("downloadVideo fetches an allowed Google https URI with the API key", async () => {
    process.env.GEMINI_API_KEY = "k";
    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: { get: () => "video/mp4" },
      arrayBuffer: async () => new TextEncoder().encode("mp4-bytes").buffer,
    });
    const result = await downloadVideo("https://storage.googleapis.com/v/clip.mp4?key=x");
    expect(result?.mediaType).toBe("video/mp4");
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch.mock.calls[0][1].headers["x-goog-api-key"]).toBe("k");
  });
});
