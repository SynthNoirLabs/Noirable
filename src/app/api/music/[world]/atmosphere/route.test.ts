import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mock the disk-cache store so tests don't touch the filesystem.
const mockReadAtmosphereMusic = vi.fn();
const mockSaveAtmosphereMusic = vi.fn();
const mockDeleteAtmosphereMusic = vi.fn();
vi.mock("@/lib/ai/atmosphereMusicStore", () => ({
  readAtmosphereMusic: (world: string) => mockReadAtmosphereMusic(world),
  saveAtmosphereMusic: (world: string, data: Buffer) => mockSaveAtmosphereMusic(world, data),
  deleteAtmosphereMusic: (world: string) => mockDeleteAtmosphereMusic(world),
}));

// Mock the ElevenLabs client so no network call is made.
const mockElevenLabsFetch = vi.fn();
vi.mock("@/lib/elevenlabs/client", () => ({
  elevenLabsFetch: (path: string, init?: RequestInit) => mockElevenLabsFetch(path, init),
}));

function makeRequest(url: string): NextRequest {
  return new NextRequest(new Request(url));
}

describe("/api/music/[world]/atmosphere", () => {
  beforeEach(() => {
    mockReadAtmosphereMusic.mockReset();
    mockSaveAtmosphereMusic.mockReset();
    mockDeleteAtmosphereMusic.mockReset();
    mockElevenLabsFetch.mockReset();
    delete process.env.ELEVENLABS_API_KEY;
  });

  it("returns cached bytes immutable on a cache hit", async () => {
    mockReadAtmosphereMusic.mockResolvedValueOnce({
      data: Buffer.from("cached-music"),
      contentType: "audio/mpeg",
    });
    const { GET } = await import("./route");

    const response = await GET(makeRequest("http://localhost/api/music/grand-hotel/atmosphere"), {
      params: Promise.resolve({ world: "grand-hotel" }),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("audio/mpeg");
    expect(response.headers.get("Cache-Control")).toBe("public, max-age=31536000, immutable");
    expect(Buffer.from(await response.arrayBuffer()).toString()).toBe("cached-music");
    expect(mockElevenLabsFetch).not.toHaveBeenCalled();
  });

  it("redirects to the noir fallback when no key is configured", async () => {
    mockReadAtmosphereMusic.mockResolvedValueOnce(null);
    const { GET } = await import("./route");

    const response = await GET(makeRequest("http://localhost/api/music/grand-hotel/atmosphere"), {
      params: Promise.resolve({ world: "grand-hotel" }),
    });

    expect(response.status).toBe(307);
    expect(response.headers.get("Location")).toContain("/assets/noir/noir-jazz-loop.mp3");
    expect(mockElevenLabsFetch).not.toHaveBeenCalled();
  });

  it("generates, caches, and serves bytes when a key is configured", async () => {
    process.env.ELEVENLABS_API_KEY = "test-key";
    mockReadAtmosphereMusic.mockResolvedValueOnce(null);
    mockElevenLabsFetch.mockResolvedValueOnce({
      ok: true,
      arrayBuffer: async () => Buffer.from("fresh-music"),
    });
    const { GET } = await import("./route");

    const response = await GET(makeRequest("http://localhost/api/music/grand-hotel/atmosphere"), {
      params: Promise.resolve({ world: "grand-hotel" }),
    });

    expect(response.status).toBe(200);
    expect(Buffer.from(await response.arrayBuffer()).toString()).toBe("fresh-music");
    expect(mockElevenLabsFetch).toHaveBeenCalledWith(
      "/music",
      expect.objectContaining({ method: "POST" })
    );
    expect(mockSaveAtmosphereMusic).toHaveBeenCalledWith("grand-hotel", expect.anything());
  });

  it("404s for an unknown world", async () => {
    const { GET } = await import("./route");

    const response = await GET(makeRequest("http://localhost/api/music/not-a-world/atmosphere"), {
      params: Promise.resolve({ world: "not-a-world" }),
    });

    expect(response.status).toBe(404);
    expect(mockReadAtmosphereMusic).not.toHaveBeenCalled();
  });
});
