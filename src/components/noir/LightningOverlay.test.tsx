import { render, act } from "@testing-library/react";
import { LightningOverlay } from "./LightningOverlay";
import { describe, it, expect } from "vitest";

describe("LightningOverlay", () => {
  it("does not render initially", () => {
    const { container } = render(<LightningOverlay />);
    expect(container.firstChild).toBeNull();
  });

  it("renders and starts animation on noir-lightning event", () => {
    const { container } = render(<LightningOverlay />);
    expect(container.firstChild).toBeNull();

    act(() => {
      window.dispatchEvent(new CustomEvent("noir-lightning"));
    });

    const flashElement = container.querySelector(".animate-lightning");
    expect(flashElement).toBeInTheDocument();
    expect(flashElement).toHaveClass("fixed", "inset-0", "bg-white", "pointer-events-none");
  });
});
