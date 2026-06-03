import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { SurfaceRenderer } from "./SurfaceRenderer";
import type { SurfaceState, SurfaceComponent } from "@/lib/a2ui/surfaces/manager";

function makeSurface(components: SurfaceComponent[]): SurfaceState {
  return {
    config: { surfaceId: "s1", catalogId: "standard" },
    components: new Map(components.map((c) => [c.id, c])),
    dataModel: {},
    createdAt: 0,
  };
}

describe("SurfaceRenderer", () => {
  it("renders catalog components routed by the `component` discriminator", () => {
    const surface = makeSurface([{ id: "root", component: "Text", text: "Closed case" }]);
    render(<SurfaceRenderer surface={surface} theme="noir" />);
    expect(screen.getByText("Closed case")).toBeInTheDocument();
  });

  it("wraps a noir Card in the aged-paper dossier frame", () => {
    const surface = makeSurface([
      { id: "root", component: "Card", child: "body" },
      { id: "body", component: "Text", text: "Evidence" },
    ]);
    const { container } = render(<SurfaceRenderer surface={surface} theme="noir" />);
    // The PaperFrame applies the shared `bg-paper` recipe.
    expect(container.querySelector(".bg-paper")).not.toBeNull();
    expect(screen.getByText("Evidence")).toBeInTheDocument();
  });

  it("uses the clean elevated box for the standard theme", () => {
    const surface = makeSurface([
      { id: "root", component: "Card", child: "body" },
      { id: "body", component: "Text", text: "Evidence" },
    ]);
    const { container } = render(<SurfaceRenderer surface={surface} theme="standard" />);
    expect(container.querySelector(".bg-paper")).toBeNull();
    expect(screen.getByText("Evidence")).toBeInTheDocument();
  });

  it("shows an unknown-component fallback naming the bad component type", () => {
    const surface = makeSurface([
      { id: "root", component: "Bogus" } as unknown as SurfaceComponent,
    ]);
    render(<SurfaceRenderer surface={surface} theme="noir" />);
    expect(screen.getByText(/Unknown: Bogus/)).toBeInTheDocument();
  });
});
