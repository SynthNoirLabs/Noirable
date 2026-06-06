import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { EffectsCustomization } from "./EffectsCustomization";
import { useCustomProfileStore } from "@/lib/store/useCustomProfileStore";

// Mock store
const mockUpdateSettings = vi.fn();
const mockSettings = {
  effectIntensities: {
    rain: 0.5,
    fog: 0.5,
    crackle: 0.5,
  },
  typewriterSpeed: 50,
};

vi.mock("@/lib/store/useA2UIStore", () => ({
  useA2UIStore: () => ({
    settings: mockSettings,
    updateSettings: mockUpdateSettings,
  }),
}));

// useCustomProfileStore is selector-based here; default it to "no active
// profile" so the component falls back to the global store.
vi.mock("@/lib/store/useCustomProfileStore", () => ({
  useCustomProfileStore: vi.fn(),
}));

const mockUpdateProfile = vi.fn();

function mockProfileStore(activeProfile: Record<string, unknown> | null) {
  (useCustomProfileStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
    (selector: (state: unknown) => unknown) =>
      selector({
        activeCustomProfileId: activeProfile ? (activeProfile.id as string) : null,
        customProfiles: activeProfile ? [activeProfile] : [],
        updateProfile: mockUpdateProfile,
      })
  );
}

// Mock lucide icons
vi.mock("lucide-react", () => ({
  Droplets: () => <span data-testid="icon-droplets" />,
  CloudFog: () => <span data-testid="icon-fog" />,
  Radio: () => <span data-testid="icon-radio" />,
  Type: () => <span data-testid="icon-type" />,
}));

describe("EffectsCustomization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockProfileStore(null);
  });

  it("renders all 4 sliders", () => {
    render(<EffectsCustomization />);

    expect(screen.getByLabelText("Rain Intensity intensity")).toBeInTheDocument();
    expect(screen.getByLabelText("Fog Intensity intensity")).toBeInTheDocument();
    expect(screen.getByLabelText("Crackle Intensity intensity")).toBeInTheDocument();
    expect(screen.getByLabelText("Typewriter Speed speed")).toBeInTheDocument();
  });

  it("displays current values", () => {
    render(<EffectsCustomization />);

    // 0.5 * 100 = 50%
    expect(screen.getAllByText("50%")).toHaveLength(3);
    // Typewriter speed
    expect(screen.getByText("50ms")).toBeInTheDocument();
  });

  it("rain slider change calls updateSettings", () => {
    render(<EffectsCustomization />);

    const rainSlider = screen.getByLabelText("Rain Intensity intensity");
    fireEvent.change(rainSlider, { target: { value: "75" } });

    expect(mockUpdateSettings).toHaveBeenCalledWith({
      effectIntensities: {
        rain: 0.75,
        fog: 0.5,
        crackle: 0.5,
      },
    });
  });

  it("fog slider change calls updateSettings", () => {
    render(<EffectsCustomization />);

    const fogSlider = screen.getByLabelText("Fog Intensity intensity");
    fireEvent.change(fogSlider, { target: { value: "30" } });

    expect(mockUpdateSettings).toHaveBeenCalledWith({
      effectIntensities: {
        rain: 0.5,
        fog: 0.3,
        crackle: 0.5,
      },
    });
  });

  it("crackle slider change calls updateSettings", () => {
    render(<EffectsCustomization />);

    const crackleSlider = screen.getByLabelText("Crackle Intensity intensity");
    fireEvent.change(crackleSlider, { target: { value: "100" } });

    expect(mockUpdateSettings).toHaveBeenCalledWith({
      effectIntensities: {
        rain: 0.5,
        fog: 0.5,
        crackle: 1,
      },
    });
  });

  it("typewriter speed slider uses ms units", () => {
    render(<EffectsCustomization />);

    const typewriterSlider = screen.getByLabelText("Typewriter Speed speed");
    fireEvent.change(typewriterSlider, { target: { value: "30" } });

    expect(mockUpdateSettings).toHaveBeenCalledWith({
      typewriterSpeed: 30,
    });
  });

  it("shows helpful description", () => {
    render(<EffectsCustomization />);

    expect(screen.getByText(/control the intensity of visual effects/i)).toBeInTheDocument();
    expect(screen.getByText(/Delay between characters/i)).toBeInTheDocument();
  });

  describe("with an active custom profile", () => {
    beforeEach(() => {
      mockProfileStore({
        id: "custom-1",
        name: "My Profile",
        baseAestheticId: "noir",
        effects: { rain: 0.2 },
      });
    });

    it("reads effect values from the active profile", () => {
      render(<EffectsCustomization />);
      // rain comes from the profile (0.2 -> 20%), others fall back to global.
      expect(screen.getByText("20%")).toBeInTheDocument();
    });

    it("writes effect changes to the profile, not the global store", () => {
      render(<EffectsCustomization />);

      const fogSlider = screen.getByLabelText("Fog Intensity intensity");
      fireEvent.change(fogSlider, { target: { value: "30" } });

      expect(mockUpdateProfile).toHaveBeenCalledWith("custom-1", {
        effects: {
          rain: 0.2,
          fog: 0.3,
        },
      });
      expect(mockUpdateSettings).not.toHaveBeenCalled();
    });

    it("writes typewriter speed to the profile effects", () => {
      render(<EffectsCustomization />);

      const typewriterSlider = screen.getByLabelText("Typewriter Speed speed");
      fireEvent.change(typewriterSlider, { target: { value: "30" } });

      expect(mockUpdateProfile).toHaveBeenCalledWith("custom-1", {
        effects: {
          rain: 0.2,
          typewriterSpeed: 30,
        },
      });
      expect(mockUpdateSettings).not.toHaveBeenCalled();
    });
  });
});
