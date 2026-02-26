## 2024-05-22 - Accessible Typewriter Effects

**Learning:** Animated typewriter text is a nightmare for screen readers if not handled correctly. They may announce every character update or nothing at all. Additionally, resetting the animation on every streamed chunk creates a jarring visual flicker.
**Action:** Always duplicate the full content in an `sr-only` element for screen readers, and hide the animated version with `aria-hidden="true"`. For streaming text, ensure the animation logic detects appended content and continues smoothly instead of restarting.

## 2025-05-23 - Keyboard Accessible Splitters

**Learning:** Custom resize handles (`role="separator"`) are not keyboard accessible by default. Users relying on keyboards cannot adjust panel sizes without explicit `tabIndex` and `onKeyDown` handlers.
**Action:** Ensure all interactive separators have `tabIndex={0}`, handle `ArrowLeft`/`ArrowRight` for adjustment, and `Home`/`End` for min/max snapping. Add visible focus indicators (`focus-visible:ring`) to guide keyboard users.
