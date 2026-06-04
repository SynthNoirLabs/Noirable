import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock server-only
vi.mock("server-only", () => ({}));

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock saveMusicBuffer
vi.mock("@/lib/ai/musicStore", () => ({
  saveMusicBuffer: vi.fn(async (buffer: Buffer, mimeType: string) => {
    return { url: `/api/music/file/mock-uuid.${mimeType === "audio/mpeg" ? "mp3" : "mp3"}` };
  }),
}));

describe("/api/music/generate", () => {
  beforeEach(() => {
    vi.resetModules();
    mockFetch.mockReset();
    delete process.env.ELEVENLABS_API_KEY;
    delete process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    delete process.env.GEMINI_API_KEY;
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns 400 when missing prompt", async () => {
    const { POST } = await import("./route");
    const request = new Request("http://localhost/api/music/generate", {
      method: "POST",
      body: JSON.stringify({ provider: "elevenlabs" }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("Missing prompt");
  });

  it("returns 503 when ElevenLabs key is missing", async () => {
    const { POST } = await import("./route");
    const request = new Request("http://localhost/api/music/generate", {
      method: "POST",
      body: JSON.stringify({ provider: "elevenlabs", prompt: "test prompt" }),
    });

    const response = await POST(request);
    expect(response.status).toBe(503);
    const data = await response.json();
    expect(data.error).toBe("Missing ELEVENLABS_API_KEY");
  });

  it("calls ElevenLabs API when key is configured", async () => {
    process.env.ELEVENLABS_API_KEY = "test-key";
    const { POST } = await import("./route");

    mockFetch.mockResolvedValueOnce({
      ok: true,
      arrayBuffer: async () => new ArrayBuffer(8),
    });

    const request = new Request("http://localhost/api/music/generate", {
      method: "POST",
      body: JSON.stringify({ provider: "elevenlabs", prompt: "test prompt" }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.url).toContain("/api/music/file/mock-uuid.mp3");
    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.elevenlabs.io/v1/music",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "xi-api-key": "test-key",
        }),
      })
    );
  });

  it("calls Google Lyria API when key is configured", async () => {
    process.env.GEMINI_API_KEY = "google-key";
    const { POST } = await import("./route");

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [
                {
                  inlineData: {
                    mimeType: "audio/mp3",
                    data: Buffer.from("mock-audio-data").toString("base64"),
                  },
                },
              ],
            },
          },
        ],
      }),
    });

    const request = new Request("http://localhost/api/music/generate", {
      method: "POST",
      body: JSON.stringify({ provider: "lyria", prompt: "test prompt" }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.url).toContain("/api/music/file/mock-uuid.mp3");
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("lyria-3-clip-preview:generateContent"),
      expect.objectContaining({
        method: "POST",
      })
    );
  });
});
