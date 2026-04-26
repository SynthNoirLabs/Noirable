import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/api/security", () => ({
  apiSecurityCheck: vi.fn().mockResolvedValue(null),
}));

import { GET } from "./route";

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  process.env = { ...ORIGINAL_ENV };
  delete process.env.OPENAI_API_KEY;
  delete process.env.OPENAI_BASE_URL;
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  vi.unstubAllGlobals();
});

function makeReq(headers: Record<string, string> = {}): Request {
  return new Request("https://example.com/api/openai/status", { headers });
}

describe("/api/openai/status", () => {
  it("returns 503 when no key is provided anywhere", async () => {
    const res = await GET(makeReq());
    expect(res.status).toBe(503);
  });

  it("returns ok when upstream returns 200", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, status: 200 }));
    const res = await GET(makeReq({ "x-openai-api-key": "sk-user" }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean };
    expect(body.ok).toBe(true);
  });

  it("propagates non-200 upstream status", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 401 }));
    const res = await GET(makeReq({ "x-openai-api-key": "sk-bad" }));
    expect(res.status).toBe(401);
  });

  it("returns 502 when fetch throws", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network")));
    const res = await GET(makeReq({ "x-openai-api-key": "sk" }));
    expect(res.status).toBe(502);
  });

  it("falls back to OPENAI_API_KEY env when header is absent", async () => {
    process.env.OPENAI_API_KEY = "sk-env";
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    vi.stubGlobal("fetch", fetchMock);

    const res = await GET(makeReq());
    expect(res.status).toBe(200);
    const callHeaders = fetchMock.mock.calls[0][1].headers as Record<string, string>;
    expect(callHeaders.Authorization).toBe("Bearer sk-env");
  });
});
