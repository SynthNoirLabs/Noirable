import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { AudioCustomization } from "./AudioCustomization";
import { useA2UIStore } from "@/lib/store/useA2UIStore";
import { useCustomProfileStore } from "@/lib/store/useCustomProfileStore";

// Mock the store
vi.mock("@/lib/store/useA2UIStore");
vi.mock("@/lib/store/useCustomProfileStore", () => ({
  useCustomProfileStore: vi.fn(),
}));

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

  const mockUpdateProfile = vi.fn();
  const mockGetActiveProfile = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useA2UIStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      settings: mockSettings,
      updateSettings: updateSettingsMock,
    });
    (useCustomProfileStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      getActiveProfile: mockGetActiveProfile,
      updateProfile: mockUpdateProfile,
    });
    mockGetActiveProfile.mockReturnValue(null);
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

  it("renders custom music section if active profile exists", () => {
    mockGetActiveProfile.mockReturnValue({
      id: "custom-1",
      name: "My custom profile",
      audio: {
        customMusicUrl: "/api/uploads/song.mp3",
      },
    });

    render(<AudioCustomization />);

    expect(screen.getByTestId("music-url")).toHaveTextContent("Current: /api/uploads/song.mp3");
    expect(screen.getByTestId("remove-music")).toBeInTheDocument();
  });

  it("removes custom music when remove button is clicked", () => {
    mockGetActiveProfile.mockReturnValue({
      id: "custom-1",
      name: "My custom profile",
      audio: {
        customMusicUrl: "/api/uploads/song.mp3",
      },
    });

    render(<AudioCustomization />);

    const removeBtn = screen.getByTestId("remove-music");
    fireEvent.click(removeBtn);

    expect(mockUpdateProfile).toHaveBeenCalledWith("custom-1", {
      audio: {},
    });
  });

  it("handles custom music file upload", async () => {
    mockGetActiveProfile.mockReturnValue({
      id: "custom-1",
      name: "My custom profile",
      audio: {},
    });

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ url: "/api/uploads/new-song.mp3" }),
    });
    vi.stubGlobal("fetch", mockFetch);

    render(<AudioCustomization />);

    const fileInput = screen.getByTestId("music-input");
    const file = new File(["dummy"], "song.mp3", { type: "audio/mpeg" });
    fireEvent.change(fileInput, { target: { files: [file] } });

    await vi.waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith("/api/uploads", expect.any(Object));
      expect(mockUpdateProfile).toHaveBeenCalledWith("custom-1", {
        audio: {
          customMusicUrl: "/api/uploads/new-song.mp3",
        },
      });
    });
  });

  describe("with an active custom profile", () => {
    beforeEach(() => {
      mockGetActiveProfile.mockReturnValue({
        id: "custom-1",
        name: "My custom profile",
        baseAestheticId: "noir",
        audio: {
          sfxVolumes: { typewriter: 0.2 },
          musicVolume: 0.3,
          ambientRainVolume: 0.1,
        },
      });
    });

    it("reads volumes from the profile audio overrides", () => {
      render(<AudioCustomization />);

      // Profile typewriter 0.2 -> 20%, music 0.3 -> 30%, rain 0.1 -> 10%.
      expect(screen.getByLabelText("TYPEWRITER volume")).toHaveValue("20");
      expect(screen.getByLabelText("MUSIC VOLUME volume")).toHaveValue("30");
      expect(screen.getByLabelText("INTENSITY volume")).toHaveValue("10");
    });

    it("writes sfx volume to the profile, not the global store", () => {
      render(<AudioCustomization />);

      const slider = screen.getByLabelText("THUNDER volume");
      fireEvent.change(slider, { target: { value: "50" } });

      expect(mockUpdateProfile).toHaveBeenCalledWith("custom-1", {
        audio: {
          sfxVolumes: { typewriter: 0.2, thunder: 0.5 },
          musicVolume: 0.3,
          ambientRainVolume: 0.1,
        },
      });
      expect(updateSettingsMock).not.toHaveBeenCalled();
    });

    it("writes music volume to the profile audio", () => {
      render(<AudioCustomization />);

      const slider = screen.getByLabelText("MUSIC VOLUME volume");
      fireEvent.change(slider, { target: { value: "80" } });

      expect(mockUpdateProfile).toHaveBeenCalledWith("custom-1", {
        audio: expect.objectContaining({ musicVolume: 0.8 }),
      });
      expect(updateSettingsMock).not.toHaveBeenCalled();
    });

    it("writes ambient rain volume to the profile audio", () => {
      render(<AudioCustomization />);

      const slider = screen.getByLabelText("INTENSITY volume");
      fireEvent.change(slider, { target: { value: "90" } });

      expect(mockUpdateProfile).toHaveBeenCalledWith("custom-1", {
        audio: expect.objectContaining({ ambientRainVolume: 0.9 }),
      });
      expect(updateSettingsMock).not.toHaveBeenCalled();
    });
  });
});
