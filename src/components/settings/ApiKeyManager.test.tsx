import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ApiKeyManager } from "./ApiKeyManager";

// Hoisted mock setup
const { mockUpdateSettings, getMockApiKeys, setMockApiKeys } = vi.hoisted(() => {
  let apiKeys: { elevenlabs?: string; openai?: string } = {};
  const mockUpdateSettings = vi.fn();
  return {
    mockUpdateSettings,
    getMockApiKeys: () => apiKeys,
    setMockApiKeys: (keys: { elevenlabs?: string; openai?: string }) => {
      apiKeys = keys;
    },
  };
});

vi.mock("@/lib/store/useA2UIStore", () => ({
  useA2UIStore: () => ({
    settings: { apiKeys: getMockApiKeys() },
    updateSettings: mockUpdateSettings,
  }),
}));

// Mock fetch
global.fetch = vi.fn();

describe("ApiKeyManager", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setMockApiKeys({});
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true });
  });

  it("renders API key inputs", () => {
    render(<ApiKeyManager />);
    expect(screen.getByText("ElevenLabs API Key")).toBeInTheDocument();
    expect(screen.getByText("OpenAI API Key (Optional)")).toBeInTheDocument();
  });

  it("shows security warning", () => {
    render(<ApiKeyManager />);
    expect(screen.getByText(/stored locally in your browser/i)).toBeInTheDocument();
  });

  it("updates elevenlabs key on input", () => {
    render(<ApiKeyManager />);
    const input = screen.getByPlaceholderText("xi-...");
    fireEvent.change(input, { target: { value: "xi-test-key" } });

    expect(mockUpdateSettings).toHaveBeenCalledWith({
      apiKeys: { elevenlabs: "xi-test-key" },
    });
  });

  it("updates openai key on input", () => {
    render(<ApiKeyManager />);
    const input = screen.getByPlaceholderText("sk-...");
    fireEvent.change(input, { target: { value: "sk-test-key" } });

    expect(mockUpdateSettings).toHaveBeenCalledWith({
      apiKeys: { openai: "sk-test-key" },
    });
  });

  it("toggles password visibility", () => {
    render(<ApiKeyManager />);
    const inputs = screen.getAllByPlaceholderText("xi-...");
    const input = inputs[0] as HTMLInputElement;

    const toggleButtons = screen.getAllByLabelText("Show key");
    const toggleButton = toggleButtons[0];

    expect(input.type).toBe("password");
    fireEvent.click(toggleButton);
    expect(input.type).toBe("text");
  });

  it("tests ElevenLabs connection", async () => {
    setMockApiKeys({ elevenlabs: "xi-test" });
    render(<ApiKeyManager />);

    // Find the test button for ElevenLabs (first one)
    const testButtons = screen.getAllByText("Test");
    fireEvent.click(testButtons[0]);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/elevenlabs/status",
        expect.objectContaining({
          headers: { "x-elevenlabs-api-key": "xi-test" },
        })
      );
    });
  });

  it("shows clear all button when keys exist", () => {
    setMockApiKeys({ elevenlabs: "test-key" });
    render(<ApiKeyManager />);
    expect(screen.getByText("Clear All Keys")).toBeInTheDocument();
  });

  it("clears all keys on button click", () => {
    setMockApiKeys({ elevenlabs: "test-key", openai: "test-key" });
    render(<ApiKeyManager />);

    fireEvent.click(screen.getByText("Clear All Keys"));
    expect(mockUpdateSettings).toHaveBeenCalledWith({ apiKeys: {} });
  });
});
