## 2025-02-18 - Typewriter Text Accessibility
**Learning:** Animated text (like typewriter effects) can be extremely annoying for screen reader users as it announces each character update or partial text.
**Action:** Always provide the full text in an `sr-only` element and hide the animated visual representation with `aria-hidden="true"`.
