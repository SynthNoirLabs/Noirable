import "server-only";

import crypto from "node:crypto";
import { apiSecurityCheck } from "@/lib/api/security";
import { isVideoGenerationConfigured, startVideoGeneration } from "@/lib/ai/video";
import { saveVideoJob } from "@/lib/ai/videoStore";

interface VideoGenerateRequest {
  prompt?: string;
  aestheticId?: string;
  videoModel?: string;
  aspectRatio?: string;
}

/**
 * POST /api/video/generate
 *
 * Starts an on-demand Veo generation and returns a `jobId` IMMEDIATELY (the
 * long-running operation is polled separately via /api/video/status/[jobId]).
 * Never invoked during UI/chat generation — video is explicit + on demand.
 */
export async function POST(request: Request) {
  const securityError = apiSecurityCheck(request);
  if (securityError) return securityError;

  if (!isVideoGenerationConfigured()) {
    return Response.json(
      { error: "Set GOOGLE_GENERATIVE_AI_API_KEY or GEMINI_API_KEY to enable video generation" },
      { status: 503 }
    );
  }

  let body: VideoGenerateRequest | null = null;
  try {
    body = (await request.json()) as VideoGenerateRequest;
  } catch {
    body = null;
  }

  const prompt = body?.prompt?.trim() ?? "";
  if (!prompt) {
    return Response.json({ error: "Missing prompt" }, { status: 400 });
  }

  const result = await startVideoGeneration({
    prompt,
    aestheticId: body?.aestheticId,
    videoModel: body?.videoModel,
    aspectRatio: body?.aspectRatio,
  });

  if (!result.ok || !result.operationName) {
    return Response.json({ error: result.error ?? "Failed to start" }, { status: result.status });
  }

  const jobId = crypto.randomUUID();
  await saveVideoJob(jobId, {
    status: "pending",
    operationName: result.operationName,
    prompt,
    createdAt: Date.now(),
  });

  return Response.json({ jobId, status: "pending" });
}
