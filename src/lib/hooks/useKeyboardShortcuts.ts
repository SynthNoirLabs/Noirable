"use client";

import { useEffect, useCallback } from "react";

export interface KeyboardShortcutHandlers {
  onUndo?: () => void;
  onRedo?: () => void;
  onToggleEject?: () => void;
  onSend?: () => void;
  onEscape?: () => void;
}

/**
 * Global keyboard shortcuts hook
 *
 * Shortcuts:
 * - Cmd/Ctrl+Z: Undo
 * - Cmd/Ctrl+Shift+Z: Redo
 * - Cmd/Ctrl+E: Toggle Eject Panel
 * - Cmd/Ctrl+Enter: Send message (when input focused)
 * - Escape: Close panels
 */
export function useKeyboardShortcuts(handlers: KeyboardShortcutHandlers) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const isMod = event.metaKey || event.ctrlKey;

      // Cmd/Ctrl+Z - Undo
      if (isMod && event.key === "z" && !event.shiftKey) {
        event.preventDefault();
        handlers.onUndo?.();
        return;
      }

      // Cmd/Ctrl+Shift+Z - Redo
      if (isMod && event.key === "z" && event.shiftKey) {
        event.preventDefault();
        handlers.onRedo?.();
        return;
      }

      // Cmd/Ctrl+Y - Redo (alternative)
      if (isMod && event.key === "y") {
        event.preventDefault();
        handlers.onRedo?.();
        return;
      }

      // Cmd/Ctrl+E - Toggle Eject
      if (isMod && event.key === "e") {
        event.preventDefault();
        handlers.onToggleEject?.();
        return;
      }

      // Cmd/Ctrl+Enter - Send message
      if (isMod && event.key === "Enter") {
        event.preventDefault();
        handlers.onSend?.();
        return;
      }

      // Escape - Close panels
      if (event.key === "Escape") {
        handlers.onEscape?.();
        return;
      }
    },
    [handlers],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}

/**
 * Format keyboard shortcut for display
 */
export function formatShortcut(keys: string[]): string {
  const isMac =
    typeof navigator !== "undefined" &&
    navigator.platform.toUpperCase().indexOf("MAC") >= 0;

  return keys
    .map((key) => {
      if (key === "mod") return isMac ? "⌘" : "Ctrl";
      if (key === "shift") return isMac ? "⇧" : "Shift";
      if (key === "enter") return "↵";
      if (key === "escape") return "Esc";
      return key.toUpperCase();
    })
    .join(isMac ? "" : "+");
}
