# Project Alignment Design

**Date:** 2026-01-20

## Goal
Align documentation and project tracking with the current codebase, create three new active tracks, then align the tool output with A2UI and follow up with web research on A2UI and Lovable-style tools.

## Scope (Ordered)
1) Update project docs to reflect current implementation (versions, API flows, tool inputs/outputs, auth paths, UI message parts).
2) Create three active conductor tracks: Tool-Driven Generation, Eject Mode, Stability & Polish.
3) Align `generate_ui` tool to emit real A2UI JSON (`card`/`text`) and update client evidence flow accordingly.
4) Web research: A2UI protocol details and Lovable-style workflows; report findings and recommendations.

## Current-State Alignment Targets
- Update `conductor/tech-stack.md` to reflect AI SDK v6, Zod v4, and actual tool and stream usage.
- Update `docs/architecture.md` and `docs/prd.md` to match actual server/client flow and schema constraints.
- Update story docs (`docs/stories`) to match current tool message handling and correct tool schema shape.
- Preserve archive docs but note mismatches where relevant.

## New Tracks (conductor/tracks)
Create three active tracks with:
- `index.md` (links to spec/plan/metadata)
- `spec.md` (goals, functional/non-functional requirements, acceptance criteria)
- `plan.md` (phased tasks with TDD steps)
- `metadata.json` (status: new, description, timestamps)

Track topics:
1) **Tool-Driven Generation**: real A2UI outputs, schema validation, tool error handling, state update pipeline.
2) **Eject Mode**: transform A2UI JSON into a React + Tailwind component; include formatting and export UX.
3) **Stability & Polish**: hydration warnings, error boundaries, latency, UX polish, QA tasks.

## Tool Alignment Design
- `generate_ui` input should be a root object: `{ component: A2UIComponent }`.
- Tool output should be the validated A2UI component itself.
- System prompt must instruct the model to call the tool with the `component` object.
- Client should parse tool output from UI message parts; keep legacy fallback for `toolInvocations`.
- If tool output fails validation, do not update evidence and show in-character error.

## Research Deliverable
Research A2UI and Lovable-style systems; report:
- authoritative sources and any official specs
- typical tool schema patterns (root object, strict mode)
- A2UI-to-code export patterns used in the wild
- UX patterns for draft/preview/refine/export workflows
- practical recommendations for this codebase

## Out of Scope
- Full production hardening
- Multi-user persistence or auth
- Mobile-first responsiveness beyond current layout

## Testing Strategy
- Update unit tests for tool schema and evidence update flow
- Maintain sanity and e2e checks (already in repo)
- Verify no regressions in lint/format/test gates

## Risks / Notes
- A2UI spec availability may be limited; report gaps transparently
- Provider schemas require root object; this constrains tool input design

## Next Action
Confirm and proceed to implementation plan and execution in a worktree.
