// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mock server-only
vi.mock("server-only", () => ({}));

// Mock AI factory
vi.mock("@/lib/ai/factory", () => ({
  getProviderWithOverrides: vi.fn().mockReturnValue({
    provider: vi.fn().mockReturnValue({}),
    model: "gpt-4o",
    type: "openai",
  }),
  getProvider: vi.fn().mockReturnValue({
    provider: vi.fn().mockReturnValue({}),
    model: "gpt-4o",
    type: "openai",
  }),
}));

// Mock Vercel AI SDK - must create fresh generator each call
vi.mock("ai", async (importOriginal) => {
  const actual = await importOriginal<typeof import("ai")>();
  return {
    ...actual,
    streamText: vi.fn().mockImplementation(() => {
      // Create a fresh async generator each time streamText is called
      const createFullStream = async function* () {
        yield {
          type: "tool-call",
          toolName: "generate_ui",
          toolCallId: `test-call-${Date.now()}`,
          args: {
            component: {
              id: "text-1",
              component: "Text",
              text: "Hello from AI",
            },
          },
        };
      };

      return {
        fullStream: createFullStream(),
        toUIMessageStreamResponse: vi.fn(() => new Response("mock-stream")),
      };
    }),
  };
});

describe("/api/a2ui/stream", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("exports a POST handler", async () => {
    const { POST } = await import("./route");
    expect(typeof POST).toBe("function");
  });

  it("returns 400 for missing prompt", async () => {
    const { POST } = await import("./route");

    const req = new NextRequest("http://localhost/api/a2ui/stream", {
      method: "POST",
      body: JSON.stringify({}),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const text = await res.text();
    expect(text).toContain("prompt");
  });

  it("returns SSE stream with correct headers", async () => {
    const { POST } = await import("./route");

    const req = new NextRequest("http://localhost/api/a2ui/stream", {
      method: "POST",
      body: JSON.stringify({ prompt: "Create a card" }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("text/event-stream");
    expect(res.headers.get("Cache-Control")).toBe("no-cache");
    expect(res.headers.get("Connection")).toBe("keep-alive");
  });

  it("stream includes createSurface message first", async () => {
    const { POST } = await import("./route");

    const req = new NextRequest("http://localhost/api/a2ui/stream", {
      method: "POST",
      body: JSON.stringify({ prompt: "Create a card" }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req);
    const text = await res.text();
    const lines = text.split("\n").filter((l: string) => l.startsWith("data: "));

    expect(lines.length).toBeGreaterThan(0);

    // First message should be createSurface
    const firstLine = lines[0];
    const firstPayload = firstLine.slice(6); // Remove "data: "
    const firstMessage = JSON.parse(firstPayload);

    expect(firstMessage).toHaveProperty("type", "createSurface");
    expect(firstMessage).toHaveProperty("surfaceId");
    expect(firstMessage).toHaveProperty("catalogId", "standard");
  });

  it("stream includes updateComponents message", async () => {
    const { POST } = await import("./route");

    const req = new NextRequest("http://localhost/api/a2ui/stream", {
      method: "POST",
      body: JSON.stringify({ prompt: "Create a text component" }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req);
    const text = await res.text();
    const lines = text.split("\n").filter((l: string) => l.startsWith("data: "));

    // Find updateComponents message
    const updateLine = lines.find((l: string) => l.includes("updateComponents"));
    expect(updateLine).toBeDefined();

    if (updateLine) {
      const payload = updateLine.slice(6);
      const message = JSON.parse(payload);

      expect(message).toHaveProperty("type", "updateComponents");
      expect(message).toHaveProperty("surfaceId");
      expect(message).toHaveProperty("components");
      expect(Array.isArray(message.components)).toBe(true);
    }
  });

  it("outputs valid JSONL format", async () => {
    const { POST } = await import("./route");

    const req = new NextRequest("http://localhost/api/a2ui/stream", {
      method: "POST",
      body: JSON.stringify({ prompt: "Create a button" }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req);
    const text = await res.text();
    const lines = text.split("\n").filter((l: string) => l.startsWith("data: "));

    // Each line should be valid JSON
    for (const line of lines) {
      const payload = line.slice(6);
      if (payload === "[DONE]") continue;

      expect(() => JSON.parse(payload)).not.toThrow();
    }
  });

  it("handles mock provider gracefully", async () => {
    const { getProviderWithOverrides } = await import("@/lib/ai/factory");
    vi.mocked(getProviderWithOverrides).mockReturnValueOnce({
      provider: null,
      model: "mock",
      type: "mock",
    });

    const { POST } = await import("./route");

    const req = new NextRequest("http://localhost/api/a2ui/stream", {
      method: "POST",
      body: JSON.stringify({ prompt: "Create a card" }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const text = await res.text();
    const lines = text.split("\n").filter((l: string) => l.startsWith("data: "));

    // Should still include createSurface
    expect(lines[0]).toContain("createSurface");
  });

  it("stream ends with [DONE] sentinel", async () => {
    const { POST } = await import("./route");

    const req = new NextRequest("http://localhost/api/a2ui/stream", {
      method: "POST",
      body: JSON.stringify({ prompt: "Create a card" }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req);
    const text = await res.text();

    expect(text).toContain("data: [DONE]");
  });

  it("handles invalid JSON body", async () => {
    const { POST } = await import("./route");

    const req = new NextRequest("http://localhost/api/a2ui/stream", {
      method: "POST",
      body: "not valid json",
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
