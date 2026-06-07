import { render, screen, act } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { useEffect } from "react";
import { useSurfaceStore } from "@/lib/a2ui/store/useSurfaceStore";
import { A2UIv09Preview } from "./A2UIv09Preview";

// Mock SurfaceRenderer with a true MOUNT counter (useEffect with empty deps, so
// it fires once per mount, not per render). The bug this guards: switching takes
// swaps the active surface but the renderer was reconciled in place, so the
// reveal animations (framer-motion initial→show, PhotoDeveloper develop) — which
// only fire on mount — never replayed and a restored take rendered blank. Keying
// the renderer on the surface id forces a fresh mount per surface.
const mountSpy = vi.fn();
vi.mock("./SurfaceRenderer", () => ({
  SurfaceRenderer: ({ surface }: { surface: { config: { surfaceId: string } } }) => {
    const id = surface.config.surfaceId;
    // Empty deps: fires exactly once per MOUNT. If the renderer is reconciled in
    // place (no key) when the surface changes, this does NOT re-fire — which is
    // precisely the broken behavior. A key-forced remount fires it again.
    useEffect(() => {
      mountSpy(id);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    return <div data-testid="mock-surface">{id}</div>;
  },
}));

function seedSurface(surfaceId: string) {
  const store = useSurfaceStore.getState();
  store.createSurface({ surfaceId, catalogId: "standard", theme: "noir" });
  store.updateComponents(surfaceId, [{ id: "root", component: "Text", text: surfaceId } as never]);
}

describe("A2UIv09Preview", () => {
  beforeEach(() => {
    useSurfaceStore.getState().clear();
    mountSpy.mockClear();
  });

  it("shows the empty state when there are no surfaces", () => {
    render(<A2UIv09Preview />);
    expect(screen.getByText("AWAITING FIRST LEAD")).toBeInTheDocument();
  });

  it("renders the most recent surface", () => {
    seedSurface("surface-take-1-100");
    render(<A2UIv09Preview />);
    expect(screen.getByTestId("mock-surface")).toHaveTextContent("surface-take-1-100");
  });

  it("remounts the renderer when the active surface id changes (take switch)", () => {
    // First take is live.
    seedSurface("surface-take-1-100");
    render(<A2UIv09Preview />);
    expect(mountSpy).toHaveBeenCalledTimes(1);
    expect(mountSpy).toHaveBeenLastCalledWith("surface-take-1-100");

    // Switching takes mirrors selectVariant: clear + recreate under a new id.
    act(() => {
      const store = useSurfaceStore.getState();
      store.clear();
      seedSurface("surface-take-2-200");
    });

    // A keyed renderer unmounts the old surface and mounts the new one, so the
    // mount spy fires again with the new id. Without the key React would reuse
    // the same instance and never re-run the mount-only reveal.
    expect(mountSpy).toHaveBeenCalledTimes(2);
    expect(mountSpy).toHaveBeenLastCalledWith("surface-take-2-200");
    expect(screen.getByTestId("mock-surface")).toHaveTextContent("surface-take-2-200");
  });
});
