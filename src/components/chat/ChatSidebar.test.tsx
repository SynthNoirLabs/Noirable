import { useEffect } from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ChatSidebar } from "./ChatSidebar";

type MockAudioEvent =
  | "message.start"
  | "message.complete"
  | "component.placed"
  | "error"
  | "dramatic.beat";

vi.mock("@/components/noir/NoirSoundEffects", () => {
  return {
    NoirSoundEffects: ({
      onReady,
    }: {
      onReady: (
        controls: {
          playThunder: () => void;
          playPhoneRing: () => void;
          playTypewriter: () => void;
          playByEvent: (event: MockAudioEvent) => void;
        } | null
      ) => void;
    }) => {
      // We can use the top-level useEffect import directly inside the mock
      useEffect(() => {
        const playThunder = () => window.dispatchEvent(new CustomEvent("test-thunder"));
        const playPhoneRing = () => window.dispatchEvent(new CustomEvent("test-phone"));
        const playTypewriter = () => window.dispatchEvent(new CustomEvent("test-typewriter"));
        onReady({
          playThunder,
          playPhoneRing,
          playTypewriter,
          // Resolve through noir's AudioEventMap so the event-driven bus exercises
          // the same SFX the old keyword scan fired.
          playByEvent: (event) => {
            if (event === "dramatic.beat") playThunder();
            else if (event === "error") playPhoneRing();
            else if (event === "component.placed" || event === "message.complete") playTypewriter();
          },
        });
        return () => onReady(null);
      }, [onReady]);
      return null;
    },
  };
});

const mockSendMessage = vi.fn();
const mockMessages = [
  { id: "1", role: "user", content: "Hello" },
  { id: "2", role: "assistant", content: "Greetings, detective." },
];

