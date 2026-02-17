## 2024-05-23 - TypewriterText Accessibility
**Learning:** Typewriter animations can be inaccessible to screen readers if they read character-by-character or wait for completion.
**Action:** Always provide the full text in an `sr-only` span and hide the animated text with `aria-hidden="true"`. Use this pattern for any other animated text components (e.g., in overlays or loading states).
