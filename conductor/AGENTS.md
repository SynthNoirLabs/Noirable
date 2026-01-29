# conductor/ — AI-Driven Development Orchestration

## Overview

Project management system for AI agents. Contains product specs, development tracks, style guides, and workflow definitions. This is the "brain" of the bmad project.

## Structure

```
conductor/
├── product.md            # Product vision & definition
├── product-guidelines.md # Noir persona rules
├── tech-stack.md         # Approved tech decisions
├── workflow.md           # TDD workflow, quality gates
├── tracks.md             # Active development tracks
├── tracks/               # Individual track specs/plans
│   ├── eject-mode/
│   ├── stability-polish/
│   └── tool-driven-generation/
├── code_styleguides/     # Language-specific standards
│   ├── typescript.md
│   ├── javascript.md
│   ├── html-css.md
│   └── general.md
└── archive/              # Completed track checkpoints
```

## Key Files

| File | When to Read |
|------|--------------|
| `product.md` | Understanding project goals, A2UI concept |
| `workflow.md` | Task lifecycle, TDD phases, commit conventions |
| `tech-stack.md` | Before adding dependencies |
| `tracks.md` | Finding current work priorities |

## Workflow Rules

1. **Plan is source of truth** — All work tracked in `plan.md`
2. **TDD required** — Red → Green → Refactor
3. **Coverage >80%** — No exceptions
4. **Tech stack changes** — Document BEFORE implementing
5. **CI-aware** — Use `CI=true` for non-interactive execution

## Task Lifecycle

```
[ ] Select from plan.md
    ↓
[~] Mark in-progress
    ↓
    Write failing tests (Red)
    ↓
    Implement to pass (Green)
    ↓
    Refactor
    ↓
[x] Mark complete + commit SHA
```

## Track Organization

Each track has:
- `index.md` — Overview
- `spec.md` — Technical specification
- `plan.md` — Task checklist with SHAs

Active tracks listed in `tracks.md`. Completed tracks archived with checkpoints.

## Code Style

See `code_styleguides/` — enforces:
- Named exports only
- No `var`, no `#private`, no `{}` type
- Explicit semicolons
- `===` equality
