"use client";

import { useEffect, useCallback, useState } from "react";

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
      if (event.isComposing) {
        return;
      }

      const isMod = event.metaKey || event.ctrlKey;
      // Guard against undefined event.key (can happen with some IME/dead key events)
      if (!event.key) return;
      const key = event.key.toLowerCase();
      const target = event.target;
      if (target instanceof HTMLElement) {
        const tagName = target.tagName;
        const isEditableTarget =
          target.isContentEditable ||
          tagName === "INPUT" ||
          tagName === "TEXTAREA" ||
          tagName === "SELECT" ||
          Boolean(target.closest("[contenteditable='true']"));

        if (isEditableTarget) {
          if (isMod && key === "enter") {
            event.preventDefault();
            handlers.onSend?.();
          }
          return;
        }
      }

      // Cmd/Ctrl+Z - Undo
      if (isMod && key === "z" && !event.shiftKey) {
        event.preventDefault();
        handlers.onUndo?.();
        return;
      }

      // Cmd/Ctrl+Shift+Z - Redo
      if (isMod && key === "z" && event.shiftKey) {
        event.preventDefault();
        handlers.onRedo?.();
        return;
      }

      // Cmd/Ctrl+Y - Redo (alternative)
      if (isMod && key === "y") {
        event.preventDefault();
        handlers.onRedo?.();
        return;
      }

      // Cmd/Ctrl+E - Toggle Eject
      if (isMod && key === "e") {
        event.preventDefault();
        handlers.onToggleEject?.();
        return;
      }

      // Cmd/Ctrl+Enter - Send message
      if (isMod && key === "enter") {
        event.preventDefault();
        handlers.onSend?.();
        return;
      }

      // Escape - Close panels
      if (key === "escape") {
        handlers.onEscape?.();
        return;
      }
    },
    [handlers]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}

function isMacPlatform(): boolean {
  return typeof navigator !== "undefined" && navigator.platform.toUpperCase().indexOf("MAC") >= 0;
}

function buildShortcut(keys: string[], mac: boolean): string {
  return keys
    .map((key) => {
      if (key === "mod") return mac ? "⌘" : "Ctrl";
      if (key === "shift") return mac ? "⇧" : "Shift";
      if (key === "enter") return "↵";
      if (key === "escape") return "Esc";
      return key.toUpperCase();
    })
    .join(mac ? "" : "+");
}

/**
 * Format keyboard shortcut for display (non-reactive, safe only in event handlers or
 * places where hydration mismatch doesn't matter).
 */
export function formatShortcut(keys: string[]): string {
  return buildShortcut(keys, isMacPlatform());
}

/**
 * Returns a shortcut label that is stable on the server and updates after hydration,
 * preventing SSR/client mismatches in rendered output.
 */
export function useShortcut(keys: string[]): string {
  const [label, setLabel] = useState(() => buildShortcut(keys, false));
  useEffect(() => {
    setLabel(buildShortcut(keys, isMacPlatform()));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return label;
}
