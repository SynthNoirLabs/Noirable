import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { EffectsCustomization } from "./EffectsCustomization";

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
});
