## 2026-02-10 - Accessible Typewriter Effect

**Learning:** Animated text effects (like TypewriterText) cause stuttering or missing announcements for screen readers if not handled correctly.
**Action:** Use a dual-element pattern: `<span class="sr-only">{fullContent}</span>` for AT, and `<span aria-hidden="true">{animatedText}</span>` for visuals. Update tests to use `getAllByText` or specific selectors as the text will appear twice in the DOM.
