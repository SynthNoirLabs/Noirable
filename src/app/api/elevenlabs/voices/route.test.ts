import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock server-only
vi.mock("server-only", () => ({}));

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("/api/elevenlabs/voices", () => {
  beforeEach(() => {
    vi.resetModules();
    mockFetch.mockReset();
    // Clear env
    delete process.env.ELEVENLABS_API_KEY;
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns 401 when no API key provided", async () => {
    const { GET } = await import("./route");
    const request = new Request("http://localhost/api/elevenlabs/voices");

    const response = await GET(request);

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toBe("Missing API key");
  });

  it("uses API key from header", async () => {
    const { GET, clearVoiceCache } = await import("./route");
    clearVoiceCache();

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        voices: [
          {
            voice_id: "v1",
            name: "Voice 1",
            preview_url: "http://example.com/v1.mp3",
            labels: { accent: "american" },
            description: "Test",
          },
        ],
      }),
    });

    const request = new Request("http://localhost/api/elevenlabs/voices", {
      headers: { "x-elevenlabs-api-key": "test-key" },
    });

    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.elevenlabs.io/v1/voices",
      expect.objectContaining({
        headers: expect.objectContaining({
          "xi-api-key": "test-key",
        }),
      })
    );
  });

  it("uses API key from environment", async () => {
    process.env.ELEVENLABS_API_KEY = "env-key";
    const { GET, clearVoiceCache } = await import("./route");
    clearVoiceCache();

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ voices: [] }),
    });

    const request = new Request("http://localhost/api/elevenlabs/voices");
    await GET(request);

    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.elevenlabs.io/v1/voices",
      expect.objectContaining({
        headers: expect.objectContaining({
          "xi-api-key": "env-key",
        }),
      })
    );
  });

  it("transforms voice data correctly", async () => {
    process.env.ELEVENLABS_API_KEY = "test-key";
    const { GET, clearVoiceCache } = await import("./route");
    clearVoiceCache();

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        voices: [
          {
            voice_id: "abc123",
            name: "Detective Voice",
            preview_url: "http://example.com/preview.mp3",
            labels: { accent: "british", gender: "male" },
            description: "A gruff detective voice",
          },
        ],
      }),
    });

    const request = new Request("http://localhost/api/elevenlabs/voices");
    const response = await GET(request);
    const data = await response.json();

    expect(data.voices).toHaveLength(1);
    expect(data.voices[0]).toEqual({
      id: "abc123",
      name: "Detective Voice",
      previewUrl: "http://example.com/preview.mp3",
      labels: { accent: "british", gender: "male" },
      description: "A gruff detective voice",
    });
  });

  it("handles ElevenLabs API errors", async () => {
    process.env.ELEVENLABS_API_KEY = "test-key";
    const { GET, clearVoiceCache } = await import("./route");
    clearVoiceCache();

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      text: async () => "Invalid API key",
    });

    const request = new Request("http://localhost/api/elevenlabs/voices");
    const response = await GET(request);

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toBe("ElevenLabs API error");
  });

  it("caches responses for env key", async () => {
    process.env.ELEVENLABS_API_KEY = "test-key";
    const { GET, clearVoiceCache } = await import("./route");
    clearVoiceCache();

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        voices: [
          {
            voice_id: "v1",
            name: "Voice",
            preview_url: null,
            labels: {},
            description: null,
          },
        ],
      }),
    });

    const request = new Request("http://localhost/api/elevenlabs/voices");

    // First call
    await GET(request);
    // Second call (should use cache)
    await GET(request);

    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("does not cache when using header key", async () => {
    const { GET, clearVoiceCache } = await import("./route");
    clearVoiceCache();

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ voices: [] }),
    });

    const request1 = new Request("http://localhost/api/elevenlabs/voices", {
      headers: { "x-elevenlabs-api-key": "key1" },
    });
    const request2 = new Request("http://localhost/api/elevenlabs/voices", {
      headers: { "x-elevenlabs-api-key": "key2" },
    });

    await GET(request1);
    await GET(request2);

    expect(mockFetch).toHaveBeenCalledTimes(2);
  });
});
