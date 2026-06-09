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
import { getModelInfo } from "./model-registry";

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

  it("defaults to the current veo-3.1-fast-generate-preview id", () => {
    expect(resolveVideoModel()).toBe("veo-3.1-fast-generate-preview");
  });

  it("defaults to a model that is actually registered as video-capable", () => {
    // Guards against a fabricated/typo'd default id (a wrong id 404s on Veo —
    // e.g. the non-existent `veo-3.1-fast-generate-001`).
    const id = resolveVideoModel();
    expect(getModelInfo(id)?.capabilities.videoGen).toBe(true);
  });

  it("honors an explicit video-capable model (e.g. the stable 3.0 fallback)", () => {
    expect(resolveVideoModel("veo-3.0-fast-generate-001")).toBe("veo-3.0-fast-generate-001");
  });

  it("ignores a non-video model id and falls back to the default", () => {
    expect(resolveVideoModel("imagen-4.0-generate-001")).toBe("veo-3.1-fast-generate-preview");
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
    expect(url).toContain("veo-3.1-fast-generate-preview:predictLongRunning");
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

  it("includes asset reference images inside the instance and forces 8s/allow_adult", async () => {
    process.env.GEMINI_API_KEY = "k";
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ name: "operations/r" }) });

    await startVideoGeneration({
      prompt: "the suspect walks out",
      aestheticId: "noir",
      aspectRatio: "9:16",
      referenceImages: [{ base64: "AAAA", mimeType: "image/png" }],
    });

    const sent = JSON.parse(mockFetch.mock.calls[0][1].body);
    // referenceImages live INSIDE the instance (sibling to prompt), not parameters.
    // predictLongRunning uses bytesBase64Encoded (predict family), NOT inlineData.
    expect(sent.instances[0].referenceImages).toEqual([
      { image: { bytesBase64Encoded: "AAAA", mimeType: "image/png" }, referenceType: "asset" },
    ]);
    // Reference images force these per the Veo API. durationSeconds is a NUMBER
    // on the wire (a string is rejected with "needs to be a number").
    expect(sent.parameters.durationSeconds).toBe(8);
    expect(sent.parameters.personGeneration).toBe("allow_adult");
    expect(sent.parameters.aspectRatio).toBe("9:16");
  });

  it("caps reference images at 3 (Veo's asset limit)", async () => {
    process.env.GEMINI_API_KEY = "k";
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ name: "operations/r" }) });

    await startVideoGeneration({
      prompt: "a lineup",
      referenceImages: [
        { base64: "A", mimeType: "image/png" },
        { base64: "B", mimeType: "image/png" },
        { base64: "C", mimeType: "image/jpeg" },
        { base64: "D", mimeType: "image/png" },
      ],
    });

    const sent = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(sent.instances[0].referenceImages).toHaveLength(3);
  });

  it("omits referenceImages and the forced params when none are passed", async () => {
    process.env.GEMINI_API_KEY = "k";
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ name: "operations/r" }) });

    await startVideoGeneration({ prompt: "a clip", referenceImages: [] });

    const sent = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(sent.instances[0].referenceImages).toBeUndefined();
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
