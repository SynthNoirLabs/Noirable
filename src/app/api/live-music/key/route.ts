import "server-only";

import { apiSecurityCheck } from "@/lib/api/security";

/**
 * GET /api/live-music/key — hands the browser the Google API key for the
 * Lyria RealTime websocket (the live music API connects DIRECTLY from the
 * client; there is no server-proxied form). This is a LOCAL-ONLY convenience:
 * the app never deploys, so the key only ever travels to the owner's own
 * browser. Returns 404 when no key is configured so the live score silently
 * stays off.
 */
export async function GET(request: Request): Promise<Response> {
  const securityError = apiSecurityCheck(request);
  if (securityError) return securityError;

  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "Not configured" }, { status: 404 });
  }
  return Response.json({ apiKey });
}
