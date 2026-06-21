import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { SurfaceRenderer } from "../SurfaceRenderer";
import type { SurfaceState, SurfaceComponent } from "@/lib/a2ui/surfaces/manager";

function makeSurface(
  components: SurfaceComponent[],
  dataModel: Record<string, unknown> = {}
): SurfaceState {
  return {
    config: { surfaceId: "s1", catalogId: "standard" },
    components: new Map(components.map((c) => [c.id, c])),
    dataModel,
    createdAt: 0,
  };
}

/** A stateImage whose `/door` flag drives a closed→open edit. */
function doorSurface(door: string): SurfaceState {
  return makeSurface(
    [
      {
        id: "root",
        component: "StateImage",
        base: "/api/images/base.jpg",
        value: { path: "/door" },
        states: [{ state: "open", instruction: "the blast door is now open" }],
        alt: "Blast door",
      },
    ],
    { door }
  );
}

describe("StateImageRenderer", () => {
  // Route by URL: PhotoDeveloper's useVideoConfigured pings /api/video/config,
  // so a bare once-mock would starve it. `forkResponse` is what /fork returns.
  let forkResponse: { ok: boolean; status?: number; body?: unknown } = { ok: false, status: 502 };
  const fetchMock = vi.fn((url: unknown, _init?: unknown): Promise<unknown> => {
    if (typeof url === "string" && url.endsWith("/fork")) {
      return Promise.resolve({
        ok: forkResponse.ok,
        status: forkResponse.status ?? 200,
        json: async () => forkResponse.body ?? {},
      });
    }
    // /api/video/config and anything else: a benign "not configured" reply.
    return Promise.resolve({ ok: true, json: async () => ({ configured: false }) });
  });

  beforeEach(() => {
    forkResponse = { ok: false, status: 502 };
    fetchMock.mockClear();
    vi.stubGlobal("fetch", fetchMock);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  /** Count only the /fork calls (ignore the video-config ping). */
  const forkCalls = () => fetchMock.mock.calls.filter(([u]) => String(u).endsWith("/fork"));

  it("shows the base image and does not fork while in the base state", () => {
    const { container } = render(<SurfaceRenderer surface={doorSurface("")} theme="noir" />);
    const imgEl = container.querySelector("img");
    expect(imgEl?.getAttribute("src")).toBe("/api/images/base.jpg");
    expect(forkCalls()).toHaveLength(0);
  });

  it("forks an edit when the bound value selects a state, then shows the edited url", async () => {
    forkResponse = { ok: true, body: { url: "/api/images/open.jpg?v=1" } };

    const { container } = render(<SurfaceRenderer surface={doorSurface("open")} theme="noir" />);

    // It forks exactly once for the "open" state, with the right instruction.
    await waitFor(() => expect(forkCalls()).toHaveLength(1));
    const [url, init] = forkCalls()[0];
    expect(url).toBe("/api/images/base.jpg/fork");
    expect(JSON.parse((init as { body: string }).body).instruction).toMatch(
      /blast door is now open/
    );

    // The edited url replaces the base once it resolves.
    await waitFor(() => {
      const imgEl = container.querySelector("img");
      expect(imgEl?.getAttribute("src")).toBe("/api/images/open.jpg?v=1");
    });
  });

  it("clears the 'Reacting' spinner (falls back to base) when the fork fails", async () => {
    forkResponse = { ok: false, status: 502 };

    const { container } = render(<SurfaceRenderer surface={doorSurface("open")} theme="noir" />);

    await waitFor(() => expect(forkCalls()).toHaveLength(1));
    // After the failure resolves, no perpetual spinner — base image still shown.
    await waitFor(() => {
      expect(screen.queryByText("Reacting")).not.toBeInTheDocument();
    });
    const imgEl = container.querySelector("img");
    expect(imgEl?.getAttribute("src")).toBe("/api/images/base.jpg");
  });
});
