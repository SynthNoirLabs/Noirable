import { render, screen, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from "vitest";
import { ChatSidebar } from "./ChatSidebar";
import React from "react";

describe("ChatSidebar Accessibility", () => {
  beforeEach(() => {
    vi.resetAllMocks();

    vi.stubGlobal(
      "ResizeObserver",
      class ResizeObserver {
        observe() {}
        unobserve() {}
        disconnect() {}
      }
    );

    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
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
