"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { SurfaceComponent } from "@/lib/a2ui/surfaces/manager";
import { cn } from "@/lib/utils";
import { useSurfaceContext, type ComponentProps } from "../internal/context";
import { ComponentRenderer, MissingComponent } from "../internal/registry";

// Selector for the focusable elements a focus trap should cycle between.
const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "textarea:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

export function ModalRenderer({ component }: ComponentProps) {
  const { getComponent } = useSurfaceContext();
  const modal = component as SurfaceComponent & { trigger?: string; content?: string };
  const [open, setOpen] = useState(false);

  const dialogRef = useRef<HTMLDivElement | null>(null);
  // The element that had focus before the dialog opened, so focus can be
  // restored to the trigger when the dialog closes.
  const lastFocusedRef = useRef<HTMLElement | null>(null);

  const trigger = modal.trigger ? getComponent(modal.trigger) : null;
  const content = modal.content ? getComponent(modal.content) : null;

  const close = useCallback(() => setOpen(false), []);

  // On open: remember the trigger's focus, then autofocus the dialog. On close:
  // restore focus to the previously-focused element (the trigger) if feasible.
  useEffect(() => {
    if (!open) return;
    lastFocusedRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    // Prefer the first focusable element inside the dialog; otherwise focus the
    // dialog container itself (it carries tabIndex={-1}) so the panel is the
    // active element and screen readers land inside the modal.
    const dialog = dialogRef.current;
    const firstFocusable = dialog?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
    (firstFocusable ?? dialog)?.focus();

    return () => {
      lastFocusedRef.current?.focus?.();
    };
  }, [open]);

  // Close on Escape and keep Tab focus trapped within the dialog.
  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      close();
      return;
    }
    if (e.key !== "Tab") return;
    const dialog = dialogRef.current;
    if (!dialog) return;
    const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
      (el) => el.offsetParent !== null || el === document.activeElement
    );
    if (focusable.length === 0) {
      // Nothing focusable inside — keep focus pinned to the dialog container.
      e.preventDefault();
      dialog.focus();
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const activeEl = document.activeElement;
    if (e.shiftKey) {
      if (activeEl === first || activeEl === dialog) {
        e.preventDefault();
        last.focus();
      }
    } else if (activeEl === last) {
      e.preventDefault();
      first.focus();
    }
  };

  return (
    <>
      <div
        onClickCapture={() => setOpen(true)}
        className="inline-block cursor-pointer"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen(true);
          }
        }}
      >
        {trigger ? <ComponentRenderer component={trigger} /> : <MissingComponent id="trigger" />}
      </div>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={close}
        >
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            tabIndex={-1}
            className={cn(
              // Give the dialog a real surface: without this the panel was just
              // sized + scrollable, so bare content (e.g. a Text node) floated
              // as unstyled text over the dimmed backdrop. Mirror the Card chrome
              // (aesthetic surface, border, accent top rule, radius, shadow) so
              // the modal reads as a solid sheet across every aesthetic. Extra
              // top padding clears the absolutely-positioned ✕ close button.
              "relative max-h-[85vh] max-w-lg overflow-auto rounded-sm",
              "border border-[var(--aesthetic-border)]/40 border-t-2 border-t-[var(--aesthetic-accent)]/60",
              "bg-[var(--aesthetic-surface)] p-5 pt-9 shadow-[0_12px_40px_rgba(0,0,0,0.55)]",
              "focus-visible:outline-none"
            )}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={onKeyDown}
          >
            <button
              type="button"
              onClick={close}
              aria-label="Close dialog"
              className="absolute right-2 top-2 z-10 px-2 py-1 font-mono text-xs text-[var(--aesthetic-text)]/70 hover:text-[var(--aesthetic-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--aesthetic-accent)]"
            >
              ✕
            </button>
            {content ? (
              <ComponentRenderer component={content} />
            ) : (
              <MissingComponent id="content" />
            )}
          </div>
        </div>
      )}
    </>
  );
}
