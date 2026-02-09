import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useA2UIStore } from "@/lib/store/useA2UIStore";

type MockMessage = {
  id: string;
  role: string;
  content?: string;
  parts?: Array<{
    type: string;
    text?: string;
    // Standard AI SDK structure
    toolInvocation?: {
      toolName: string;
      state: string;
      result: unknown;
    };
    // Legacy support (optional)
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

let lastChatSidebarProps: {
  messages: Array<{ content: string }>;
  sendMessage?: (message: { text: string }) => Promise<void> | void;
} | null = null;

vi.mock("@/components/chat/ChatSidebar", () => ({
  ChatSidebar: (props: { messages: Array<{ content: string }>; sendMessage?: () => void }) => {
    lastChatSidebarProps = props as typeof lastChatSidebarProps;
    return (
      <div data-testid="chat-messages">
        {props.messages.map((message) => message.content).join("|")}
      </div>
    );
  },
}));

import { DetectiveWorkspace } from "./DetectiveWorkspace";

describe("DetectiveWorkspace", () => {
  beforeEach(() => {
    useA2UIStore.setState({
      evidence: null,
      evidenceHistory: [],
      activeEvidenceId: null,
      settings: {
        typewriterSpeed: 30,
        soundEnabled: true,
        modelConfig: { provider: "auto", model: "" },
        ambient: {
          rainEnabled: true,
          rainVolume: 1,
          fogEnabled: true,
          intensity: "medium",
          crackleEnabled: false,
          crackleVolume: 0.35,
        },
      },
    });
    useChatMock.mockImplementation(() => ({
      messages: mockMessages,
      status: "ready",
      sendMessage: vi.fn(),
      append: vi.fn(),
    }));
    useChatMock.mockClear();
    lastChatSidebarProps = null;
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
      2
    );

    fireEvent.change(textarea, { target: { value: newJson } });

    // Text appears twice due to TypewriterText accessibility pattern
    expect(screen.getAllByText("New Suspect")[0]).toBeInTheDocument();
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

    // Error shows in editor area
    expect(screen.getAllByText(/Invalid JSON/).length).toBeGreaterThan(0);
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
    expect(screen.getByTestId("chat-messages").textContent).toContain("Legacy assistant response");
  });

  it("passes evidence through the chat request body", async () => {
    useA2UIStore.setState({
      evidence: { type: "text", content: "Evidence #1", priority: "normal" },
    });
    mockMessages = [];

    render(<DetectiveWorkspace />);
    const sendMessageMock = useChatMock.mock.results[0]?.value
      ?.sendMessage as unknown as ReturnType<typeof vi.fn>;
    expect(sendMessageMock).toBeTruthy();
    await act(async () => {
      await lastChatSidebarProps?.sendMessage?.({ text: "Ping" });
    });
    expect(sendMessageMock).toHaveBeenCalledWith(
      { text: "Ping" },
      expect.objectContaining({
        body: expect.objectContaining({
          evidence: { type: "text", content: "Evidence #1", priority: "normal" },
        }),
      })
    );
  });

  it("updates evidence when tool output arrives", async () => {
    mockMessages = [
      {
        id: "m1",
        role: "assistant",
        parts: [
          {
            type: "tool-invocation",
            toolInvocation: {
              toolName: "generate_ui",
              state: "result",
              result: {
                type: "card",
                title: "Missing: Jane Doe",
                description: "Last seen near the docks",
                status: "missing",
              },
            },
          },
        ],
      },
    ];

    render(<DetectiveWorkspace />);
    const titles = await screen.findAllByText("Missing: Jane Doe");
    expect(titles.length).toBeGreaterThan(0);
    const statuses = await screen.findAllByText("MISSING");
    expect(statuses.length).toBeGreaterThan(0);
  });

  it("records evidence history and sets active evidence id", () => {
    mockMessages = [
      {
        id: "m1",
        role: "assistant",
        parts: [
          {
            type: "tool-invocation",
            toolInvocation: {
              toolName: "generate_ui",
              state: "result",
              result: {
                type: "card",
                title: "Suspect Profile",
                description: "Classified",
                status: "active",
              },
            },
          },
        ],
      },
    ];

    render(<DetectiveWorkspace />);
    const state = useA2UIStore.getState() as {
      evidenceHistory?: Array<{ id: string }>;
      activeEvidenceId?: string;
    };

    expect(state.evidenceHistory?.length).toBe(1);
    expect(state.activeEvidenceId).toBe(state.evidenceHistory?.[0]?.id);
  });

  it("renders nested tool output", async () => {
    mockMessages = [
      {
        id: "m1",
        role: "assistant",
        parts: [
          {
            type: "tool-invocation",
            toolInvocation: {
              toolName: "generate_ui",
              state: "result",
              result: {
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
          },
        ],
      },
    ];

    render(<DetectiveWorkspace />);
    const headers = await screen.findAllByText("Case Intake");
    expect(headers.length).toBeGreaterThan(0);
    expect(await screen.findByLabelText("Name")).toBeInTheDocument();
    const submits = await screen.findAllByText("Submit");
    expect(submits.length).toBeGreaterThan(0);
  });
});
