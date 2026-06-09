import "server-only";

import { NextRequest } from "next/server";
import { apiSecurityCheck } from "@/lib/api/security";
import { downloadVideo, pollVideoOperation } from "@/lib/ai/video";
import { getVideoJob, saveVideoJob, saveVideoBuffer } from "@/lib/ai/videoStore";

export const runtime = "nodejs";

/**
 * GET /api/video/status/[jobId]
 *
 * Polls a long-running Veo job. The client calls this every ~10s:
 *  - "pending"  → operation still running (or just polled, still not done)
 *  - "ready"    → clip downloaded + saved; `url` points at the served mp4
 *  - "failed"   → `error` explains why
 *
 * Once done, the finished bytes are downloaded, persisted, and the job record
 * is flipped to a terminal state so subsequent polls return instantly without
 * re-hitting Veo.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const securityError = apiSecurityCheck(request);
  if (securityError) return securityError;

  const { jobId } = await params;
  const job = await getVideoJob(jobId);
  if (!job) {
    return Response.json({ error: "Unknown job" }, { status: 404 });
  }

  // Terminal states are cached on the record — return them without polling.
  if (job.status === "ready") {
    return Response.json({ status: "ready", url: job.url, prompt: job.prompt });
  }
  if (job.status === "failed") {
    return Response.json({ status: "failed", error: job.error, prompt: job.prompt });
  }

  const poll = await pollVideoOperation(job.operationName);

  if (!poll.ok && !poll.done) {
    // Transient poll error — leave the job pending so the client retries.
    return Response.json({ status: "pending" });
  }

  if (!poll.done) {
    return Response.json({ status: "pending" });
  }

  // Operation finished. Either it errored, or we have a download URI.
  if (!poll.ok || !poll.videoUri) {
    const error = poll.error ?? "Video generation failed";
    await saveVideoJob(jobId, { ...job, status: "failed", error });
    return Response.json({ status: "failed", error, prompt: job.prompt });
  }

  const downloaded = await downloadVideo(poll.videoUri);
  if (!downloaded) {
    const error = "Failed to download the generated video";
    await saveVideoJob(jobId, { ...job, status: "failed", error });
    return Response.json({ status: "failed", error, prompt: job.prompt });
  }

  // Concurrency guard: if another in-flight poll for this same job already
  // finalized it while we were downloading, defer to that result and discard
  // ours — otherwise two simultaneous polls would each save a clip and orphan
  // one of the files. (The client polls serially, so this is a belt-and-braces
  // guard against overlapping requests / double-invocation.)
  const current = await getVideoJob(jobId);
  if (current && current.status !== "pending") {
    return Response.json({
      status: current.status,
      url: current.url,
      error: current.error,
      prompt: current.prompt,
    });
  }

  const saved = await saveVideoBuffer(downloaded.buffer, downloaded.mediaType);
  if (!saved) {
    const error = "Failed to save the generated video";
    await saveVideoJob(jobId, { ...job, status: "failed", error });
    return Response.json({ status: "failed", error, prompt: job.prompt });
  }

  await saveVideoJob(jobId, { ...job, status: "ready", url: saved.url });
  return Response.json({ status: "ready", url: saved.url, prompt: job.prompt });
}
