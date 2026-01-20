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
      />,
    );
    expect(screen.getByText("Hello")).toBeInTheDocument();
    // Use regex to match text ignoring the cursor suffix if present
    expect(screen.getByText(/Greetings, detective/)).toBeInTheDocument();
  });

  it("renders input field", () => {
    render(
      <ChatSidebar
        messages={[]}
        sendMessage={mockSendMessage}
        isLoading={false}
      />,
    );
    expect(
      screen.getByPlaceholderText(/Type your command/i),
    ).toBeInTheDocument();
    expect(screen.getByAltText("Search icon")).toBeInTheDocument();
  });

  it("submits message on enter", () => {
    render(
      <ChatSidebar
        messages={[]}
        sendMessage={mockSendMessage}
        isLoading={false}
      />,
    );
    const input = screen.getByPlaceholderText(/Type your command/i);
    fireEvent.change(input, { target: { value: "Hello" } });
    fireEvent.submit(input);
    expect(mockSendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        role: "user",
        content: "Hello",
      }),
    );
  });

  it("shows typing indicator when loading", () => {
    render(
      <ChatSidebar
        messages={[]}
        sendMessage={mockSendMessage}
        isLoading={true}
      />,
    );
    expect(screen.getByText(/Processing Evidence/i)).toBeInTheDocument();
  });

  it("renders detective avatar badge", () => {
    render(
      <ChatSidebar
        messages={mockMessages}
        sendMessage={mockSendMessage}
        isLoading={false}
      />,
    );
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
      />,
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
});
