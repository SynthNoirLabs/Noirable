import { promises as fs } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

/**
 * Storage for on-demand Veo video generation.
 *
 * Two concerns live here, mirroring the existing media stores:
 *  - Finished mp4 bytes (like musicStore) served via /api/video/file/[name].
 *  - Per-job records that track a long-running Veo operation across the
 *    start → poll → finalize lifecycle, since video generation is async and
 *    spans multiple HTTP requests (start returns immediately; the client polls
 *    status until the bytes are downloaded and saved).
 */

const MEDIA_TYPE_TO_EXT: Record<string, string> = {
  "video/mp4": "mp4",
  "video/webm": "webm",
};

const EXT_TO_MEDIA_TYPE: Record<string, string> = {
  ".mp4": "video/mp4",
  ".webm": "video/webm",
};

const FILENAME_PATTERN = /^[a-zA-Z0-9_-]+\.(mp4|webm)$/;
const JOB_ID_PATTERN = /^[a-zA-Z0-9_-]+$/;

export function getVideoStoreDir() {
  return process.env.A2UI_VIDEO_DIR ?? path.join(process.cwd(), ".data", "video");
}

export function isValidVideoFilename(fileName: string) {
  return FILENAME_PATTERN.test(fileName);
}

export function isValidJobId(jobId: string) {
  return JOB_ID_PATTERN.test(jobId);
}

export async function saveVideoBuffer(
  buffer: Buffer,
  mediaType: string
): Promise<{ url: string; fileName: string; filePath: string } | null> {
  const ext = MEDIA_TYPE_TO_EXT[mediaType] || "mp4";
  const dir = getVideoStoreDir();
  await fs.mkdir(dir, { recursive: true });

  const id = crypto.randomUUID();
  const fileName = `${id}.${ext}`;
  const filePath = path.join(dir, fileName);

  await fs.writeFile(filePath, buffer);

  return { url: `/api/video/file/${fileName}`, fileName, filePath };
}

export async function readVideoFile(fileName: string): Promise<{
  data: Buffer;
  contentType: string;
} | null> {
  if (!isValidVideoFilename(fileName)) return null;

  const dir = getVideoStoreDir();
  const filePath = path.join(dir, fileName);
  const data = await fs.readFile(filePath).catch(() => null);
  if (!data) return null;

  const ext = path.extname(fileName).toLowerCase();
  const contentType = EXT_TO_MEDIA_TYPE[ext] || "video/mp4";

  return { data, contentType };
}

/**
 * A long-running video generation job. `operationName` is the Veo
 * `operations/...` handle returned by predictLongRunning; the status route
 * polls it and, on completion, downloads the mp4, saves it, and flips the
 * record to "ready" with the served `url` (or "failed" with an `error`).
 */
export interface VideoJob {
  status: "pending" | "ready" | "failed";
  /** Veo long-running operation name, used to poll completion. */
  operationName: string;
  /** The prompt the clip was generated from (for display / history). */
  prompt: string;
  /** Served URL of the finished clip, set once status is "ready". */
  url?: string;
  /** Human-readable failure reason, set once status is "failed". */
  error?: string;
  /** Creation timestamp (ms), passed in by the caller (no Date.now in libs). */
  createdAt: number;
}

function jobPath(jobId: string): string {
  return path.join(getVideoStoreDir(), `job-${jobId}.json`);
}

export async function saveVideoJob(jobId: string, job: VideoJob): Promise<void> {
  if (!isValidJobId(jobId)) return;
  const dir = getVideoStoreDir();
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(jobPath(jobId), JSON.stringify(job, null, 2), "utf8");
}

export async function getVideoJob(jobId: string): Promise<VideoJob | null> {
  if (!isValidJobId(jobId)) return null;
  const data = await fs.readFile(jobPath(jobId), "utf8").catch(() => null);
  if (!data) return null;
  try {
    return JSON.parse(data) as VideoJob;
  } catch {
    return null;
  }
}

export async function deleteVideoJob(jobId: string): Promise<void> {
  if (!isValidJobId(jobId)) return;
  await fs.unlink(jobPath(jobId)).catch(() => null);
}
