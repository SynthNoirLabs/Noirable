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

  it("spreads edge labels along the strings instead of stacking them at one Y", () => {
    // Regression: labels were placed at the Bézier CONTROL point (pushed toward
    // board-bottom), so radial edges piled every label at nearly the same Y and
    // they overlapped. They now ride each string's true midpoint.
    const surface = makeSurface([
      {
        id: "root",
        component: "RelationshipGraph",
        title: "The Web",
        nodes: [
          { id: "a", label: "A", kind: "victim" },
          { id: "b", label: "B", kind: "suspect" },
          { id: "c", label: "C", kind: "location" },
          { id: "d", label: "D", kind: "witness" },
        ],
        edges: [
          { from: "a", to: "b", label: "EDGE-AB", kind: "motive" },
          { from: "a", to: "c", label: "EDGE-AC", kind: "connection" },
          { from: "a", to: "d", label: "EDGE-AD", kind: "connection" },
        ],
      },
    ]);

    const { container } = render(<SurfaceRenderer surface={surface} theme="noir" />);
    const labels = ["EDGE-AB", "EDGE-AC", "EDGE-AD"]
      .map((t) => Array.from(container.querySelectorAll("text")).find((el) => el.textContent === t))
      .filter(Boolean) as SVGTextElement[];
    expect(labels).toHaveLength(3);
    const ys = labels.map((el) => Number(el.getAttribute("y")));
    // The three labels must not all collapse onto the same horizontal line.
    expect(new Set(ys.map((y) => Math.round(y))).size).toBeGreaterThan(1);
  });

  it("places a node's kind icon on the opposite side from its label (no overlap)", () => {
    const surface = makeSurface([
      {
        id: "root",
        component: "RelationshipGraph",
        nodes: [
          { id: "n1", label: "Top", kind: "victim" },
          { id: "n2", label: "BottomLeft", kind: "suspect" },
          { id: "n3", label: "BottomRight", kind: "location" },
        ],
        edges: [],
      },
    ]);
    const { container } = render(<SurfaceRenderer surface={surface} theme="noir" />);
    // Each node renders exactly one label <text> and one icon <foreignObject>;
    // their vertical bands must not coincide (icon y vs label y differ).
    const fos = container.querySelectorAll("foreignObject");
    expect(fos.length).toBe(3);
    const labelEl = Array.from(container.querySelectorAll("text")).find(
      (el) => el.textContent === "BottomLeft"
    ) as SVGTextElement | undefined;
    expect(labelEl).toBeTruthy();
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
