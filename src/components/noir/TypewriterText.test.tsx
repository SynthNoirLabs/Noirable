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

  it("exposes full text to screen readers immediately", () => {
    // Set a slow speed so animation doesn't finish instantly
    render(<TypewriterText content="Accessible content" speed={100} />);

    // Should be available immediately for screen readers
    // This will fail before the fix because the text is not in the DOM yet
    expect(screen.getByText("Accessible content")).toBeInTheDocument();
  });
});
