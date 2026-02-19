## 2025-02-22 - Accessible Typewriter Effect Pattern

**Learning:** Typewriter animations are inherently inaccessible to screen readers as they announce character by character. To fix this, we duplicate the content: one `sr-only` span with full text, and one `aria-hidden` container for the animation. This breaks standard `getByText` tests because the text now appears twice in the DOM.
**Action:** Always wrap typewriter/animated text components with an accessible twin. When testing these components, use `getAllByText` or specific `data-testid` selectors to target the correct element.
