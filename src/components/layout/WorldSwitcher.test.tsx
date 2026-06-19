import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { WorldSwitcher } from "./WorldSwitcher";

const mockUpdateSettings = vi.fn();
const mockSetActiveProfile = vi.fn();

vi.mock("@/lib/store/useA2UIStore", () => ({
  useA2UIStore: () => ({
    settings: { aestheticId: "noir" },
    updateSettings: mockUpdateSettings,
  }),
}));

vi.mock("@/lib/store/useCustomProfileStore", () => ({
  useCustomProfileStore: (selector: (state: unknown) => unknown) =>
    selector({ customProfiles: [], setActiveProfile: mockSetActiveProfile }),
}));

describe("WorldSwitcher", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders a compact desk affordance", () => {
    render(<WorldSwitcher />);
    expect(screen.getByRole("button", { name: /Switch world/i })).toBeInTheDocument();
  });

  it("opens the world gallery and selects a world", () => {
    render(<WorldSwitcher />);
    fireEvent.click(screen.getByRole("button", { name: /Switch world/i }));
    fireEvent.click(screen.getByRole("button", { name: /Switch to Minimal/i }));
    expect(mockUpdateSettings).toHaveBeenCalledWith({ aestheticId: "minimal" });
    expect(mockSetActiveProfile).toHaveBeenCalledWith(null);
  });
});
