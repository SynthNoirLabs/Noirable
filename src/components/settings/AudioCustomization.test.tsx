import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { AudioCustomization } from "./AudioCustomization";
import { useA2UIStore } from "@/lib/store/useA2UIStore";

// Mock the store
vi.mock("@/lib/store/useA2UIStore");

describe("AudioCustomization", () => {
  const updateSettingsMock = vi.fn();
  const mockSettings = {
    sfxVolumes: {
      typewriter: 0.8,
      thunder: 0.7,
      phone: 0.6,
    },
    musicEnabled: true,
    musicVolume: 0.5,
    ambient: {
      rainEnabled: true,
      rainVolume: 0.4,
      crackleEnabled: false,
      crackleVolume: 0.3,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useA2UIStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      settings: mockSettings,
      updateSettings: updateSettingsMock,
    });
  });

  it("renders all volume sliders", () => {
    render(<AudioCustomization />);

    expect(screen.getByLabelText("TYPEWRITER volume")).toBeInTheDocument();
    expect(screen.getByLabelText("THUNDER volume")).toBeInTheDocument();
    expect(screen.getByLabelText("PHONE volume")).toBeInTheDocument();
    expect(screen.getByLabelText("MUSIC VOLUME volume")).toBeInTheDocument();
    expect(screen.getByLabelText("INTENSITY volume")).toBeInTheDocument(); // Rain intensity
    expect(screen.getByLabelText("VOLUME volume")).toBeInTheDocument(); // Crackle volume
  });

  it("renders toggles for Music, Rain, and Crackle", () => {
    render(<AudioCustomization />);

    const onButtons = screen.getAllByText("ON", { selector: "button" });
    const offButtons = screen.getAllByText("OFF", { selector: "button" });

    // Music and Rain are enabled -> 2 ON buttons
    expect(onButtons.length).toBe(2);
    // Crackle is disabled -> 1 OFF button
    expect(offButtons.length).toBe(1);
  });

  it("calls updateSettings when sfx slider changes", () => {
    render(<AudioCustomization />);

    const slider = screen.getByLabelText("TYPEWRITER volume");
    fireEvent.change(slider, { target: { value: "50" } });

    expect(updateSettingsMock).toHaveBeenCalledWith({
      sfxVolumes: expect.objectContaining({
        typewriter: 0.5,
      }),
    });
  });

  it("calls updateSettings when music volume changes", () => {
    render(<AudioCustomization />);

    const slider = screen.getByLabelText("MUSIC VOLUME volume");
    fireEvent.change(slider, { target: { value: "20" } });

    expect(updateSettingsMock).toHaveBeenCalledWith({
      musicVolume: 0.2,
    });
  });

  it("calls updateSettings when ambient volume changes", () => {
    render(<AudioCustomization />);

    const slider = screen.getByLabelText("INTENSITY volume"); // Rain
    fireEvent.change(slider, { target: { value: "90" } });

    expect(updateSettingsMock).toHaveBeenCalledWith({
      ambient: expect.objectContaining({
        rainVolume: 0.9,
      }),
    });
  });

  it("toggles music enabled state", () => {
    render(<AudioCustomization />);

    // Music section toggle. It's the first "ON" button after "MUSIC" header?
    // Let's look for the Music section
    const musicSection = screen.getByText("MUSIC").closest("section");
    const toggle = musicSection?.querySelector("button");

    fireEvent.click(toggle!);

    expect(updateSettingsMock).toHaveBeenCalledWith({
      musicEnabled: false, // It was true in mock
    });
  });

  it("toggles ambient enabled state", () => {
    render(<AudioCustomization />);

    // Find Rain toggle
    const rainLabel = screen.getByText("RAIN");
    const rainContainer = rainLabel.closest("div")?.parentElement; // The container holding header
    const toggle = rainContainer?.querySelector("button");

    fireEvent.click(toggle!);

    expect(updateSettingsMock).toHaveBeenCalledWith({
      ambient: expect.objectContaining({
        rainEnabled: false, // It was true in mock
      }),
    });
  });

  it("renders preview buttons", () => {
    render(<AudioCustomization />);

    const previewButtons = screen.getAllByLabelText(/Preview/i);
    expect(previewButtons.length).toBe(6); // 3 SFX + 1 Music + 2 Ambient

    fireEvent.click(previewButtons[0]);
    // Since handlePreview just logs, we just ensure it doesn't crash
  });
});
