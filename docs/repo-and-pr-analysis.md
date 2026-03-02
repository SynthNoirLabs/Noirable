# Repository & Open PR Analysis

_Generated: 2026-03-02_

---

## Repository Overview

**synthNoirUI** is a full-stack noir-themed AI interface and reference implementation of the **A2UI (Agent to UI) Protocol** — a typed, declarative JSON schema for AI agents to generate rich UI components (cards, tables, forms, timelines, images) streamed and rendered in real time.

### Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.1.6 (App Router) |
| Language | TypeScript 5 (strict mode) |
| UI | React 19, Tailwind CSS 4, Framer Motion |
| State | Zustand 5 |
| AI | Vercel AI SDK 6 (OpenAI, Anthropic, Google Gemini, OpenAI-compatible) |
| Validation | Zod 4 |
| Sandbox | Sandpack (CodeSandbox) |
| Testing | Vitest (88 test files, 70% coverage threshold), Playwright (E2E), Percy (visual) |
| Linting | ESLint 9, Prettier, Stylelint, Husky pre-commit |
| Package Manager | pnpm 10 (monorepo) |

### Codebase Stats

- **222 TypeScript/TSX source files**
- **88 unit/integration test files**
- **11 Playwright E2E specs**
- **18 A2UI component types** (layout, content, input)
- **18+ registered AI models** across multiple providers

### Architecture

```
src/
├── app/           # Next.js App Router (pages + API routes)
├── components/
│   ├── a2ui/      # A2UI protocol components (content, layout, input, theme)
│   ├── board/     # Evidence board workspace
│   ├── chat/      # Chat sidebar
│   ├── eject/     # Code export + Sandpack sandbox
│   ├── layout/    # App layout (DetectiveWorkspace, ResizeHandle)
│   ├── noir/      # Ambient effects (rain, fog, typewriter, dossier cards)
│   ├── renderer/  # Legacy component renderer
│   ├── settings/  # Settings & customization panels
│   ├── shared/    # Shared UI primitives
│   └── templates/ # 8 pre-built component templates
├── lib/
│   ├── a2ui/      # A2UI v0.9 protocol (schema, catalog, transport, binding)
│   ├── ai/        # Provider factory, tools, prompts, image generation
│   ├── api/       # Rate limiting + CSRF security
│   ├── customization/ # Aesthetic profiles, CSS injection
│   ├── eject/     # A2UI-to-React code generation
│   ├── protocol/  # Legacy Zod schemas
│   ├── store/     # Zustand stores
│   └── ...        # hooks, storage, templates, training, utils
└── __tests__/
```

### CI/CD

- **Pre-commit hook:** `pnpm check` (Prettier + ESLint + Stylelint + Vitest + build)
- **GitHub Actions:** Node 20.x, pnpm 10, `pnpm check` on PRs + main
- **Buildkite:** Install → Check → E2E (Playwright)

---

## Open Pull Requests Analysis

**9 open PRs**, all authored by `komod0`, all targeting `main`, none with reviewers assigned.

### PR Inventory

| PR | Title | Created | Scope |
|---|---|---|---|
| #14 | Accessible loading state for chat | Feb 21 | ARIA `role="status"` + `aria-live="polite"` on chat loading indicator |
| #15 | Accessible Search Result Announcements | Feb 22 | Live region in EvidenceBoard for search result count |
| #16 | Accessible Chat Loading State | Feb 23 | ARIA live region + removed low-contrast opacity styling |
| #17 | Accessible Chat Loading State | Feb 24 | Same as #16 + adds `ChatSidebar.a11y.test.tsx` |
| #18 | Accessible Search Feedback for Evidence Board | Feb 25 | Visually hidden live region for search result count |
| #19 | Keyboard Accessibility for ResizeHandle | Feb 26 | `tabIndex`, `onKeyDown`, focus styles for keyboard panel resizing |
| #20 | ChatSidebar Accessibility Enhancements | Feb 27 | Tooltip on Copy button + ARIA on loading indicator |
| #21 | JSON Editor Textarea Accessibility | Feb 28 | `aria-label="Edit JSON case file"` on textarea |
| #22 | Loading Spinner for Chat Submit Button | Mar 1 | Dynamic spinner + `aria-label="Sending message..."` |

### Patterns & Observations

1. **Systematic a11y audit**: All PRs are accessibility improvements — ARIA attributes, keyboard navigation, screen reader support, and contrast fixes. This represents a deliberate accessibility sweep.

2. **Duplicate/overlapping work**:
   - **Chat loading** (#14, #16, #17): Three PRs address the same loading indicator. #17 is the most complete (includes tests).
   - **Search feedback** (#15, #18): Two PRs for search result announcements in EvidenceBoard.

3. **No reviewers assigned**: All 9 PRs have zero reviews — this is the primary bottleneck preventing any from merging.

4. **Small, focused changes**: Each PR touches 1–2 files. Good for reviewability but the duplication creates unnecessary PR noise.

5. **Consistent branch naming**: `palette/` or `palette-` prefix with numeric suffixes suggests automated or semi-automated creation.

### Recommendations

| Priority | Action |
|---|---|
| **High** | Consolidate #14/#16/#17 into a single "chat loading a11y" PR (keep #17 as the winner — it has tests) |
| **High** | Consolidate #15/#18 into a single "search feedback a11y" PR |
| **High** | Assign reviewers to unblock all PRs |
| **Medium** | PR #19 (ResizeHandle keyboard a11y) is the most impactful unique contribution — prioritize review |
| **Medium** | PR #22 (loading spinner) adds genuine UX value beyond a11y compliance — prioritize review |
| **Low** | PR #21 (JSON editor aria-label) is a one-line fix — fast merge candidate |

### Supersession Map

```
#14 (chat loading)     ← superseded by #16 ← superseded by #17 (has tests)
#15 (search announce)  ← overlaps with #18
#19 (resize keyboard)  — unique
#20 (chat sidebar)     — unique (but partially overlaps #17 for loading indicator)
#21 (json editor)      — unique
#22 (loading spinner)  — unique
```

**Net unique PRs after consolidation: 5–6** (down from 9)
