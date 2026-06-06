import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ImageStyleCustomization } from "./ImageStyleCustomization";
import { useCustomProfileStore } from "@/lib/store/useCustomProfileStore";
import { getAestheticDefinition } from "@/lib/aesthetic/definitions";

vi.mock("@/lib/store/useCustomProfileStore", () => ({
  useCustomProfileStore: vi.fn(),
}));

describe("ImageStyleCustomization", () => {
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

    render(<ImageStyleCustomization />);
    expect(screen.getByText(/Create or select a custom profile/i)).toBeInTheDocument();
  });

  it("uses the base preset prompt as the textarea placeholder", () => {
    render(<ImageStyleCustomization />);

    const textarea = screen.getByLabelText("Image style prompt");
    expect(textarea).toHaveAttribute(
      "placeholder",
      getAestheticDefinition("noir").imageStylePrompt
    );
  });

  it("seeds the textarea with the profile's existing prompt", () => {
    mockGetActiveProfile.mockReturnValue({
      id: "custom-1",
      baseAestheticId: "noir",
      imageStylePrompt: "watercolor storybook illustration",
    });

    render(<ImageStyleCustomization />);

    expect(screen.getByLabelText("Image style prompt")).toHaveValue(
      "watercolor storybook illustration"
    );
  });

  it("persists prompt edits to the profile", () => {
    render(<ImageStyleCustomization />);

    const textarea = screen.getByLabelText("Image style prompt");
    fireEvent.change(textarea, { target: { value: "neon synthwave poster" } });

    expect(mockUpdateProfile).toHaveBeenCalledWith("custom-1", {
      imageStylePrompt: "neon synthwave poster",
    });
  });

  it("clears the override to undefined when emptied", () => {
    mockGetActiveProfile.mockReturnValue({
      id: "custom-1",
      baseAestheticId: "noir",
      imageStylePrompt: "something",
    });

    render(<ImageStyleCustomization />);

    const textarea = screen.getByLabelText("Image style prompt");
    fireEvent.change(textarea, { target: { value: "   " } });

    expect(mockUpdateProfile).toHaveBeenCalledWith("custom-1", {
      imageStylePrompt: undefined,
    });
  });

  it("reset button clears the prompt override", () => {
    mockGetActiveProfile.mockReturnValue({
      id: "custom-1",
      baseAestheticId: "noir",
      imageStylePrompt: "something",
    });

    render(<ImageStyleCustomization />);

    fireEvent.click(screen.getByText(/Use Preset Default/i));

    // The textarea reads straight from the store (single source of truth), so
    // clearing means persisting `undefined`; the rendered value follows the
    // store on the next render rather than a local draft.
    expect(mockUpdateProfile).toHaveBeenCalledWith("custom-1", {
      imageStylePrompt: undefined,
    });
  });
});
