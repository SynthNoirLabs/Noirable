import { render, screen, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { ChatSidebar } from "./ChatSidebar";
import React from "react";

// Mock resize observer
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock scrollIntoView
window.HTMLElement.prototype.scrollIntoView = function () {};

// Mock fetch
global.fetch = vi.fn();

describe("ChatSidebar Accessibility", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("announces loading state to screen readers", async () => {
    // Mock successful TTS status check to avoid act warnings
    (global.fetch as Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ configured: false }),
    });

    await act(async () => {
      render(<ChatSidebar messages={[]} sendMessage={vi.fn()} isLoading={true} />);
    });

    const status = screen.getByRole("status");
    expect(status).toHaveTextContent(/Processing Evidence/i);
    expect(status).toHaveAttribute("aria-live", "polite");
  });
});
