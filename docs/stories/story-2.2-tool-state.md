# Story 2.2: Connect Tool execution to Zustand State

## Context
As a user, when the AI generates a UI, I want the "Evidence Board" to update instantly.

## Acceptance Criteria
- [x] Create `src/lib/store/useA2UIStore.ts` (Zustand).
- [x] Store should hold `currentEvidence` (A2UIInput | null).
- [x] Update `DetectiveWorkspace` (or `ChatSidebar`) to handle tool calls.
- [x] **Crucial:** Vercel AI SDK v6 executes tools on the server (`execute: async ...`), then streams UI messages back.
    - *Decision:* The client updates the store when a tool output arrives.
    - *Pattern:* Server validates tool output and returns it in UI message parts.
    - *Client Side:* Watch `messages[].parts` for `tool-generate_ui` with `state: "output-available"` and update Zustand.
    - *Legacy fallback:* If `parts` are missing, read `toolInvocations`.

## Technical Notes
- `useEffect` in `DetectiveWorkspace` to sync `messages[].parts` tool output -> `useA2UIStore`.
- Legacy fallback: `toolInvocations` when `parts` are absent.
- Handle "partial" JSON? No, wait for complete tool output.

## Test Plan
- Unit test: Zustand store actions.
- Integration test: Simulate tool invocation and verify store update.
