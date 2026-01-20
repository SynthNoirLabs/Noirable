# Implementation Plan: eject-mode

#### Phase 1: Generator Core
- [ ] Task: Define code generation contract
    - [ ] Write tests for A2UI -> React/Tailwind conversion.
    - [ ] Implement generator with deterministic output.

#### Phase 2: UI Entry Point
- [ ] Task: Add Eject panel
    - [ ] Write tests for Eject toggle and output rendering.
    - [ ] Implement UI panel with copy actions.

#### Phase 3: Formatting & Export
- [ ] Task: Format output with Prettier
    - [ ] Add helper to format generated code.
    - [ ] Ensure JSON export matches current evidence.

#### Phase 4: Verification
- [ ] Run `pnpm lint`
- [ ] Run `pnpm test`
- [ ] Run `pnpm exec prettier --check .`
