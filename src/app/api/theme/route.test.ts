// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mock server-only
vi.mock("server-only", () => ({}));

// Mock the AI factory to a mock provider so generateTheme returns the offline
// mock profile (no network, no API key).
vi.mock("@/lib/ai/factory", () => ({
  getProviderWithOverrides: vi.fn().mockReturnValue({
    provider: null,
    model: "mock",
    type: "mock",
  }),
}));

function makeRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/theme", {
    method: "POST",
    body: typeof body === "string" ? body : JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

describe("/api/theme", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("exports a POST handler", async () => {
    const { POST } = await import("./route");
    expect(typeof POST).toBe("function");
  });

  it("returns 400 for invalid JSON", async () => {
    const { POST } = await import("./route");
    const res = await POST(makeRequest("not json"));
    expect(res.status).toBe(400);
  });

  it("returns 400 for a missing/empty prompt", async () => {
    const { POST } = await import("./route");
    const res = await POST(makeRequest({ prompt: "   " }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(typeof data.error).toBe("string");
  });

  it("returns a generated profile for a valid prompt", async () => {
    const { POST } = await import("./route");
    const res = await POST(makeRequest({ prompt: "a neon cyberpunk alley" }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.profile.name).toBe("a neon cyberpunk alley");
    expect(data.profile.baseAestheticId).toBe("cyber-fixer");
    // Store-owned fields must NOT be present — the client mints them.
    expect(data.profile.id).toBeUndefined();
    expect(data.profile.createdAt).toBeUndefined();
  });

  it("honors a valid base preset hint", async () => {
    const { POST } = await import("./route");
    const res = await POST(makeRequest({ prompt: "anything", baseAestheticId: "minimal" }));
    const data = await res.json();
    expect(data.profile.baseAestheticId).toBe("minimal");
  });

  it("ignores an invalid base preset hint", async () => {
    const { POST } = await import("./route");
    const res = await POST(
      makeRequest({ prompt: "a gothic vampire manor", baseAestheticId: "bogus" })
    );
    const data = await res.json();
    // Falls through to the mock's keyword inference rather than crashing.
    expect(data.success).toBe(true);
    expect(data.profile.baseAestheticId).toBe("gothic-manor");
  });

  it("returns 500 when the provider factory throws", async () => {
    const factory = await import("@/lib/ai/factory");
    vi.mocked(factory.getProviderWithOverrides).mockImplementationOnce(() => {
      throw new Error("No API Key found.");
    });
    const { POST } = await import("./route");
    const res = await POST(makeRequest({ prompt: "valid prompt" }));
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.success).toBe(false);
  });
});
