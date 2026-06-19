import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { SurfaceRenderer } from "../SurfaceRenderer";
import type { SurfaceState, SurfaceComponent } from "@/lib/a2ui/surfaces/manager";

function makeSurface(components: SurfaceComponent[]): SurfaceState {
  return {
    config: { surfaceId: "s1", catalogId: "standard" },
    components: new Map(components.map((c) => [c.id, c])),
    dataModel: {},
    createdAt: 0,
  };
}

describe("RelationshipGraphRenderer", () => {
  it("renders the title, every node label, and an SVG path per edge", () => {
    const surface = makeSurface([
      {
        id: "root",
        component: "RelationshipGraph",
        title: "Suspect Web",
        nodes: [
          { id: "n1", label: "Kessler", kind: "suspect" },
          { id: "n2", label: "The Docks", kind: "location" },
          { id: "n3", label: "Knife", kind: "clue" },
        ],
        edges: [
          { from: "n1", to: "n2", label: "LAST SEEN", kind: "connection" },
          { from: "n1", to: "n3", label: "MOTIVE", kind: "motive" },
        ],
      },
    ]);

    const { container } = render(<SurfaceRenderer surface={surface} theme="noir" />);

    expect(screen.getByText("Suspect Web")).toBeInTheDocument();
    expect(screen.getByText("Kessler")).toBeInTheDocument();
    expect(screen.getByText("The Docks")).toBeInTheDocument();
    expect(screen.getByText("Knife")).toBeInTheDocument();

    // One quadratic path per drawn edge.
    const paths = container.querySelectorAll('path[data-testid="graph-edge"]');
    expect(paths).toHaveLength(2);
    // The motive edge uses the red error string color.
    const motivePath = Array.from(paths).find(
      (p) => p.getAttribute("stroke") === "var(--aesthetic-error)"
    );
    expect(motivePath).toBeTruthy();
  });

  it("drops edges whose endpoints don't resolve to a placed node", () => {
    const surface = makeSurface([
      {
        id: "root",
        component: "RelationshipGraph",
        nodes: [{ id: "n1", label: "Lone" }],
        edges: [{ from: "n1", to: "ghost" }],
      },
    ]);

    const { container } = render(<SurfaceRenderer surface={surface} theme="noir" />);
    const paths = container.querySelectorAll('path[data-testid="graph-edge"]');
    expect(paths).toHaveLength(0);
    expect(screen.getByText("Lone")).toBeInTheDocument();
  });

  it("shows an empty state when there are no nodes", () => {
    const surface = makeSurface([
      { id: "root", component: "RelationshipGraph", nodes: [], edges: [] },
    ]);
    render(<SurfaceRenderer surface={surface} theme="noir" />);
    expect(screen.getByText("No connections to map")).toBeInTheDocument();
  });
});
