import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ThemeGenerator } from "./ThemeGenerator";

// Store actions — mirror the createProfile -> updateProfile -> setActiveProfile path.
const mockCreateProfile = vi.fn((name: string, baseAestheticId: string) => ({
  id: "custom-new",
  name,
  baseAestheticId,
  createdAt: 1,
  updatedAt: 1,
}));
const mockUpdateProfile = vi.fn();
const mockSetActiveProfile = vi.fn();

const mockStoreState = {
  createProfile: mockCreateProfile,
  updateProfile: mockUpdateProfile,
  setActiveProfile: mockSetActiveProfile,
};

vi.mock("@/lib/store/useCustomProfileStore", () => ({
  useCustomProfileStore: Object.assign(
    (selector?: (state: typeof mockStoreState) => unknown) => {
      if (selector) return selector(mockStoreState);
      return mockStoreState;
    },
    {
      getState: () => mockStoreState,
      subscribe: vi.fn(),
    }
  ),
}));

const mockInjectProfileStyles = vi.fn();
vi.mock("@/lib/customization/css-injection", () => ({
  injectProfileStyles: (...args: unknown[]) => mockInjectProfileStyles(...args),
}));

describe("ThemeGenerator", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("renders the vibe input and both action buttons", () => {
    render(<ThemeGenerator />);
    expect(screen.getByTestId("theme-vibe-input")).toBeInTheDocument();
    expect(screen.getByTestId("theme-generate-button")).toBeInTheDocument();
    expect(screen.getByTestId("theme-surprise-button")).toBeInTheDocument();
  });

  it("shows an error if Generate is clicked with an empty vibe", () => {
    render(<ThemeGenerator />);
    fireEvent.click(screen.getByTestId("theme-generate-button"));
    expect(screen.getByTestId("theme-error")).toHaveTextContent(/describe a vibe/i);
    expect(mockCreateProfile).not.toHaveBeenCalled();
  });

  it("Surprise Me applies a curated world offline (no fetch)", () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    render(<ThemeGenerator />);
    fireEvent.click(screen.getByTestId("theme-surprise-button"));

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(mockCreateProfile).toHaveBeenCalledTimes(1);
    expect(mockUpdateProfile).toHaveBeenCalledWith(
      "custom-new",
      expect.objectContaining({ imageStylePrompt: expect.any(String) })
    );
    expect(mockSetActiveProfile).toHaveBeenCalledWith("custom-new");
    expect(mockInjectProfileStyles).toHaveBeenCalled();
    expect(screen.getByTestId("theme-success")).toBeInTheDocument();
    // Every applied profile carries a resolved voiceId.
    const updates = mockUpdateProfile.mock.calls[0][1];
    expect(updates.voice.voiceId).toBeTruthy();
  });

  it("Surprise Me cycles to a different world on the second click", () => {
    render(<ThemeGenerator />);
    fireEvent.click(screen.getByTestId("theme-surprise-button"));
    fireEvent.click(screen.getByTestId("theme-surprise-button"));
    expect(mockCreateProfile).toHaveBeenCalledTimes(2);
    const firstName = mockCreateProfile.mock.calls[0][0];
    const secondName = mockCreateProfile.mock.calls[1][0];
    expect(firstName).not.toBe(secondName);
  });

  it("Generate POSTs the vibe and applies the returned profile", async () => {
    const generated = {
      name: "Neon Bazaar",
      baseAestheticId: "cyber-fixer",
      colors: { background: "#0a0712", text: "#f4ecff" },
      voice: { voiceId: "voice-from-server" },
      imageStylePrompt: "neon market",
      systemPrompt: "speak like a fixer",
    };
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, profile: generated }),
    });
    vi.stubGlobal("fetch", fetchSpy);

    render(<ThemeGenerator />);
    fireEvent.change(screen.getByTestId("theme-vibe-input"), {
      target: { value: "a neon night market" },
    });
    fireEvent.click(screen.getByTestId("theme-generate-button"));

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        "/api/theme",
        expect.objectContaining({ method: "POST" })
      );
      expect(mockCreateProfile).toHaveBeenCalledWith("Neon Bazaar", "cyber-fixer");
      expect(mockSetActiveProfile).toHaveBeenCalledWith("custom-new");
      expect(screen.getByTestId("theme-success")).toHaveTextContent("Neon Bazaar");
    });
    const updates = mockUpdateProfile.mock.calls[0][1];
    expect(updates.voice.voiceId).toBe("voice-from-server");
  });

  it("shows a server error message and does not create a profile", async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ success: false, error: "No API Key found." }),
    });
    vi.stubGlobal("fetch", fetchSpy);

    render(<ThemeGenerator />);
    fireEvent.change(screen.getByTestId("theme-vibe-input"), {
      target: { value: "something" },
    });
    fireEvent.click(screen.getByTestId("theme-generate-button"));

    await waitFor(() => {
      expect(screen.getByTestId("theme-error")).toHaveTextContent("No API Key found.");
    });
    expect(mockCreateProfile).not.toHaveBeenCalled();
  });

  it("falls back to a base preset voice when the generated profile omits voiceId", async () => {
    const { AESTHETIC_DEFAULT_VOICE_IDS } = await import("@/lib/aesthetic/voice-defaults");
    const generated = {
      name: "Voiceless World",
      baseAestheticId: "noir",
      imageStylePrompt: "noir scene",
    };
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, profile: generated }),
    });
    vi.stubGlobal("fetch", fetchSpy);

    render(<ThemeGenerator />);
    fireEvent.change(screen.getByTestId("theme-vibe-input"), {
      target: { value: "a quiet noir room" },
    });
    fireEvent.click(screen.getByTestId("theme-generate-button"));

    await waitFor(() => {
      expect(mockUpdateProfile).toHaveBeenCalled();
    });
    const updates = mockUpdateProfile.mock.calls[0][1];
    expect(updates.voice.voiceId).toBe(AESTHETIC_DEFAULT_VOICE_IDS.noir);
  });
});
