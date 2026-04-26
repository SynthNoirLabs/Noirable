import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { summarizeChatRequest, logChatRequest } from "./logger";

vi.mock("server-only", () => ({}));

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  process.env = { ...ORIGINAL_ENV };
  delete process.env.NODE_ENV;
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  vi.restoreAllMocks();
});

describe("summarizeChatRequest", () => {
  it("returns zeros for an empty body", () => {
    const result = summarizeChatRequest({});
    expect(result.messageCount).toBe(0);
    expect(result.lastMessageRole).toBeUndefined();
    expect(result.lastMessageChars).toBeUndefined();
    expect(result.hasEvidence).toBe(false);
  });

  it("counts messages and records role of last message", () => {
    const messages = [
      { id: "1", role: "user" as const, parts: [{ type: "text" as const, text: "hello" }] },
      {
        id: "2",
        role: "assistant" as const,
        parts: [{ type: "text" as const, text: "world!" }],
      },
    ];
    const result = summarizeChatRequest({ messages });
    expect(result.messageCount).toBe(2);
    expect(result.lastMessageRole).toBe("assistant");
    expect(result.lastMessageChars).toBe(6); // "world!".length
  });

  it("counts characters across multiple text parts", () => {
    const messages = [
      {
        id: "1",
        role: "user" as const,
        parts: [
          { type: "text" as const, text: "foo" },
          { type: "text" as const, text: "bar" },
        ],
      },
    ];
    const result = summarizeChatRequest({ messages });
    expect(result.lastMessageChars).toBe(6); // "foo" + "bar"
  });

  it("skips non-text parts when counting chars", () => {
    const messages = [
      {
        id: "1",
        role: "user" as const,
        parts: [
          { type: "text" as const, text: "hello" },
          {
            type: "tool-invocation" as const,
            toolCallId: "tc1",
            toolName: "x",
            state: "call" as const,
            input: {},
          },
        ],
      },
    ];
    const result = summarizeChatRequest({ messages });
    expect(result.lastMessageChars).toBe(5);
  });

  it("sets hasEvidence=true when evidence is present", () => {
    const result = summarizeChatRequest({ evidence: { type: "card" } });
    expect(result.hasEvidence).toBe(true);
  });

  it("sets hasEvidence=false when evidence is null", () => {
    const result = summarizeChatRequest({ evidence: null });
    expect(result.hasEvidence).toBe(false);
  });

  it("captures aestheticId and modelConfig", () => {
    const result = summarizeChatRequest({
      aestheticId: "noir",
      modelConfig: { provider: "openai", model: "gpt-4o" },
    });
    expect(result.aestheticId).toBe("noir");
    expect(result.modelProvider).toBe("openai");
    expect(result.modelName).toBe("gpt-4o");
  });

  it("does not include message content in the summary", () => {
    const messages = [
      {
        id: "1",
        role: "user" as const,
        parts: [{ type: "text" as const, text: "my secret password is 1234" }],
      },
    ];
    const result = summarizeChatRequest({ messages });
    // The summary must not leak the actual text
    expect(JSON.stringify(result)).not.toContain("secret");
    expect(JSON.stringify(result)).not.toContain("1234");
    // Shape must still be correct
    expect(result.messageCount).toBe(1);
    expect(result.lastMessageRole).toBe("user");
    expect(typeof result.lastMessageChars).toBe("number");
    expect(result.hasEvidence).toBe(false);
  });
});

describe("logChatRequest", () => {
  it("calls console.log outside of production", () => {
    process.env.NODE_ENV = "development";
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    logChatRequest({
      messages: [
        { id: "1", role: "user" as const, parts: [{ type: "text" as const, text: "hi" }] },
      ],
    });
    expect(logSpy).toHaveBeenCalledOnce();
    expect(logSpy.mock.calls[0][0]).toBe("[chat] request");
  });

  it("does NOT log in production", () => {
    process.env.NODE_ENV = "production";
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    logChatRequest({
      messages: [
        { id: "1", role: "user" as const, parts: [{ type: "text" as const, text: "hi" }] },
      ],
    });
    expect(logSpy).not.toHaveBeenCalled();
  });
});
