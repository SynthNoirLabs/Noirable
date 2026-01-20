# Track Specification: eject-mode

#### Overview
This track adds an "Eject" workflow that turns the current A2UI evidence into editable code artifacts, enabling developers to take over manually without losing the noir UI context.

#### Functional Requirements
- **FR1: Code Generation**
    - Convert the current A2UI component into a deterministic React + Tailwind snippet.
    - Provide a plain JSON export option for raw A2UI.
- **FR2: UX Entry Point**
    - Add an "Eject" action in the workspace UI to reveal generated code.
- **FR3: Formatting**
    - Format generated code using Prettier before display/copy.

#### Non-Functional Requirements
- **Determinism:** Same A2UI input yields identical output.
- **Safety:** Generated code is inert (no remote execution).
- **Clarity:** The user can copy output with a single action.

#### Acceptance Criteria
- [ ] Eject view shows generated React + Tailwind code.
- [ ] Users can copy code and raw A2UI JSON.
- [ ] Code formatting is consistent with repo Prettier config.
- [ ] Tests cover generator output and UI entry path.

#### Out of Scope
- Live sandbox execution (Sandpack).
- Multi-file scaffolding beyond a single component module.
