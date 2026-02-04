import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { VoiceCustomization } from "./VoiceCustomization";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useA2UIStore } from "@/lib/store/useA2UIStore";

// Mock store
vi.mock("@/lib/store/useA2UIStore", () => ({
  useA2UIStore: vi.fn(),
}));

// Mock lucide icons
vi.mock("lucide-react", () => ({
  Mic: () => <span data-testid="icon-mic" />,
  Play: () => <span data-testid="icon-play" />,
  Settings2: () => <span data-testid="icon-settings" />,
  Volume2: () => <span data-testid="icon-volume" />,
  Activity: () => <span data-testid="icon-activity" />,
  Wind: () => <span data-testid="icon-wind" />,
  Zap: () => <span data-testid="icon-zap" />,
  ChevronDown: () => <span data-testid="icon-chevron" />,
  Check: () => <span data-testid="icon-check" />,
  AlertCircle: () => <span data-testid="icon-alert" />,
  Loader2: () => <span data-testid="icon-loader" />,
}));

// Mock URL.createObjectURL
global.URL.createObjectURL = vi.fn(() => "blob:test");
global.URL.revokeObjectURL = vi.fn();

describe("VoiceCustomization", () => {
  const mockUpdateSettings = vi.fn();
  const defaultSettings = {
    voiceSettings: {
      voiceId: "voice-1",
      stability: 0.5,
      similarityBoost: 0.75,
      style: 0,
      speed: 1.0,
    },
    apiKeys: {
      elevenlabs: "test-key",
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useA2UIStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      settings: defaultSettings,
      updateSettings: mockUpdateSettings,
    });

    global.fetch = vi.fn();
  });

  it("renders loading state initially", async () => {
    // Mock a pending fetch
    global.fetch = vi.fn(() => new Promise(() => {})) as unknown as typeof fetch;

    render(<VoiceCustomization />);

    expect(screen.getByText("Loading voices...")).toBeInTheDocument();
  });

  it("renders voices after fetch", async () => {
    const mockVoices = [
      { id: "voice-1", name: "Voice One", labels: { accent: "British" } },
      { id: "voice-2", name: "Voice Two", labels: { accent: "American" } },
    ];

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ voices: mockVoices }),
    }) as unknown as typeof fetch;

    render(<VoiceCustomization />);

    await waitFor(() => {
      expect(screen.queryByText("Loading voices...")).not.toBeInTheDocument();
    });

    // Open dropdown
    const trigger = screen.getByText("Voice One"); // current selected voice
    fireEvent.click(trigger);

    expect(screen.getByText("Voice Two")).toBeInTheDocument();
  });

  it("handles fetch error gracefully by showing manual input", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("Network error")) as unknown as typeof fetch;

    render(<VoiceCustomization />);

    await waitFor(() => {
      // Should default to manual input on error
      expect(screen.getByPlaceholderText("Enter Voice ID...")).toBeInTheDocument();
    });
  });

  it("slider changes update settings", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ voices: [] }),
    }) as unknown as typeof fetch;

    render(<VoiceCustomization />);

    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.queryByText("Loading voices...")).not.toBeInTheDocument();
    });

    // Find stability slider (first one)
    const stabilitySlider = screen.getAllByRole("slider")[0];

    fireEvent.change(stabilitySlider, { target: { value: "0.8" } });

    expect(mockUpdateSettings).toHaveBeenCalledWith({
      voiceSettings: expect.objectContaining({
        stability: 0.8,
      }),
    });
  });

  it("manual voice ID input works", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("Fail")) as unknown as typeof fetch;

    render(<VoiceCustomization />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText("Enter Voice ID...")).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText("Enter Voice ID...");
    fireEvent.change(input, { target: { value: "custom-id" } });

    expect(mockUpdateSettings).toHaveBeenCalledWith({
      voiceSettings: expect.objectContaining({
        voiceId: "custom-id",
      }),
    });
  });

  it("preview button calls TTS API", async () => {
    global.fetch = vi.fn().mockImplementation((url) => {
      if (url === "/api/elevenlabs/voices") {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ voices: [{ id: "voice-1", name: "Test Voice" }] }),
        });
      }
      if (url === "/api/tts") {
        return Promise.resolve({
          ok: true,
          blob: () => Promise.resolve(new Blob(["audio"])),
        });
      }
      return Promise.reject("Unknown URL");
    }) as unknown as typeof fetch;

    // Mock Audio
    const mockPlay = vi.fn();
    window.HTMLMediaElement.prototype.play = mockPlay;
    // We can't easily mock the 'audio' tag ref behavior in jsdom without more setup,
    // but we can verify the fetch call.

    render(<VoiceCustomization />);

    await waitFor(() => screen.getByText("Test Voice"));

    const previewBtn = screen.getByText("Preview Voice");
    fireEvent.click(previewBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/tts", expect.any(Object));
    });
  });
});
