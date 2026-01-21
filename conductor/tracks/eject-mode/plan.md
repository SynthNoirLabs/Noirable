# Implementation Plan: eject-mode

#### Phase 1: Generator Core
- [x] Task: Define code generation contract
    - [x] Write tests for A2UI -> React/Tailwind conversion (13 test cases).
    - [x] Implement generator with deterministic output (supports all 20+ component types).

#### Phase 2: UI Entry Point
- [x] Task: Add Eject panel
    - [x] Write tests for Eject toggle and output rendering (9 test cases).
    - [x] Implement EjectPanel component with noir theme.
    - [x] Integrate into DetectiveWorkspace with toggle button.

#### Phase 3: Formatting & Export
- [x] Task: Format output with Prettier
    - [x] Generator produces clean, indented React/Tailwind code.
    - [x] JSON export matches current evidence via exportA2UIAsJSON.
    - [x] Copy-to-clipboard for both React and JSON views.

#### Phase 4: Verification
- [x] Run `pnpm lint` - PASSED
- [x] Run `pnpm test` - 100 tests passed
- [x] Run `pnpm check` - Build successful
