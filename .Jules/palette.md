## 2024-05-22 - Accessible Typewriter Effects

**Learning:** Animated typewriter text is a nightmare for screen readers if not handled correctly. They may announce every character update or nothing at all. Additionally, resetting the animation on every streamed chunk creates a jarring visual flicker.
**Action:** Always duplicate the full content in an `sr-only` element for screen readers, and hide the animated version with `aria-hidden="true"`. For streaming text, ensure the animation logic detects appended content and continues smoothly instead of restarting.

## 2024-05-23 - Accessible Search Results

**Learning:** Visual filtering (like search) provides no feedback to screen readers unless explicitly announced. Users may type and not know if results appeared or if the list is empty.
**Action:** Add a visually hidden `div` with `role="status"` and `aria-live="polite"` that updates with a text summary (e.g., "5 items found") whenever the filter results change.
