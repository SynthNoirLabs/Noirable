## 2024-05-24 - Accessible Typewriter Text
**Learning:** Animated text effects like typewriters can be annoying for screen readers if each character is announced individually.
**Action:** Wrap the animated text in `aria-hidden="true"` and provide the full text in a `sr-only` element so screen readers announce the full content immediately.
