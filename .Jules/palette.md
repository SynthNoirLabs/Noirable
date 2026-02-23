## 2024-05-22 - Accessible Typewriter Effects

**Learning:** Animated typewriter text is a nightmare for screen readers if not handled correctly. They may announce every character update or nothing at all. Additionally, resetting the animation on every streamed chunk creates a jarring visual flicker.
**Action:** Always duplicate the full content in an `sr-only` element for screen readers, and hide the animated version with `aria-hidden="true"`. For streaming text, ensure the animation logic detects appended content and continues smoothly instead of restarting.

## 2024-10-24 - Accessible Loading States

**Learning:** Visual-only loading indicators (like pulsing dots) are invisible to screen readers, leaving them unaware that the application is processing. Additionally, using `text-muted` with `opacity-50` can create insufficient contrast.
**Action:** Always wrap loading indicators in a container with `role="status"` and `aria-live="polite"`. Ensure the loading text has sufficient contrast ratios or provide an `sr-only` description.
