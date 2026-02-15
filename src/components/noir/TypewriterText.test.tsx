import { render, screen } from "@testing-library/react";
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

  it("provides full text to screen readers immediately", () => {
    // Render with a slow speed so animation is not instant
    render(<TypewriterText content="Top Secret" speed={100} />);

    // Check if the full text is available immediately (e.g., via sr-only span)
    // Note: getByText might find the sr-only element
    expect(screen.getByText("Top Secret")).toBeInTheDocument();
  });

  it("hides the animated text from screen readers", () => {
      const { container } = render(<TypewriterText content="Top Secret" speed={100} />);

      // The visible text should be wrapped in an aria-hidden element
      // We look for an element with aria-hidden="true" inside the component
      const hiddenElement = container.querySelector('[aria-hidden="true"]');
      expect(hiddenElement).toBeInTheDocument();
      // Ensure it contains the cursor or partial text (since speed is > 0)
      expect(hiddenElement?.textContent).toContain("_");
  });
});
