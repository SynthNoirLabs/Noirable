import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ChatSidebar } from "./ChatSidebar";

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
    // TypewriterText renders duplicated text (one for SR, one for visual)
    expect(screen.getAllByText(/Greetings, detective/)[0]).toBeInTheDocument();
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
});
