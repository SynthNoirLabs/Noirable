# Story 2.1: Define `generate_ui` Tool using Zod

## Context
As a system, I want a structured tool definition for the LLM, so it knows the A2UI schema and can generate valid UI components.

## Acceptance Criteria
- [x] Create `src/lib/ai/tools.ts`.
- [x] Define `generate_ui` tool using Zod (input must be a root object).
- [x] The tool currently accepts an `instruction` string in an object payload.
- [x] Update `/api/chat` to register this tool in the `streamText` call.

## Technical Notes
- Use `tool()` helper from `ai` and `inputSchema` (AI SDK v6).
- Ensure schema description is clear so LLM knows when to use it.
- Reminder: tool schemas must be JSON Schema with root `type: "object"`.

## Test Plan
- Unit test: Verify tool definition exports correct schema.
- Integration: Mock LLM response triggering the tool (requires mocking `streamText` response).
