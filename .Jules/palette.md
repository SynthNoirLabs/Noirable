## 2025-02-09 - Accessible Typewriter Text

**Learning:** `TypewriterText` component duplicates text nodes to provide immediate accessibility (`sr-only`) while animating visually (`aria-hidden`). This breaks `getByText` tests which expect a single element.
**Action:** When testing components with accessible text duplication, use `getAllByText` or specific selectors (e.g. by class) to target the intended element.
