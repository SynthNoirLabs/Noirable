# Story 2.1: Define `generate_ui` Tool using Zod

## Context
As a system, I want a structured tool definition for the LLM, so it knows the A2UI schema and can generate valid UI components.

## Acceptance Criteria
- [x] Create `src/lib/ai/tools.ts`.
- [x] Define `generate_ui` tool using `zod` schema from `src/lib/protocol/schema.ts`.
- [x] The tool should accept a `component` object (A2UIComponent).
- [x] Update `/api/chat` to register this tool in the `streamText` call.

## Technical Notes
- Use `tool()` helper from `ai`.
- Ensure schema description is clear so LLM knows when to use it.

## Test Plan
- Unit test: Verify tool definition exports correct schema.
- Integration: Mock LLM response triggering the tool (requires mocking `streamText` response).
