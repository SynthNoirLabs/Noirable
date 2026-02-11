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
    const content = "Access Granted";
    const { container } = render(<TypewriterText content={content} speed={0} />);

    // Check for sr-only text
    const srElement = container.querySelector(".sr-only");
    expect(srElement).toBeInTheDocument();
    expect(srElement).toHaveTextContent(content);

    // Verify aria-hidden elements are present (text wrapper + cursor)
    const hiddenElements = container.querySelectorAll("[aria-hidden='true']");
    expect(hiddenElements.length).toBeGreaterThan(0);
  });
});