describe("ChatSidebar", () => {
  it("renders messages", async () => {
    render(
      <ChatSidebar
        messages={mockMessages}
        sendMessage={mockSendMessage}
        isLoading={false}
        typewriterSpeed={0}
      />
    );
    expect(screen.getByText("Hello")).toBeInTheDocument();
    // Use regex to match text ignoring the cursor suffix if present
    // Note: TypewriterText renders duplicates for a11y (sr-only + aria-hidden)
    const elements = screen.getAllByText(/Greetings, detective/);
    expect(elements.length).toBeGreaterThan(0);
  });

  it("renders input field", () => {
    render(<ChatSidebar messages={[]} sendMessage={mockSendMessage} isLoading={false} />);
    expect(screen.getByPlaceholderText(/Type your command/i)).toBeInTheDocument();
    expect(screen.getByAltText("Search icon")).toBeInTheDocument();
  });

  it("submits message on enter", () => {
    render(<ChatSidebar messages={[]} sendMessage={mockSendMessage} isLoading={false} />);
    const input = screen.getByPlaceholderText(/Type your command/i);
    fireEvent.change(input, { target: { value: "Hello" } });
    fireEvent.submit(input);
    expect(mockSendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        text: "Hello",
      })
    );
  });

  it("shows typing indicator when loading", () => {
    render(<ChatSidebar messages={[]} sendMessage={mockSendMessage} isLoading={true} />);
    expect(screen.getByText(/Processing Evidence/i)).toBeInTheDocument();
  });

  it("renders detective avatar badge", () => {
    render(<ChatSidebar messages={mockMessages} sendMessage={mockSendMessage} isLoading={false} />);
    expect(screen.getByAltText("Detective avatar")).toBeInTheDocument();
  });

  it("shows settings toggle when onUpdateSettings is provided", () => {
    const onUpdateSettings = vi.fn();
    render(
      <ChatSidebar
        messages={[]}
        sendMessage={mockSendMessage}
        isLoading={false}
        onUpdateSettings={onUpdateSettings}
      />
    );

    // Find settings button (by title "Configuration")
    const settingsBtn = screen.getByTitle("Configuration");
    expect(settingsBtn).toBeInTheDocument();

    // Open settings
    fireEvent.click(settingsBtn);

    // Check for speed toggle text
    expect(screen.getByText("TYPEWRITER SPEED")).toBeInTheDocument();

    // Click toggle button (defaults to NORMAL, so clicking should set INSTANT/0)
    const toggleBtn = screen.getByText("NORMAL");
    fireEvent.click(toggleBtn);

    expect(onUpdateSettings).toHaveBeenCalledWith({ typewriterSpeed: 0 });
  });

  it("toggles sound effects from settings", () => {
    const onUpdateSettings = vi.fn();
    render(
      <ChatSidebar
        messages={[]}
        sendMessage={mockSendMessage}
        isLoading={false}
        onUpdateSettings={onUpdateSettings}
        soundEnabled={true}
      />
    );

    fireEvent.click(screen.getByTitle("Configuration"));

    fireEvent.click(screen.getByRole("button", { name: /toggle sound effects/i }));
    expect(onUpdateSettings).toHaveBeenCalledWith({ soundEnabled: false });
  });

  it("renders a collapse button when onToggleCollapse is provided and calls it", () => {
    const onToggleCollapse = vi.fn();
    render(
      <ChatSidebar
        messages={mockMessages}
        sendMessage={mockSendMessage}
        isLoading={false}
        onToggleCollapse={onToggleCollapse}
      />
    );

    const collapseBtn = screen.getByRole("button", {
      name: /collapse sidebar/i,
    });
    fireEvent.click(collapseBtn);
    expect(onToggleCollapse).toHaveBeenCalledTimes(1);
  });

  it("updates ambient toggles via settings controls", () => {
    const onUpdateSettings = vi.fn();
    render(
      <ChatSidebar
        messages={[]}
        sendMessage={mockSendMessage}
        isLoading={false}
        onUpdateSettings={onUpdateSettings}
        ambient={{
          rainEnabled: true,
          rainVolume: 1,
          fogEnabled: false,
          intensity: "medium",
          crackleEnabled: false,
          crackleVolume: 0.35,
        }}
      />
    );

    fireEvent.click(screen.getByTitle("Configuration"));

    fireEvent.click(screen.getByRole("button", { name: /toggle rain/i }));
    expect(onUpdateSettings).toHaveBeenCalledWith({ ambient: { rainEnabled: false } });

    fireEvent.click(screen.getByRole("button", { name: /toggle fog/i }));
    expect(onUpdateSettings).toHaveBeenCalledWith({ ambient: { fogEnabled: true } });

    fireEvent.click(screen.getByRole("button", { name: /toggle crackle/i }));
    expect(onUpdateSettings).toHaveBeenCalledWith({ ambient: { crackleEnabled: true } });
  });

  it("updates crackle volume when the slider changes", () => {
    const onUpdateSettings = vi.fn();
    render(
      <ChatSidebar
        messages={[]}
        sendMessage={mockSendMessage}
        isLoading={false}
        onUpdateSettings={onUpdateSettings}
        ambient={{
          rainEnabled: true,
          rainVolume: 1,
          fogEnabled: true,
          intensity: "medium",
          crackleEnabled: true,
          crackleVolume: 0.2,
        }}
      />
    );

    fireEvent.click(screen.getByTitle("Configuration"));

    const slider = screen.getByLabelText(/crackle volume/i);
    fireEvent.change(slider, { target: { value: "70" } });
    expect(onUpdateSettings).toHaveBeenCalledWith({ ambient: { crackleVolume: 0.7 } });
  });

  it("updates rain volume when the slider changes", () => {
    const onUpdateSettings = vi.fn();
    render(
      <ChatSidebar
        messages={[]}
        sendMessage={mockSendMessage}
        isLoading={false}
        onUpdateSettings={onUpdateSettings}
        ambient={{
          rainEnabled: true,
          rainVolume: 0.25,
          fogEnabled: true,
          intensity: "medium",
          crackleEnabled: false,
          crackleVolume: 0.35,
        }}
      />
    );

    fireEvent.click(screen.getByTitle("Configuration"));

    const slider = screen.getByLabelText(/rain volume/i);
    fireEvent.change(slider, { target: { value: "55" } });
    expect(onUpdateSettings).toHaveBeenCalledWith({ ambient: { rainVolume: 0.55 } });
  });

  it("triggers atmospheric events when narrative mentions lightning or telephone ringing", async () => {
    const thunderSpy = vi.fn();
    const phoneSpy = vi.fn();
    const lightningFlashSpy = vi.fn();

    window.addEventListener("test-thunder", thunderSpy);
    window.addEventListener("test-phone", phoneSpy);
    window.addEventListener("noir-lightning", lightningFlashSpy);

    const testMessages = [
      { id: "1", role: "user", content: "Hello" },
      { id: "2", role: "assistant", content: "I saw a sudden flash of lightning outside." },
    ];

    const { rerender } = render(
      <ChatSidebar
        messages={testMessages}
        sendMessage={mockSendMessage}
        isLoading={false}
        ttsEnabled={false}
      />
    );

    await waitFor(() => {
      expect(thunderSpy).toHaveBeenCalled();
    });
    expect(lightningFlashSpy).toHaveBeenCalled();
    expect(phoneSpy).not.toHaveBeenCalled();

    // Reset spy calls
    thunderSpy.mockReset();
    lightningFlashSpy.mockReset();

    // Rerender with telephone ringing text
    const updatedMessages = [
      ...testMessages,
      { id: "3", role: "assistant", content: "Then, the phone rang." },
    ];

    rerender(
      <ChatSidebar
        messages={updatedMessages}
        sendMessage={mockSendMessage}
        isLoading={false}
        ttsEnabled={false}
      />
    );

    await waitFor(() => {
      expect(phoneSpy).toHaveBeenCalled();
    });
    expect(thunderSpy).not.toHaveBeenCalled();
    expect(lightningFlashSpy).not.toHaveBeenCalled();

    window.removeEventListener("test-thunder", thunderSpy);
    window.removeEventListener("test-phone", phoneSpy);
    window.removeEventListener("noir-lightning", lightningFlashSpy);
  });

  it("clacks the typewriter as assistant tokens stream in", async () => {
    const typewriterSpy = vi.fn();
    window.addEventListener("test-typewriter", typewriterSpy);

    const base = [{ id: "1", role: "user", content: "Hello" }];

    const { rerender } = render(
      <ChatSidebar
        messages={[...base, { id: "2", role: "assistant", content: "The" }]}
        sendMessage={mockSendMessage}
        isLoading={true}
        ttsEnabled={false}
      />
    );

    await waitFor(() => {
      expect(typewriterSpy).toHaveBeenCalled();
    });

    // A non-growing rerender (same content) must not re-clack.
    typewriterSpy.mockReset();
    rerender(
      <ChatSidebar
        messages={[...base, { id: "2", role: "assistant", content: "The" }]}
        sendMessage={mockSendMessage}
        isLoading={true}
        ttsEnabled={false}
      />
    );
    expect(typewriterSpy).not.toHaveBeenCalled();

    window.removeEventListener("test-typewriter", typewriterSpy);
  });

  it("does not fire SFX while sound is disabled", async () => {
    const thunderSpy = vi.fn();
    const typewriterSpy = vi.fn();
    window.addEventListener("test-thunder", thunderSpy);
    window.addEventListener("test-typewriter", typewriterSpy);

    render(
      <ChatSidebar
        messages={[
          { id: "1", role: "user", content: "Hello" },
          { id: "2", role: "assistant", content: "A flash of lightning lit the alley." },
        ]}
        sendMessage={mockSendMessage}
        isLoading={true}
        soundEnabled={false}
        ttsEnabled={false}
      />
    );

    // Give effects a tick to run; nothing should fire while muted.
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(thunderSpy).not.toHaveBeenCalled();
    expect(typewriterSpy).not.toHaveBeenCalled();

    window.removeEventListener("test-thunder", thunderSpy);
    window.removeEventListener("test-typewriter", typewriterSpy);
  });
});
