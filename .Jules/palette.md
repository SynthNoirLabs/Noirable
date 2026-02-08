## 2024-05-23 - TypewriterText Accessibility
**Learning:** Typewriter effects that animate character-by-character can be extremely noisy for screen readers if not handled carefully.
**Action:** Use a visually hidden `<span>` with the full text for screen readers (using `sr-only` class) and wrap the animated visual text in a container with `aria-hidden="true"`. Update tests to expect duplicate text nodes or query specifically for visible/hidden content.
