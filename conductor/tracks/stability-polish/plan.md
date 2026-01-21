# Implementation Plan: stability-polish

#### Phase 1: Guardrails & Errors
- [ ] Task: Harden message parsing
    - [ ] Write tests for missing/partial message parts and tool outputs.
    - [ ] Implement defensive parsing and error states.

#### Phase 2: Diagnostics
- [ ] Task: Sanity checks for `/api/chat` [IN PROGRESS - Script exists in sanity-chat.ts]
    - [ ] Ensure sanity script validates streaming format.
    - [ ] Add docs on running the check locally.

#### Phase 3: Verification
- [ ] Run `pnpm lint`
- [ ] Run `pnpm test`
- [ ] Run `pnpm exec prettier --check .`
- [ ] Run `pnpm e2e`
