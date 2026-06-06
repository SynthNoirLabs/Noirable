import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FontCustomization } from "./FontCustomization";
import { useCustomProfileStore } from "@/lib/store/useCustomProfileStore";
import { injectProfileStyles } from "@/lib/customization/css-injection";

vi.mock("@/lib/store/useCustomProfileStore", () => ({
  useCustomProfileStore: vi.fn(),
}));

vi.mock("@/lib/customization/css-injection", () => ({
  injectProfileStyles: vi.fn(),
}));

describe("FontCustomization", () => {
  const mockUpdateProfile = vi.fn();
  const mockGetActiveProfile = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useCustomProfileStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      activeCustomProfileId: "custom-1",
      getActiveProfile: mockGetActiveProfile,
      updateProfile: mockUpdateProfile,
    });
    mockGetActiveProfile.mockReturnValue({
      id: "custom-1",
      name: "Test Profile",
      baseAestheticId: "noir",
      fonts: {},
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it("renders a hint when no active profile", () => {
    (useCustomProfileStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      activeCustomProfileId: null,
      getActiveProfile: () => null,
      updateProfile: mockUpdateProfile,
    });

    render(<FontCustomization />);
    expect(screen.getByText(/Create or select a custom profile/i)).toBeInTheDocument();
  });

  it("renders heading and body font selectors", () => {
    render(<FontCustomization />);
    expect(screen.getByLabelText("Headings font")).toBeInTheDocument();
    expect(screen.getByLabelText("Body Text font")).toBeInTheDocument();
  });

  it("writes the chosen font preset to the profile and injects styles", () => {
    render(<FontCustomization />);

    const headingSelect = screen.getByLabelText("Headings font");
    fireEvent.change(headingSelect, { target: { value: "serif" } });

    expect(mockUpdateProfile).toHaveBeenCalledWith("custom-1", {
      fonts: { heading: "serif" },
    });
    expect(injectProfileStyles).toHaveBeenCalled();
  });

  it("merges with existing font overrides", () => {
    mockGetActiveProfile.mockReturnValue({
      id: "custom-1",
      baseAestheticId: "noir",
      fonts: { heading: "serif" },
    });

    render(<FontCustomization />);

    const bodySelect = screen.getByLabelText("Body Text font");
    fireEvent.change(bodySelect, { target: { value: "mono" } });

    expect(mockUpdateProfile).toHaveBeenCalledWith("custom-1", {
      fonts: { heading: "serif", body: "mono" },
    });
  });

  it("reflects the current profile fonts in the selects", () => {
    mockGetActiveProfile.mockReturnValue({
      id: "custom-1",
      baseAestheticId: "noir",
      fonts: { heading: "typewriter", body: "system" },
    });

    render(<FontCustomization />);

    expect(screen.getByLabelText("Headings font")).toHaveValue("typewriter");
    expect(screen.getByLabelText("Body Text font")).toHaveValue("system");
  });

  it("reset clears the profile fonts override", () => {
    mockGetActiveProfile.mockReturnValue({
      id: "custom-1",
      baseAestheticId: "noir",
      fonts: { heading: "serif" },
    });

    render(<FontCustomization />);

    fireEvent.click(screen.getByText(/Reset Defaults/i));

    expect(mockUpdateProfile).toHaveBeenCalledWith("custom-1", {
      fonts: undefined,
    });
    expect(injectProfileStyles).toHaveBeenCalled();
  });
});
