import "server-only";

import { apiSecurityCheck } from "@/lib/api/security";

const OPENAI_BASE = process.env.OPENAI_BASE_URL?.replace(/\/$/, "") ?? "https://api.openai.com/v1";

/**
 * Lightweight probe for an OpenAI-compatible API key.
 * Accepts user-provided key via x-openai-api-key header (preferred) or
 * falls back to OPENAI_API_KEY env. Returns 200 when the key can list models,
 * 401/403 when the key is rejected.
 */
export async function GET(request: Request): Promise<Response> {
  const securityError = await apiSecurityCheck(request);
  if (securityError) return securityError;

  const headerKey = request.headers.get("x-openai-api-key");
  const apiKey = headerKey || process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return Response.json(
      { ok: false, reason: "Missing API key" },
      { status: 503, statusText: "OpenAI not configured" }
    );
  }

  try {
    const res = await fetch(`${OPENAI_BASE}/models`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (res.ok) {
      return Response.json({ ok: true });
    }

    return Response.json(
      { ok: false, reason: `Upstream returned ${res.status}` },
      { status: res.status }
    );
  } catch (err) {
    return Response.json(
      { ok: false, reason: err instanceof Error ? err.message : "Network error" },
      { status: 502 }
    );
  }
}
