import { render } from "@testing-library/react";
import { FogOverlay } from "./FogOverlay";
import { describe, it, expect } from "vitest";

describe("FogOverlay", () => {
  it("renders with correct animation class", () => {
    const { container } = render(<FogOverlay />);
    // Select the inner element that has the animation
    // The structure is div (fixed) > div (absolute with animation)
    // container.firstChild is the fixed div. container.firstChild.firstChild is the animated one.
    const animatedElement = container.firstChild?.firstChild;
    expect(animatedElement).toHaveClass("animate-[fog-drift_30s_ease-in-out_infinite]");
  });
});
