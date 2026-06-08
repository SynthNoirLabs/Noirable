"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Drives the on-demand Veo video lifecycle from the client: POST to start
 * (returns a jobId immediately), then poll /api/video/status/[jobId] until the
 * clip is ready or fails. Polling is paced client-side (~6s) so each request is
 * short and the multi-minute generation survives serverless timeouts.
 *
 * The hook never auto-starts — `generate()` is always an explicit user action.
 */

export type VideoGenStatus = "idle" | "starting" | "pending" | "ready" | "failed";

/**
 * Whether on-demand video generation is configured (a Google API key is set).
 * Cached at module scope so the many Video cards on a board share ONE request.
 * Returns null while unknown, then true/false. Used to disable the generate
 * affordances when no key is present.
 */
let videoConfiguredCache: boolean | null = null;
let videoConfiguredPromise: Promise<boolean> | null = null;

export function useVideoConfigured(): boolean | null {
  // Seed from the module cache so a resolved value needs no effect at all.
  const [configured, setConfigured] = useState<boolean | null>(videoConfiguredCache);

  useEffect(() => {
    // Already known (cache populated before mount) → nothing to do.
    if (videoConfiguredCache !== null) return;

    let alive = true;
    if (!videoConfiguredPromise) {
      videoConfiguredPromise = fetch("/api/video/config")
        .then((r) => r.json())
        .then((d: { configured?: boolean }) => {
          videoConfiguredCache = Boolean(d.configured);
          return videoConfiguredCache;
        })
        .catch(() => {
          videoConfiguredCache = false;
          return false;
        });
    }
    videoConfiguredPromise.then((v) => {
      if (alive) setConfigured(v);
    });
    return () => {
      alive = false;
    };
  }, []);

  return configured;
}

export interface GenerateVideoOptions {
  aestheticId?: string;
  videoModel?: string;
  aspectRatio?: string;
}

const POLL_INTERVAL_MS = 6000;
const MAX_POLLS = 60; // ~6 minutes ceiling before giving up

export function useVideoGeneration() {
  const [status, setStatus] = useState<VideoGenStatus>("idle");
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Cancellation + timer handles so an unmount (or a new run) stops polling.
  const activeRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      activeRef.current = false;
      clearTimer();
    };
  }, []);

  const reset = useCallback(() => {
    activeRef.current = false;
    clearTimer();
    setStatus("idle");
    setVideoUrl(null);
    setError(null);
  }, []);

  const generate = useCallback(async (prompt: string, opts: GenerateVideoOptions = {}) => {
    const trimmed = prompt.trim();
    if (!trimmed) return;

    // Supersede any in-flight run.
    activeRef.current = false;
    clearTimer();

    const runId = {};
    const myRun = runId;
    activeRef.current = true;
    setStatus("starting");
    setVideoUrl(null);
    setError(null);

    // True while THIS run is the active one (guards against races/unmount).
    const isCurrent = () => activeRef.current && myRun === runId;

    let jobId: string;
    try {
      const res = await fetch("/api/video/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: trimmed, ...opts }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to start video generation");
      }
      const data = (await res.json()) as { jobId: string };
      jobId = data.jobId;
    } catch (err) {
      if (isCurrent()) {
        setStatus("failed");
        setError(err instanceof Error ? err.message : "Failed to start video generation");
      }
      return;
    }

    if (!isCurrent()) return;
    setStatus("pending");

    let polls = 0;
    const poll = async () => {
      if (!isCurrent()) return;
      polls += 1;
      try {
        const res = await fetch(`/api/video/status/${jobId}`);
        const data = (await res.json().catch(() => ({}))) as {
          status?: VideoGenStatus;
          url?: string;
          error?: string;
        };
        if (!isCurrent()) return;

        if (data.status === "ready" && data.url) {
          setVideoUrl(data.url);
          setStatus("ready");
          return;
        }
        if (data.status === "failed") {
          setStatus("failed");
          setError(data.error || "Video generation failed");
          return;
        }
      } catch {
        // Transient — keep polling until the cap.
      }

      if (!isCurrent()) return;
      if (polls >= MAX_POLLS) {
        setStatus("failed");
        setError("Video generation timed out");
        return;
      }
      timerRef.current = setTimeout(poll, POLL_INTERVAL_MS);
    };

    timerRef.current = setTimeout(poll, POLL_INTERVAL_MS);
  }, []);

  return { status, videoUrl, error, generate, reset };
}
