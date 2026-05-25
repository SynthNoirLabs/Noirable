## 2024-05-22 - Accessible Typewriter Effects

**Learning:** Animated typewriter text is a nightmare for screen readers if not handled correctly. They may announce every character update or nothing at all. Additionally, resetting the animation on every streamed chunk creates a jarring visual flicker.
**Action:** Always duplicate the full content in an `sr-only` element for screen readers, and hide the animated version with `aria-hidden="true"`. For streaming text, ensure the animation logic detects appended content and continues smoothly instead of restarting.

## 2026-02-24 - Accessible Loading States

**Learning:** Loading indicators like pulsing dots are often ignored by screen readers if they lack ARIA roles, leaving users unsure if the system is processing.
**Action:** Wrap loading indicators in a container with `role="status"` and `aria-live="polite"` to ensure the status is announced without interrupting the user.

## 2024-05-24 - Accessible Search Feedback

**Learning:** Filtering lists without explicit feedback leaves screen reader users guessing. Simply updating the DOM isn't enough; they need to know _how many_ items remain.
**Action:** Add a dedicated `sr-only` live region (`role="status"`, `aria-live="polite"`) that explicitly announces "Found X items" or "No matches" whenever the filter changes.

## 2025-05-23 - Keyboard Accessible Splitters

**Learning:** Custom resize handles (`role="separator"`) are not keyboard accessible by default. Users relying on keyboards cannot adjust panel sizes without explicit `tabIndex` and `onKeyDown` handlers.
**Action:** Ensure all interactive separators have `tabIndex={0}`, handle `ArrowLeft`/`ArrowRight` for adjustment, and `Home`/`End` for min/max snapping. Add visible focus indicators (`focus-visible:ring`) to guide keyboard users.

## 2025-05-25 - Accessible Filter Search\n**Learning:** Users relying on screen readers need to know what they are searching for. When using an input designed for filtering lists, use `type="search"`, hide decorative icons with `aria-hidden="true"`, and include a visually hidden label.\n**Action:** Apply `type="search"`, a visually hidden label (`sr-only`), and `aria-hidden` on decorative icons to ensure search inputs are fully accessible.
