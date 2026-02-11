## 2025-02-23 - Accessible Typewriter Animation

**Learning:** Animated text (typewriter effect) creates a poor screen reader experience if not handled. The solution is to render full text in `sr-only` and hide the animated part with `aria-hidden="true"`.
**Action:** When testing, use specific selectors (like `.sr-only`) or `getAllByText` because the text exists twice in the DOM (once for SR, once for visual).
