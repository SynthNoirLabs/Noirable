import "server-only";

import { isVideoGenerationConfigured } from "@/lib/ai/video";

/**
 * GET /api/video/config — whether on-demand video generation is available
 * (a Google API key is set). The client uses this to disable the Video Lab and
 * the per-component generate button when no key is configured.
 */
export async function GET() {
  return Response.json({ configured: isVideoGenerationConfigured() });
}
