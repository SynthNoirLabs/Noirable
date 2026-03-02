## 2024-05-22 - Accessible Typewriter Effects

**Learning:** Animated typewriter text is a nightmare for screen readers if not handled correctly. They may announce every character update or nothing at all. Additionally, resetting the animation on every streamed chunk creates a jarring visual flicker.
**Action:** Always duplicate the full content in an `sr-only` element for screen readers, and hide the animated version with `aria-hidden="true"`. For streaming text, ensure the animation logic detects appended content and continues smoothly instead of restarting.

## 2026-02-24 - Accessible Loading States

**Learning:** Loading indicators like pulsing dots are often ignored by screen readers if they lack ARIA roles, leaving users unsure if the system is processing.
**Action:** Wrap loading indicators in a container with `role="status"` and `aria-live="polite"` to ensure the status is announced without interrupting the user.
