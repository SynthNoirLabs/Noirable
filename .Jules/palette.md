## 2024-05-22 - Accessible Typewriter Effects

**Learning:** Animated typewriter text is a nightmare for screen readers if not handled correctly. They may announce every character update or nothing at all. Additionally, resetting the animation on every streamed chunk creates a jarring visual flicker.
**Action:** Always duplicate the full content in an `sr-only` element for screen readers, and hide the animated version with `aria-hidden="true"`. For streaming text, ensure the animation logic detects appended content and continues smoothly instead of restarting.

## 2024-05-24 - Accessible Search Feedback
**Learning:** Filtering lists without explicit feedback leaves screen reader users guessing. Simply updating the DOM isn't enough; they need to know *how many* items remain.
**Action:** Add a dedicated `sr-only` live region (`role="status"`, `aria-live="polite"`) that explicitly announces "Found X items" or "No matches" whenever the filter changes.
