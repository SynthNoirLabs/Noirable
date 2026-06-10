import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useA2UIStore } from "@/lib/store/useA2UIStore";

// The workspace is v0.9-only: it drives generation through useA2UIStream (a
// one-shot SSE POST), not the legacy useChat SDK. Mock the stream hook so tests
// don't hit the network and we can assert the send path.
const sendPromptMock = vi.fn().mockResolvedValue(undefined);
vi.mock("@/lib/a2ui/hooks/useA2UIStream", () => ({
  useA2UIStream: () => ({
    sendPrompt: sendPromptMock,
    isStreaming: false,
    error: null,
    clearError: vi.fn(),
    abort: vi.fn(),
  }),
}));

let lastChatSidebarProps: {
  messages: Array<{ content: string }>;
  sendMessage?: (message: { text: string }) => Promise<void> | void;
} | null = null;

vi.mock("@/components/chat/ChatSidebar", () => ({
  ChatSidebar: (props: {
    messages: Array<{ content: string }>;
    sendMessage?: (message: { text: string }) => Promise<void> | void;
  }) => {
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
    sendPromptMock.mockClear();
    lastChatSidebarProps = null;
  });

  it("shows the first-run empty state before any generation", () => {
    render(<DetectiveWorkspace />);
    expect(screen.getByText(/CASE FILE \/\/ UNOPENED/i)).toBeInTheDocument();
  });

  it("mirrors edited JSON into the eject evidence store", () => {
    const { container } = render(<DetectiveWorkspace />);
    const textarea = container.querySelector("textarea");
    if (!textarea) throw new Error("Textarea not found");

    const newJson = JSON.stringify({ type: "card", title: "New Suspect", status: "active" });
    fireEvent.change(textarea, { target: { value: newJson } });

    // The editor feeds `evidence` (consumed by Eject Mode), even though the
    // preview pane now renders the live v0.9 surface rather than this tree.
    const state = useA2UIStore.getState() as { evidence?: { title?: string } };
    expect(state.evidence?.title).toBe("New Suspect");
  });

  it("allows the editor to fill available height", () => {
    const { container } = render(<DetectiveWorkspace />);
    const textarea = container.querySelector("textarea");
    if (!textarea) throw new Error("Textarea not found");
    expect(textarea.className).toContain("flex-1");
    expect(textarea.className).toContain("min-h-0");
  });

  it("handles invalid json gracefully", () => {
    const { container } = render(<DetectiveWorkspace />);
    const textarea = container.querySelector("textarea");
    if (!textarea) throw new Error("Textarea not found");

    fireEvent.change(textarea, { target: { value: "{ bad json " } });
    expect(screen.getAllByText(/Invalid JSON/).length).toBeGreaterThan(0);
  });

  it("renders chat sidebar", () => {
    render(<DetectiveWorkspace />);
    expect(screen.getByTestId("chat-messages")).toBeInTheDocument();
  });

  it("sends a prompt through the v0.9 stream and logs the exchange", async () => {
    render(<DetectiveWorkspace />);
    await act(async () => {
      await lastChatSidebarProps?.sendMessage?.({ text: "Find the suspect" });
    });
    // The stream hook received the prompt as its first argument.
    expect(sendPromptMock).toHaveBeenCalledTimes(1);
    expect(sendPromptMock.mock.calls[0][0]).toBe("Find the suspect");
    // ...and the user line was mirrored into the chat log.
    expect(screen.getByTestId("chat-messages").textContent).toContain("Find the suspect");
  });

  it("renders the Bet 6 variant + iteration controls (always on in v0.9-only mode)", () => {
    render(<DetectiveWorkspace />);

    expect(screen.getByTestId("a2ui-variant-controls")).toBeInTheDocument();
    expect(screen.getByLabelText("Generate three takes")).toBeInTheDocument();
    expect(screen.getByText("Make it fancier")).toBeInTheDocument();
    expect(screen.getByText("Simplify")).toBeInTheDocument();
    expect(screen.getByText("Different angle")).toBeInTheDocument();

    // No prior prompt yet → generation/iteration is gated off.
    expect(screen.getByLabelText("Generate three takes")).toBeDisabled();

    // No takes captured yet → the Take picker is hidden.
    expect(screen.queryByTestId("a2ui-take-picker")).not.toBeInTheDocument();
  });
});
