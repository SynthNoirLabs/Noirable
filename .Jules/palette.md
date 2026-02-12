## 2026-02-12 - Animated Text Accessibility
**Learning:** Typewriter or animated text effects are confusing for screen readers as they announce character by character or partial updates.
**Action:** Always provide the full text in an `sr-only` element and hide the animated visual element with `aria-hidden="true"`.
