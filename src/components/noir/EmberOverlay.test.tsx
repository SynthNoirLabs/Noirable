import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { EmberOverlay } from "./EmberOverlay";

describe("EmberOverlay", () => {
  it("renders ember motes when enabled (motion allowed)", () => {
    const { getByTestId } = render(<EmberOverlay enabled intensity="medium" />);
    const overlay = getByTestId("ember-overlay");
    expect(overlay).toBeInTheDocument();
    // medium intensity = 24 motes
    expect(overlay.children.length).toBe(24);
  });

  it("renders nothing when disabled", () => {
    const { queryByTestId } = render(<EmberOverlay enabled={false} />);
    expect(queryByTestId("ember-overlay")).toBeNull();
  });

  it("scales mote count with intensity", () => {
    const { getByTestId } = render(<EmberOverlay enabled intensity="high" />);
    expect(getByTestId("ember-overlay").children.length).toBe(38);
  });
});
