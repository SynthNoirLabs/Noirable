import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  parseSSELine,
  parseSSEStream,
  createStreamParser,
  type StreamParserOptions,
} from "./stream-parser";

describe("parseSSELine", () => {
  it("parses valid SSE data line", () => {
    const line = 'data: {"type":"text","content":"hello"}';
    const result = parseSSELine(line);

    expect(result).toEqual({
      success: true,
      data: { type: "text", content: "hello" },
    });
  });

  it("returns null for empty lines", () => {
    expect(parseSSELine("")).toBeNull();
    expect(parseSSELine("   ")).toBeNull();
  });

  it("returns null for [DONE] sentinel", () => {
    const result = parseSSELine("data: [DONE]");
    expect(result).toBeNull();
  });

  it("returns null for non-data lines", () => {
    expect(parseSSELine("event: message")).toBeNull();
    expect(parseSSELine("id: 123")).toBeNull();
    expect(parseSSELine(": comment")).toBeNull();
  });

  it("returns error for malformed JSON", () => {
    const line = "data: {invalid json}";
    const result = parseSSELine(line);

    expect(result).toMatchObject({
      success: false,
      error: expect.objectContaining({
        type: "parse_error",
        message: expect.stringContaining("JSON"),
        raw: "{invalid json}",
      }),
    });
  });

  it("handles whitespace around data prefix", () => {
    const line = 'data:  { "type": "text" }  ';
    const result = parseSSELine(line);

    expect(result).toEqual({
      success: true,
      data: { type: "text" },
    });
  });
});

describe("parseSSEStream", () => {
  it("parses multiple valid messages from stream text", () => {
    const sseText = [
      'data: {"type":"start"}',
      'data: {"type":"text","content":"hello"}',
      'data: {"type":"text","content":"world"}',
      "data: [DONE]",
    ].join("\n");

    const result = parseSSEStream(sseText);

    expect(result.messages).toHaveLength(3);
    expect(result.messages[0]).toEqual({ type: "start" });
    expect(result.messages[1]).toEqual({ type: "text", content: "hello" });
    expect(result.messages[2]).toEqual({ type: "text", content: "world" });
    expect(result.errors).toHaveLength(0);
  });

  it("collects errors for malformed messages (not silent drop)", () => {
    const sseText = ['data: {"type":"valid"}', "data: {broken", 'data: {"type":"also valid"}'].join(
      "\n"
    );

    const result = parseSSEStream(sseText);

    expect(result.messages).toHaveLength(2);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toMatchObject({
      type: "parse_error",
      raw: "{broken",
    });
  });

  it("handles CRLF line endings", () => {
    const sseText = 'data: {"a":1}\r\ndata: {"b":2}\r\n';
    const result = parseSSEStream(sseText);

    expect(result.messages).toHaveLength(2);
    expect(result.messages).toEqual([{ a: 1 }, { b: 2 }]);
  });

  it("handles large messages (64KB+)", () => {
    const largeContent = "x".repeat(70000); // > 64KB
    const sseText = `data: {"content":"${largeContent}"}`;
    const result = parseSSEStream(sseText);

    expect(result.messages).toHaveLength(1);
    expect(result.messages[0]).toEqual({ content: largeContent });
    expect(result.errors).toHaveLength(0);
  });
});

describe("createStreamParser", () => {
  let onMessage: ReturnType<typeof vi.fn>;
  let onError: ReturnType<typeof vi.fn>;
  let onConnect: ReturnType<typeof vi.fn>;
  let onDisconnect: ReturnType<typeof vi.fn>;
  let options: StreamParserOptions;

  beforeEach(() => {
    onMessage = vi.fn();
    onError = vi.fn();
    onConnect = vi.fn();
    onDisconnect = vi.fn();
    options = { onMessage, onError, onConnect, onDisconnect };
  });

  it("emits connect event on start", () => {
    const parser = createStreamParser(options);
    parser.connect();

    expect(onConnect).toHaveBeenCalledTimes(1);
  });

  it("emits disconnect event on close", () => {
    const parser = createStreamParser(options);
    parser.connect();
    parser.close();

    expect(onDisconnect).toHaveBeenCalledTimes(1);
    expect(onDisconnect).toHaveBeenCalledWith({ reason: "closed" });
  });

  it("emits message events for valid data", () => {
    const parser = createStreamParser(options);
    parser.connect();
    parser.feed('data: {"type":"test"}\n');

    expect(onMessage).toHaveBeenCalledWith({ type: "test" });
  });

  it("emits error events for malformed JSON (not silent)", () => {
    const parser = createStreamParser(options);
    parser.connect();
    parser.feed("data: {broken\n");

    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "parse_error",
        raw: "{broken",
      })
    );
  });

  it("handles chunked data across multiple feeds", () => {
    const parser = createStreamParser(options);
    parser.connect();

    // Feed data in chunks (simulating network fragmentation)
    parser.feed('data: {"type":');
    parser.feed('"chunked"}\n');

    expect(onMessage).toHaveBeenCalledWith({ type: "chunked" });
  });

  it("handles reconnection", () => {
    const parser = createStreamParser(options);
    parser.connect();
    parser.close();
    parser.connect();

    expect(onConnect).toHaveBeenCalledTimes(2);
    expect(onDisconnect).toHaveBeenCalledTimes(1);
  });

  it("emits disconnect with error reason on connection error", () => {
    const parser = createStreamParser(options);
    parser.connect();
    parser.error(new Error("Network failure"));

    expect(onDisconnect).toHaveBeenCalledWith({
      reason: "error",
      error: expect.any(Error),
    });
  });

  it("tracks connection state", () => {
    const parser = createStreamParser(options);

    expect(parser.isConnected()).toBe(false);
    parser.connect();
    expect(parser.isConnected()).toBe(true);
    parser.close();
    expect(parser.isConnected()).toBe(false);
  });

  it("buffers incomplete lines until newline received", () => {
    const parser = createStreamParser(options);
    parser.connect();

    parser.feed('data: {"partial":');
    expect(onMessage).not.toHaveBeenCalled();

    parser.feed('true}\ndata: {"complete":true}\n');
    expect(onMessage).toHaveBeenCalledTimes(2);
    expect(onMessage).toHaveBeenNthCalledWith(1, { partial: true });
    expect(onMessage).toHaveBeenNthCalledWith(2, { complete: true });
  });
});
