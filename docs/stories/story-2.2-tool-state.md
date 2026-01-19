# Story 2.2: Connect Tool execution to Zustand State

## Context
As a user, when the AI generates a UI, I want the "Evidence Board" to update instantly.

## Acceptance Criteria
- [x] Create `src/lib/store/useA2UIStore.ts` (Zustand).
- [x] Store should hold `currentEvidence` (A2UIComponent | null).
- [x] Update `DetectiveWorkspace` (or `ChatSidebar`) to handle tool calls.
- [x] **Crucial:** Vercel AI SDK handles tool execution on server (`execute: async ...`) OR client (`onToolCall`?).
    - *Decision:* We want the *client* to update the store.
    - *Pattern:* The server executes the tool (validation/logic) and returns the result. The client `useChat` hook receives `toolInvocations`.
    - *Refinement:* We can use `onToolCall` in `useChat` OR watch `toolInvocations`.
    - *Better:* Use `maxSteps: 5` on server to allow multi-step? No, simple generation.
    - *Architecture:* Server validates. Client watches `messages` for tool results and updates store? OR Server-side tool updates DB? No DB.
    - *Solution:* Server-side tool execution is "stateless". It just returns "UI Generated". The *Payload* of the tool call is what matters.
    - *Client Side:* Watch `toolInvocations` in `useChat`. When a tool result arrives (or even call), update Zustand.

## Technical Notes
- `useEffect` in `ChatSidebar` (or a headless component) to sync `toolInvocations` -> `useA2UIStore`.
- Handle "partial" JSON? No, wait for complete tool call.

## Test Plan
- Unit test: Zustand store actions.
- Integration test: Simulate tool invocation and verify store update.
