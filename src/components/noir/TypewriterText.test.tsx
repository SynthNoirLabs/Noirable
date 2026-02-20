import { render, screen, act } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { TypewriterText } from "./TypewriterText";
import React, { useState, useEffect } from "react";

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

  it("continues animation when content updates (streaming)", () => {
    vi.useFakeTimers();

    const Wrapper = () => {
      const [text, setText] = useState("One");

      useEffect(() => {
        setTimeout(() => setText("OneT"), 500); // Simulate streaming "T"
      }, []);

      return <TypewriterText content={text} speed={10} />;
    };

    render(<Wrapper />);

    // At start: text is "One".
    // 10ms: 'O'
    // 20ms: 'On'
    // 30ms: 'One'
    act(() => {
      vi.advanceTimersByTime(300);
    });

    // Check sr-only text
    expect(screen.getByTestId("typewriter-full-text")).toHaveTextContent("One");

    // Advance to 500ms, text changes to "OneT"
    act(() => {
      vi.advanceTimersByTime(200);
    });

    // Now prop is "OneT".
    // If it cleared, displayedText would be "" or "O" (if it restarted).
    // If it continued, it should be "One".

    // We query specifically for the aria-hidden span that contains the animated text
    const animatedSpan = screen.getByText("One", { selector: 'span[aria-hidden="true"]' });
    expect(animatedSpan).toBeInTheDocument();

    // Now advance 10ms. It should type 'T' (append it).
    act(() => {
      vi.advanceTimersByTime(10);
    });

    expect(animatedSpan).toHaveTextContent("OneT");

    // Also verify sr-only text updated
    expect(screen.getByTestId("typewriter-full-text")).toHaveTextContent("OneT");

    vi.useRealTimers();
  });
});
