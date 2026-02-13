import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { TypewriterText } from "./TypewriterText";

describe("TypewriterText", () => {
  it("renders content with typewriter font", () => {
    const { container } = render(<TypewriterText content="Case #1234" speed={0} />);

    // Allow animation/state to settle if needed, though speed=0 is instant
    const element = container.querySelector(".font-typewriter");
    expect(element).toBeInTheDocument();
    expect(element?.textContent).toContain("Case #1234");
    expect(element).toHaveClass("crt-glow");
  });

  it("applies critical priority styling", () => {
    const { container } = render(
      <TypewriterText content="CONFIDENTIAL" priority="critical" speed={0} />
    );

    const element = container.querySelector(".text-\\[var\\(--aesthetic-error\\)\\]");
    expect(element).toBeInTheDocument();
    expect(element?.textContent).toContain("CONFIDENTIAL");
  });

  it("provides accessible text for screen readers", () => {
    const { container } = render(<TypewriterText content="Top Secret" speed={0} />);

    // Check for sr-only element with full content
    const srElement = container.querySelector(".sr-only");
    expect(srElement).toBeInTheDocument();
    expect(srElement?.textContent).toBe("Top Secret");

    // Check that displayed text is hidden from screen readers
    const hiddenElements = container.querySelectorAll("[aria-hidden='true']");
    expect(hiddenElements.length).toBeGreaterThan(0);
  });
});
