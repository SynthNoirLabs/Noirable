import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ChatSidebar } from "./ChatSidebar";

const mockSendMessage = vi.fn();
const mockMessages = [
  { id: "1", role: "user", content: "Hello" },
  { id: "2", role: "assistant", content: "Greetings, detective." },
];

describe("ChatSidebar", () => {
  beforeEach(() => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ configured: true }),
    } as Response);
  });

  it("renders messages", async () => {
    await act(async () => {
      render(
        <ChatSidebar
          messages={mockMessages}
          sendMessage={mockSendMessage}
          isLoading={false}
          typewriterSpeed={0}
        />
      );
    });
    expect(screen.getByText("Hello")).toBeInTheDocument();
    // Use regex to match text ignoring the cursor suffix if present
    // Note: TypewriterText renders duplicates for a11y (sr-only + aria-hidden)
    const elements = screen.getAllByText(/Greetings, detective/);
    expect(elements.length).toBeGreaterThan(0);
  });

  it("renders input field", async () => {
    await act(async () => {
      render(<ChatSidebar messages={[]} sendMessage={mockSendMessage} isLoading={false} />);
    });
    expect(screen.getByPlaceholderText(/Type your command/i)).toBeInTheDocument();
    expect(screen.getByAltText("Search icon")).toBeInTheDocument();
  });

  it("submits message on enter", async () => {
    await act(async () => {
      render(<ChatSidebar messages={[]} sendMessage={mockSendMessage} isLoading={false} />);
    });
    const input = screen.getByPlaceholderText(/Type your command/i);
    fireEvent.change(input, { target: { value: "Hello" } });
    fireEvent.submit(input);
    expect(mockSendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        text: "Hello",
      })
    );
  });

  it("shows typing indicator when loading", async () => {
    await act(async () => {
      render(<ChatSidebar messages={[]} sendMessage={mockSendMessage} isLoading={true} />);
    });
    expect(screen.getByText(/Processing Evidence/i)).toBeInTheDocument();
  });

  it("renders detective avatar badge", async () => {
    await act(async () => {
      render(
        <ChatSidebar messages={mockMessages} sendMessage={mockSendMessage} isLoading={false} />
      );
    });
    expect(screen.getByAltText("Detective avatar")).toBeInTheDocument();
  });

  it("shows settings toggle when onUpdateSettings is provided", async () => {
    const onUpdateSettings = vi.fn();
    await act(async () => {
      render(
        <ChatSidebar
          messages={[]}
          sendMessage={mockSendMessage}
          isLoading={false}
          onUpdateSettings={onUpdateSettings}
        />
      );
    });

    // Find settings button (by title "Configuration")
    const settingsBtn = screen.getByTitle(/Configuration/i);
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

  it("toggles sound effects from settings", async () => {
    const onUpdateSettings = vi.fn();
    await act(async () => {
      render(
        <ChatSidebar
          messages={[]}
          sendMessage={mockSendMessage}
          isLoading={false}
          onUpdateSettings={onUpdateSettings}
          soundEnabled={true}
        />
      );
    });

    fireEvent.click(screen.getByTitle(/Configuration/i));

    fireEvent.click(screen.getByRole("button", { name: /toggle sound effects/i }));
    expect(onUpdateSettings).toHaveBeenCalledWith({ soundEnabled: false });
  });

  it("renders a collapse button when onToggleCollapse is provided and calls it", async () => {
    const onToggleCollapse = vi.fn();
    await act(async () => {
      render(
        <ChatSidebar
          messages={mockMessages}
          sendMessage={mockSendMessage}
          isLoading={false}
          onToggleCollapse={onToggleCollapse}
        />
      );
    });

    const collapseBtn = screen.getByRole("button", {
      name: /collapse sidebar/i,
    });
    fireEvent.click(collapseBtn);
    expect(onToggleCollapse).toHaveBeenCalledTimes(1);
  });

  it("updates ambient toggles via settings controls", async () => {
    const onUpdateSettings = vi.fn();
    await act(async () => {
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
    });

    fireEvent.click(screen.getByTitle(/Configuration/i));

    fireEvent.click(screen.getByRole("button", { name: /toggle rain/i }));
    expect(onUpdateSettings).toHaveBeenCalledWith({ ambient: { rainEnabled: false } });

    fireEvent.click(screen.getByRole("button", { name: /toggle fog/i }));
    expect(onUpdateSettings).toHaveBeenCalledWith({ ambient: { fogEnabled: true } });

    fireEvent.click(screen.getByRole("button", { name: /toggle crackle/i }));
    expect(onUpdateSettings).toHaveBeenCalledWith({ ambient: { crackleEnabled: true } });
  });

  it("updates crackle volume when the slider changes", async () => {
    const onUpdateSettings = vi.fn();
    await act(async () => {
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
    });

    fireEvent.click(screen.getByTitle(/Configuration/i));

    const slider = screen.getByLabelText(/crackle volume/i);
    fireEvent.change(slider, { target: { value: "70" } });
    expect(onUpdateSettings).toHaveBeenCalledWith({ ambient: { crackleVolume: 0.7 } });
  });

  it("updates rain volume when the slider changes", async () => {
    const onUpdateSettings = vi.fn();
    await act(async () => {
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
    });

    fireEvent.click(screen.getByTitle(/Configuration/i));

    const slider = screen.getByLabelText(/rain volume/i);
    fireEvent.change(slider, { target: { value: "55" } });
    expect(onUpdateSettings).toHaveBeenCalledWith({ ambient: { rainVolume: 0.55 } });
  });
});
