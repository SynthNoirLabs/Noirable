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
    expect(flashElement).toHaveClass("fixed", "inset-0", "pointer-events-none", "mix-blend-screen");
    // The flash color is now theme-driven (var(--aesthetic-lightning-color)
    // mixed toward white) rather than a hardcoded `bg-white` class, so the
    // flash matches the active world's storm. With no themed [data-aesthetic]
    // root in this test, the frequency gate defaults to firing.
    expect((flashElement as HTMLElement).style.backgroundColor).toContain(
      "var(--aesthetic-lightning-color)"
    );
  });

  it("suppresses the flash when the active world's lightning frequency is 0", () => {
    // A minimal world sets --aesthetic-lightning-frequency: 0 on its themed
    // root; the overlay reads it at trigger time and never bumps the key.
    const themed = document.createElement("div");
    themed.setAttribute("data-aesthetic", "minimal");
    themed.style.setProperty("--aesthetic-lightning-frequency", "0");
    document.body.appendChild(themed);

    const { container } = render(<LightningOverlay />, { container: themed });

    act(() => {
      window.dispatchEvent(new CustomEvent("noir-lightning"));
    });

    expect(container.querySelector(".animate-lightning")).toBeNull();
    document.body.removeChild(themed);
  });
});
