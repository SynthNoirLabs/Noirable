import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ColorCustomization } from "./ColorCustomization";
import { useCustomProfileStore } from "@/lib/store/useCustomProfileStore";
import { injectProfileStyles } from "@/lib/customization/css-injection";

// Mock store
vi.mock("@/lib/store/useCustomProfileStore", () => ({
  useCustomProfileStore: vi.fn(),
}));

// Mock CSS injection
vi.mock("@/lib/customization/css-injection", () => ({
  injectProfileStyles: vi.fn(),
}));

describe("ColorCustomization", () => {
  const mockUpdateProfile = vi.fn();
  const mockGetActiveProfile = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementation
    (useCustomProfileStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      activeCustomProfileId: "custom-1",
      getActiveProfile: mockGetActiveProfile,
      updateProfile: mockUpdateProfile,
    });

    mockGetActiveProfile.mockReturnValue({
      id: "custom-1",
      name: "Test Profile",
      colors: {}, // Empty colors (should use defaults)
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it("renders warning when no active profile", () => {
    (useCustomProfileStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      activeCustomProfileId: null,
      getActiveProfile: () => null,
      updateProfile: mockUpdateProfile,
    });

    render(<ColorCustomization />);
    expect(screen.getByText(/Create or select a custom profile/i)).toBeInTheDocument();
  });

  it("renders all 9 color inputs when profile is active", () => {
    render(<ColorCustomization />);

    // Check for group labels (some might match input labels too, so we check existence)
    expect(screen.getByText("Background & Surface")).toBeInTheDocument();
    expect(screen.getAllByText("Text").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Accent").length).toBeGreaterThan(0);
    expect(screen.getByText("Other")).toBeInTheDocument();

    // Check for specific labels
    expect(screen.getByLabelText("Background")).toBeInTheDocument();
    expect(screen.getByLabelText("Surface")).toBeInTheDocument();
    expect(screen.getByLabelText("Surface Alt")).toBeInTheDocument();
    expect(screen.getByLabelText("Text")).toBeInTheDocument();
    expect(screen.getByLabelText("Text Muted")).toBeInTheDocument();
    expect(screen.getByLabelText("Accent")).toBeInTheDocument();
    expect(screen.getByLabelText("Accent Muted")).toBeInTheDocument();
    expect(screen.getByLabelText("Border")).toBeInTheDocument();
    expect(screen.getByLabelText("Error")).toBeInTheDocument();
  });

  it("displays current color values", () => {
    render(<ColorCustomization />);

    // Should show default hex codes
    // Note: This relies on the DEFAULT_COLORS constant in the component matching expected defaults
    expect(screen.getAllByText("#0f0f0f").length).toBeGreaterThan(0); // Background
    expect(screen.getAllByText("#ffbf00").length).toBeGreaterThan(0); // Accent
  });

  it("updates color and calls updateProfile/injectProfileStyles on change", async () => {
    render(<ColorCustomization />);

    const accentInput = screen.getByLabelText("Accent");
    fireEvent.change(accentInput, { target: { value: "#ffffff" } });

    // Should update local display
    expect(screen.getByText("#ffffff")).toBeInTheDocument();

    // Should call injectProfileStyles
    expect(injectProfileStyles).toHaveBeenCalled();

    // Should call updateProfile
    expect(mockUpdateProfile).toHaveBeenCalledWith("custom-1", {
      colors: expect.objectContaining({
        accent: "#ffffff",
      }),
    });
  });

  it("initializes with profile colors if present", () => {
    mockGetActiveProfile.mockReturnValue({
      id: "custom-1",
      colors: {
        background: "#123456",
        accent: "#654321",
      },
    });

    render(<ColorCustomization />);

    expect(screen.getByLabelText("Background")).toHaveValue("#123456");
    expect(screen.getByLabelText("Accent")).toHaveValue("#654321");
  });

  it("reset button restores defaults", () => {
    mockGetActiveProfile.mockReturnValue({
      id: "custom-1",
      colors: {
        background: "#123456",
      },
    });

    render(<ColorCustomization />);

    // Verify initial custom state
    expect(screen.getByLabelText("Background")).toHaveValue("#123456");

    // Click reset
    const resetButton = screen.getByText(/Reset Defaults/i);
    fireEvent.click(resetButton);

    // Verify reset to default
    expect(screen.getByLabelText("Background")).toHaveValue("#0f0f0f");

    // Verify store update (setting colors to undefined)
    expect(mockUpdateProfile).toHaveBeenCalledWith("custom-1", {
      colors: undefined,
    });

    // Verify injection
    expect(injectProfileStyles).toHaveBeenCalled();
  });
});
