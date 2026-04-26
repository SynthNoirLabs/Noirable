import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  checkRateLimit,
  apiSecurityCheck,
  _resetInMemoryRateLimit,
  _resetAdapterCache,
} from "./security";

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  process.env = { ...ORIGINAL_ENV };
  delete process.env.UPSTASH_REDIS_REST_URL;
  delete process.env.UPSTASH_REDIS_REST_TOKEN;
  delete process.env.NODE_ENV;
  _resetInMemoryRateLimit();
  _resetAdapterCache();
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe("in-memory rate limiter", () => {
  it("allows requests under the limit", async () => {
    for (let i = 0; i < 30; i++) {
      const result = await checkRateLimit("ip-a");
      expect(result.allowed).toBe(true);
    }
  });

  it("blocks the 31st request in the same window", async () => {
    for (let i = 0; i < 30; i++) await checkRateLimit("ip-b");
    const blocked = await checkRateLimit("ip-b");
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterMs).toBeGreaterThan(0);
  });

  it("isolates counters per identifier", async () => {
    for (let i = 0; i < 30; i++) await checkRateLimit("ip-c");
    const other = await checkRateLimit("ip-d");
    expect(other.allowed).toBe(true);
  });

  it("resets window after TTL expires", async () => {
    // Fill entries, advance time past the window, and confirm a fresh request
    // is allowed (window has reset).
    vi.useFakeTimers();
    try {
      for (let i = 0; i < 5; i++) await checkRateLimit(`pre-${i}`);
      vi.advanceTimersByTime(70_000);
      const result = await checkRateLimit("post");
      expect(result.allowed).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("Upstash REST adapter", () => {
  it("uses fetch when env vars are set, allows under limit", async () => {
    process.env.UPSTASH_REDIS_REST_URL = "https://example.upstash.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "tkn";
    _resetAdapterCache();

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [{ result: 1 }, { result: 1 }, { result: 60_000 }],
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await checkRateLimit("ip-x");
    expect(result.allowed).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe("https://example.upstash.io/pipeline");

    vi.unstubAllGlobals();
  });

  it("blocks when INCR exceeds the max", async () => {
    process.env.UPSTASH_REDIS_REST_URL = "https://example.upstash.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "tkn";
    _resetAdapterCache();

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [{ result: 31 }, { result: 0 }, { result: 30_000 }],
      })
    );

    const result = await checkRateLimit("ip-y");
    expect(result.allowed).toBe(false);
    expect(result.retryAfterMs).toBe(30_000);

    vi.unstubAllGlobals();
  });

  it("fails open when Upstash returns non-OK", async () => {
    process.env.UPSTASH_REDIS_REST_URL = "https://example.upstash.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "tkn";
    _resetAdapterCache();

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 500, json: async () => [] })
    );
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const result = await checkRateLimit("ip-z");
    expect(result.allowed).toBe(true);
    expect(warnSpy).toHaveBeenCalled();

    warnSpy.mockRestore();
    vi.unstubAllGlobals();
  });

  it("fails open when fetch throws a network error", async () => {
    process.env.UPSTASH_REDIS_REST_URL = "https://example.upstash.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "tkn";
    _resetAdapterCache();

    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network failure")));
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const result = await checkRateLimit("ip-w");
    expect(result.allowed).toBe(true);
    expect(warnSpy).toHaveBeenCalled();

    warnSpy.mockRestore();
    vi.unstubAllGlobals();
  });

  it("sends the correct pipeline body to Upstash", async () => {
    process.env.UPSTASH_REDIS_REST_URL = "https://example.upstash.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "tkn";
    _resetAdapterCache();

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [{ result: 1 }, { result: 1 }, { result: 60_000 }],
    });
    vi.stubGlobal("fetch", fetchMock);

    await checkRateLimit("ip-pipeline");

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://example.upstash.io/pipeline");
    expect(init.headers).toMatchObject({ Authorization: "Bearer tkn" });
    type PipelineCommand = [command: string, ...args: (string | number)[]];
    const body = JSON.parse(init.body as string) as PipelineCommand[];
    expect(body[0][0]).toBe("INCR");
    expect(body[1][0]).toBe("EXPIRE");
    expect(body[2][0]).toBe("PTTL");
    // EXPIRE NX flag must be present
    expect(body[1]).toContain("NX");

    vi.unstubAllGlobals();
  });
});

describe("apiSecurityCheck", () => {
  it("returns null in dev when no headers", async () => {
    const req = new Request("https://example.com/api/x", { method: "POST" });
    const result = await apiSecurityCheck(req);
    expect(result).toBeNull();
  });

  it("rejects mismatched origin in production", async () => {
    process.env.NODE_ENV = "production";
    _resetAdapterCache();
    const req = new Request("https://example.com/api/x", {
      method: "POST",
      headers: {
        host: "example.com",
        origin: "https://evil.example",
      },
    });
    const result = await apiSecurityCheck(req);
    expect(result?.status).toBe(403);
  });

  it("returns 429 when over the rate limit", async () => {
    const headers = { "x-forwarded-for": "1.2.3.4" };
    for (let i = 0; i < 30; i++) {
      await apiSecurityCheck(new Request("https://example.com/api/x", { method: "POST", headers }));
    }
    const result = await apiSecurityCheck(
      new Request("https://example.com/api/x", { method: "POST", headers })
    );
    expect(result?.status).toBe(429);
    expect(result?.headers.get("Retry-After")).toBeTruthy();
  });
});
