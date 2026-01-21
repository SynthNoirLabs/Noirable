import { describe, it, expect, vi } from "vitest";
import { POST } from "./route";
import { NextRequest } from "next/server";
import { streamText } from "ai";
import { tools } from "@/lib/ai/tools";

// Mock Vercel AI SDK
vi.mock("ai", () => ({
  streamText: vi.fn().mockReturnValue({
    toDataStreamResponse: vi.fn(() => new Response("mock-stream")), // Keep for compat
    toUIMessageStreamResponse: vi.fn(() => new Response("mock-stream")),
    toTextStreamResponse: vi.fn(() => new Response("mock-stream")),
  }),
  convertToModelMessages: vi.fn(async (msgs) => msgs), // Make async
  tool: vi.fn((config) => config),
}));

// Mock Provider Factory
vi.mock("@/lib/ai/factory", () => ({
  getProviderWithOverrides: vi.fn().mockReturnValue({
    provider: vi.fn().mockReturnValue({}),
    model: "gpt-4o",
    type: "openai",
  }),
}));

import { getProviderWithOverrides } from "@/lib/ai/factory";

// ... existing mocks ...

describe("/api/chat", () => {
  it("exports a POST handler", () => {
    expect(typeof POST).toBe("function");
  });

  it("returns a stream response", async () => {
    const req = new NextRequest("http://localhost/api/chat", {
      method: "POST",
      body: JSON.stringify({ messages: [{ role: "user", content: "Hello" }] }),
    });

    const res = await POST(req);
    expect(res).toBeInstanceOf(Response);
    const text = await res.text();
    expect(text).toBe("mock-stream");
  });

  it("returns local simulation message when provider is mock", async () => {
    vi.mocked(getProviderWithOverrides).mockReturnValueOnce({
      provider: null,
      model: "mock",
      type: "mock",
    });

    const req = new NextRequest("http://localhost/api/chat", {
      method: "POST",
      body: JSON.stringify({ messages: [{ role: "user", content: "Hello" }] }),
    });

    const res = await POST(req);
    const text = await res.text();
    expect(text).toContain("The streets are quiet");
  });

  it("passes tools to streamText", async () => {
    vi.mocked(streamText).mockClear();

    const req = new NextRequest("http://localhost/api/chat", {
      method: "POST",
      body: JSON.stringify({ messages: [{ role: "user", content: "Hello" }] }),
    });

    await POST(req);

    expect(streamText).toHaveBeenCalled();
    const call = vi.mocked(streamText).mock.calls[0]?.[0];
    expect(call?.tools).toBe(tools);
  });

  it("includes evidence in system prompt when provided", async () => {
    vi.mocked(streamText).mockClear();

    const req = new NextRequest("http://localhost/api/chat", {
      method: "POST",
      body: JSON.stringify({
        messages: [{ role: "user", content: "Hello" }],
        evidence: { type: "text", content: "Evidence #1" },
      }),
    });

    await POST(req);

    const call = vi.mocked(streamText).mock.calls[0]?.[0];
    expect(call?.system).toContain("Current Evidence");
    expect(call?.system).toContain("Evidence #1");
  });
});
