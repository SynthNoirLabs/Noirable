import { render, screen, act } from "@testing-library/react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { TypewriterText } from "./TypewriterText";

describe("TypewriterText", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

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

  it("renders full content for screen readers immediately", () => {
    render(<TypewriterText content="Hello World" speed={50} />);

    const fullText = screen.getByText("Hello World");
    expect(fullText).toBeInTheDocument();
    expect(fullText).toHaveClass("sr-only");
  });

  it("hides the animated text from screen readers", () => {
    const content = "Hello World";
    render(<TypewriterText content={content} speed={50} />);

    // Advance time to show some text
    act(() => {
      vi.advanceTimersByTime(100);
    });

    // We expect the animated part to be wrapped in aria-hidden=true.
    const hiddenContainer = document.querySelector('[aria-hidden="true"]');
    expect(hiddenContainer).toBeInTheDocument();

    // The sr-only element should NOT be hidden
    const srOnly = screen.getByText("Hello World");
    expect(srOnly).not.toHaveAttribute("aria-hidden", "true");
  });
});
