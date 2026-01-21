import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useA2UIStore } from "@/lib/store/useA2UIStore";

type MockMessage = {
  id: string;
  role: string;
  content?: string;
  parts?: Array<{
    type: string;
    text?: string;
    state?: string;
    output?: unknown;
  }>;
  toolInvocations?: unknown[];
};

let mockMessages: MockMessage[] = [];
const useChatMock = vi.fn();

// Mock Vercel AI SDK
vi.mock("@ai-sdk/react", () => ({
  useChat: (...args: unknown[]) => useChatMock(...args),
}));

vi.mock("@/components/chat/ChatSidebar", () => ({
  ChatSidebar: ({ messages }: { messages: Array<{ content: string }> }) => (
    <div data-testid="chat-messages">
      {messages.map((message) => message.content).join("|")}
    </div>
  ),
}));

import { DetectiveWorkspace } from "./DetectiveWorkspace";

describe("DetectiveWorkspace", () => {
  beforeEach(() => {
    useA2UIStore.setState({
      evidence: null,
      settings: { typewriterSpeed: 30, soundEnabled: true },
    });
    useChatMock.mockImplementation(() => ({
      messages: mockMessages,
      status: "ready",
      sendMessage: vi.fn(),
      append: vi.fn(),
    }));
    useChatMock.mockClear();
  });

  it("updates preview when json changes", () => {
    mockMessages = [];
    const { container } = render(<DetectiveWorkspace />);

    const textarea = container.querySelector("textarea");
    if (!textarea) throw new Error("Textarea not found");

    expect(screen.getAllByText("Evidence #1").length).toBeGreaterThan(0);

    const newJson = JSON.stringify(
      {
        type: "card",
        title: "New Suspect",
        status: "active",
      },
      null,
      2,
    );

    fireEvent.change(textarea, { target: { value: newJson } });

    expect(screen.getByText("New Suspect")).toBeInTheDocument();
    expect(screen.getByText("ACTIVE")).toBeInTheDocument();
  });

  it("allows the editor to fill available height", () => {
    mockMessages = [];
    const { container } = render(<DetectiveWorkspace />);
    const textarea = container.querySelector("textarea");
    if (!textarea) throw new Error("Textarea not found");
    expect(textarea.className).toContain("flex-1");
    expect(textarea.className).toContain("min-h-0");
  });

  it("handles invalid json gracefully", () => {
    mockMessages = [];
    const { container } = render(<DetectiveWorkspace />);
    const textarea = container.querySelector("textarea");
    if (!textarea) throw new Error("Textarea not found");

    fireEvent.change(textarea, { target: { value: "{ bad json " } });

    expect(screen.getByText(/Invalid JSON/)).toBeInTheDocument();
  });

  it("renders chat sidebar", () => {
    mockMessages = [];
    render(<DetectiveWorkspace />);
    expect(screen.getByTestId("chat-messages")).toBeInTheDocument();
  });

  it("renders assistant content when message parts are missing", () => {
    mockMessages = [
      {
        id: "m1",
        role: "assistant",
        content: "Legacy assistant response",
      },
    ];

    render(<DetectiveWorkspace />);
    expect(screen.getByTestId("chat-messages").textContent).toContain(
      "Legacy assistant response",
    );
  });

  it("passes evidence in useChat request body", () => {
    useA2UIStore.setState({
      evidence: { type: "text", content: "Evidence #1", priority: "normal" },
    });
    mockMessages = [];

    render(<DetectiveWorkspace />);
    const call = useChatMock.mock.calls[0]?.[0] as { body?: unknown };
    expect(call?.body).toEqual({
      evidence: { type: "text", content: "Evidence #1", priority: "normal" },
    });
  });

  it("updates evidence when tool output arrives", () => {
    mockMessages = [
      {
        id: "m1",
        role: "assistant",
        parts: [
          {
            type: "tool-generate_ui",
            state: "output-available",
            output: {
              type: "card",
              title: "Missing: Jane Doe",
              description: "Last seen near the docks",
              status: "missing",
            },
          },
        ],
      },
    ];

    render(<DetectiveWorkspace />);
    expect(screen.getByText("Missing: Jane Doe")).toBeInTheDocument();
    expect(screen.getByText("MISSING")).toBeInTheDocument();
  });

  it("renders nested tool output", () => {
    mockMessages = [
      {
        id: "m1",
        role: "assistant",
        parts: [
          {
            type: "tool-generate_ui",
            state: "output-available",
            output: {
              type: "container",
              style: { padding: "md", gap: "sm" },
              children: [
                { type: "heading", level: 2, text: "Case Intake" },
                {
                  type: "row",
                  style: { gap: "sm" },
                  children: [
                    { type: "input", label: "Name", placeholder: "Jane Doe" },
                    { type: "button", label: "Submit", variant: "primary" },
                  ],
                },
              ],
            },
          },
        ],
      },
    ];

    render(<DetectiveWorkspace />);
    expect(screen.getByText("Case Intake")).toBeInTheDocument();
    expect(screen.getByLabelText("Name")).toBeInTheDocument();
    expect(screen.getByText("Submit")).toBeInTheDocument();
  });
});
