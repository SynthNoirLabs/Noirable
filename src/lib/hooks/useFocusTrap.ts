import { useEffect, useRef } from "react";

/**
 * Traps focus within a container while active, and restores focus to the
 * trigger element on unmount.
 */
export function useFocusTrap<T extends HTMLElement>(
  active: boolean,
  containerRef: React.RefObject<T | null>
) {
  const restoreFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!active) return;

    // Remember the element that had focus when the trap activated
    restoreFocusRef.current = document.activeElement as HTMLElement;

    const container = containerRef.current;
    if (!container) return;

    // Focus the first focusable element in the container
    const focusableSelector =
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const focusableElements = Array.from(
      container.querySelectorAll<HTMLElement>(focusableSelector)
    );

    if (focusableElements.length > 0) {
      focusableElements[0]?.focus();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab" || !container) return;

      const elements = Array.from(container.querySelectorAll<HTMLElement>(focusableSelector));
      if (elements.length === 0) return;

      const firstElement = elements[0];
      const lastElement = elements[elements.length - 1];

      if (e.shiftKey) {
        // Shift+Tab: wrap from first to last
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab: wrap from last to first
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      // Restore focus to the trigger element when the trap is deactivated
      if (restoreFocusRef.current && typeof restoreFocusRef.current.focus === "function") {
        restoreFocusRef.current.focus();
      }
    };
  }, [active, containerRef]);
}
