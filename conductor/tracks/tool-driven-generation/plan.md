# Implementation Plan: tool-driven-generation

#### Phase 1: Tool Schema & Prompt Alignment
- [ ] Task: Define tool input/output contract [IN PROGRESS - Core exists in tools.ts]
    - [ ] Write tests for `generate_ui` input schema and output validation.
    - [ ] Update tool to accept root object payload and return validated A2UI component.
    - [ ] Update system prompt/tool instructions to mirror schema.

#### Phase 2: Client State Synchronization
- [ ] Task: Parse tool output from UI message parts
    - [ ] Write tests for `DetectiveWorkspace` to handle `tool-generate_ui` parts.
    - [ ] Implement parts parsing with legacy `toolInvocations` fallback.

#### Phase 3: Contextual Updates & Error Handling
- [ ] Task: Support iterative updates
    - [ ] Write tests for update flows and error states.
    - [ ] Implement update logic with schema validation.
- [ ] Task: Noir error UX
    - [ ] Add themed error UI copy and verify render paths.

#### Phase 4: Verification
- [ ] Run `pnpm lint`
- [ ] Run `pnpm test`
- [ ] Run `pnpm exec prettier --check .`
