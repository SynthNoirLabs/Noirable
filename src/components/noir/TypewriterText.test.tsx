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
    const { getAllByText } = render(<TypewriterText content="Evidence Found" speed={0} />);

    // Testing Library should find the text.
    // Since visual text is hidden with aria-hidden="true", getByText should primarily target the sr-only text.
    // However, depending on configuration, it might see both or just one.
    // We use getAllByText to be safe and just ensure it is found.
    const elements = getAllByText("Evidence Found");
    expect(elements.length).toBeGreaterThan(0);

    // Verify one of them is screen reader only
    expect(elements.some((el) => el.classList.contains("sr-only"))).toBe(true);
  });
});
