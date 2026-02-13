## 2024-05-22 - Accessible Typewriter Pattern
**Learning:** Typewriter animations (character-by-character updates) are inaccessible to screen readers and create duplicate content in tests when using `sr-only` + `aria-hidden` pattern.
**Action:** Always render full text in `sr-only` span first, hide animated text with `aria-hidden="true"`, and update tests to use `getAllByText` or specific selectors to handle duplicate accessible text.
