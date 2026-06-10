import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useVideoGeneration } from "./useVideoGeneration";

/**
 * Unit coverage for the on-demand Veo client lifecycle: the start→poll→ready
 * happy path, the race-supersede guard (a second generate() must stop the
 * first run's polling), and the poll-count timeout. The hook paces polling with
 * setTimeout(POLL_INTERVAL_MS=6000) and caps at MAX_POLLS=60, so we drive it
 * with fake timers and a mocked fetch.
 */

const POLL_INTERVAL_MS = 6000;

const mockFetch = vi.fn();

beforeEach(() => {
  vi.useFakeTimers();
  mockFetch.mockReset();
  vi.stubGlobal("fetch", mockFetch);
});

afterEach(() => {
  vi.runOnlyPendingTimers();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

/** A fetch stub: POST /api/video/generate → jobId; GET status → the given seq. */
function mockLifecycle(jobId: string, statuses: Array<Record<string, unknown>>) {
  let pollIndex = 0;
  mockFetch.mockImplementation((url: string) => {
    if (url === "/api/video/generate") {
      return Promise.resolve({ ok: true, json: async () => ({ jobId }) });
    }
    // status route
    const body = statuses[Math.min(pollIndex, statuses.length - 1)];
    pollIndex += 1;
    return Promise.resolve({ ok: true, json: async () => body });
  });
}

describe("useVideoGeneration", () => {
  it("walks starting → pending → ready when the job completes", async () => {
    mockLifecycle("job-1", [
      { status: "pending" },
      { status: "ready", url: "/api/video/file/x.mp4" },
    ]);

    const { result } = renderHook(() => useVideoGeneration());

    await act(async () => {
      await result.current.generate("a rainy alley");
    });
    // After start resolves the hook is pending, awaiting the first poll.
    expect(result.current.status).toBe("pending");

    // First poll (6s) → still pending.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS);
    });
    // Second poll (another 6s) → ready.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS);
    });

    expect(result.current.status).toBe("ready");
    expect(result.current.videoUrl).toBe("/api/video/file/x.mp4");
    expect(result.current.error).toBeNull();
  });

  it("supersedes an in-flight run when generate() is called again", async () => {
    // First run will keep returning pending forever; second run resolves ready.
    let firstJobPolls = 0;
    mockFetch.mockImplementation((url: string) => {
      if (url === "/api/video/generate") {
        return Promise.resolve({ ok: true, json: async () => ({ jobId: "job-A" }) });
      }
      if (url.includes("job-A")) {
        firstJobPolls += 1;
        return Promise.resolve({ ok: true, json: async () => ({ status: "pending" }) });
      }
      // job-B
      return Promise.resolve({
        ok: true,
        json: async () => ({ status: "ready", url: "/api/video/file/b.mp4" }),
      });
    });

    const { result } = renderHook(() => useVideoGeneration());

    await act(async () => {
      await result.current.generate("first");
    });
    expect(result.current.status).toBe("pending");

    // Restart: point the start response at job-B for the second call.
    mockFetch.mockImplementation((url: string) => {
      if (url === "/api/video/generate") {
        return Promise.resolve({ ok: true, json: async () => ({ jobId: "job-B" }) });
      }
      if (url.includes("job-A")) {
        firstJobPolls += 1;
        return Promise.resolve({ ok: true, json: async () => ({ status: "pending" }) });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ status: "ready", url: "/api/video/file/b.mp4" }),
      });
    });

    await act(async () => {
      await result.current.generate("second");
    });
    const pollsAtRestart = firstJobPolls;

    await act(async () => {
      await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS);
    });

    // The superseded first run must not have polled job-A again.
    expect(firstJobPolls).toBe(pollsAtRestart);
    expect(result.current.status).toBe("ready");
    expect(result.current.videoUrl).toBe("/api/video/file/b.mp4");
  });

  it("fails with a timeout after MAX_POLLS poll attempts", async () => {
    mockLifecycle("job-T", [{ status: "pending" }]); // never ready

    const { result } = renderHook(() => useVideoGeneration());

    await act(async () => {
      await result.current.generate("forever pending");
    });

    // 60 polls × 6s, with a little headroom, drives it past the cap.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS * 61);
    });

    expect(result.current.status).toBe("failed");
    expect(result.current.error).toMatch(/timed out/i);
  });

  it("fails when the start request is not ok", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, json: async () => ({ error: "no key" }) });

    const { result } = renderHook(() => useVideoGeneration());

    await act(async () => {
      await result.current.generate("nope");
    });

    expect(result.current.status).toBe("failed");
    expect(result.current.error).toBe("no key");
  });

  it("reset() returns the hook to idle", async () => {
    mockLifecycle("job-R", [{ status: "pending" }]);
    const { result } = renderHook(() => useVideoGeneration());

    await act(async () => {
      await result.current.generate("x");
    });
    expect(result.current.status).toBe("pending");

    act(() => {
      result.current.reset();
    });
    expect(result.current.status).toBe("idle");
    expect(result.current.videoUrl).toBeNull();
    expect(result.current.error).toBeNull();
  });
});
