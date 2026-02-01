import { render, fireEvent, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { useKeyboardShortcuts, type KeyboardShortcutHandlers } from "./useKeyboardShortcuts";

function ShortcutHarness({ handlers }: { handlers: KeyboardShortcutHandlers }) {
  useKeyboardShortcuts(handlers);
  return (
    <div>
      <input aria-label="chat-input" />
      <div contentEditable data-testid="editor" />
    </div>
  );
}

describe("useKeyboardShortcuts", () => {
  it("triggers undo on global shortcut", () => {
    const onUndo = vi.fn();
    render(<ShortcutHarness handlers={{ onUndo }} />);

    fireEvent.keyDown(window, { key: "z", ctrlKey: true });

    expect(onUndo).toHaveBeenCalledTimes(1);
  });

  it("ignores undo inside editable targets", () => {
    const onUndo = vi.fn();
    render(<ShortcutHarness handlers={{ onUndo }} />);

    const input = screen.getByLabelText("chat-input");
    fireEvent.keyDown(input, { key: "z", ctrlKey: true });

    expect(onUndo).not.toHaveBeenCalled();
  });

  it("sends on mod+Enter inside inputs", () => {
    const onSend = vi.fn();
    render(<ShortcutHarness handlers={{ onSend }} />);

    const input = screen.getByLabelText("chat-input");
    fireEvent.keyDown(input, { key: "Enter", metaKey: true });

    expect(onSend).toHaveBeenCalledTimes(1);
  });

  it("handles shift+Z redo shortcuts", () => {
    const onRedo = vi.fn();
    render(<ShortcutHarness handlers={{ onRedo }} />);

    fireEvent.keyDown(window, { key: "Z", metaKey: true, shiftKey: true });

    expect(onRedo).toHaveBeenCalledTimes(1);
  });
});
