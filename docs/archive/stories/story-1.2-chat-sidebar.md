# Story 1.2: Implement Chat Sidebar (Desktop-only)

## Context
As a user, I want a dedicated chat pane, so I can talk to the detective without losing sight of the evidence.

## Acceptance Criteria
- [x] Create `src/components/chat/ChatSidebar.tsx` component.
- [x] Integrate Vercel AI SDK `useChat` hook.
- [x] Render a list of messages (User vs Assistant).
- [x] Style user messages as "Client Notes" (Paper style?).
- [x] Style assistant messages as "Detective Reports" (Typewriter font, Noir style).
- [x] Implement auto-scroll to bottom.
- [x] Input field handles "Enter" to send.
- [x] Sidebar is positioned on the right or left of the "Detective Desk" (or integrated into the Editor pane as a toggle?). *Decision: Architect said "Chat Sidebar". Let's put it on the far right or make the Editor pane switchable.* -> *Re-reading Architecture: "Chat Interface" is a key component.* Let's make it a collapsible sidebar on the Right.

## Technical Notes
- Use `framer-motion` for slide-in/out.
- Use `lucide-react` for icons (Message, Send, Detective Hat).
- Persist `messages` state if possible (optional for this story, but good for UX).

## Test Plan
- Unit test: Renders input and message list.
- Integration test: Mock `useChat` and verify sending adds a message to the list.
