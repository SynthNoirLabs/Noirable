# bmad Project Status Report

**Generated:** 2026-01-28  
**Version:** 1.0  
**Status:** Active Development

---

## Executive Summary

**bmad (synthNoirUI)** is a noir-themed AI evidence board where AI generates UI via tool calls. The chat interface streams A2UI JSON, validated via Zod, and rendered as visual "evidence" on a detective's desk.

| Metric | Status |
|--------|--------|
| **Core Architecture** | ✅ Complete |
| **AI Integration** | ✅ Complete |
| **UI Rendering** | ✅ Complete |
| **Eject/Export** | ✅ Complete |
| **CI Gate (`pnpm check`)** | ⚠️ Failing (formatting) |
| **Test Coverage** | 21 unit + 1 E2E |

---

## Product Vision

### Core Concept
A hybrid UI generation platform combining:
- **Draft Mode (A2UI):** Rapid, secure, declarative JSON protocol for UI drafting
- **Eject Mode:** One-click export to editable React + Tailwind code

### Key Features
1. **AI-Driven Command Center** — Natural language chat with noir detective persona
2. **Split-Pane Detective's Desk** — Live JSON editor + rendered preview
3. **Evidence Board** — History of generated UI components
4. **Eject to Code** — Export to standalone React components

### Target Audience
Frontend developers exploring AI-assisted UI generation (experimental/personal project).

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client (Next.js)                        │
├─────────────┬─────────────┬─────────────┬──────────────────────┤
│ JSON Editor │ Evidence    │ Eject Panel │ Chat Sidebar         │
│             │ Board       │ (React/JSON)│ (useChat)            │
└──────┬──────┴──────┬──────┴──────┬──────┴──────────┬───────────┘
       │             │             │                  │
       └─────────────┴─────────────┴──────────────────┘
                              │
                    ┌─────────▼─────────┐
                    │   Zustand Store   │
                    │ (evidence, history)│
                    └─────────┬─────────┘
                              │
                    ┌─────────▼─────────┐
                    │  POST /api/chat   │
                    │  (streamText)     │
                    └─────────┬─────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
         ┌────────┐     ┌────────┐     ┌────────┐
         │ OpenAI │     │Anthropic│    │ Google │
         └────────┘     └────────┘     └────────┘
```

### Tech Stack

| Category | Technology | Version |
|----------|------------|---------|
| Framework | Next.js (App Router) | 16.x |
| AI SDK | Vercel AI SDK | 6.x |
| State | Zustand | 5.x |
| Schema | Zod | 4.x |
| Styling | Tailwind CSS | 4.x |
| Testing | Vitest + Playwright | 4.x |

---

## Implementation Status

### Epic 1: Foundation & Persona ✅ COMPLETE

| Story | Status | Evidence |
|-------|--------|----------|
| 1.1 Setup Vercel AI SDK Core | ✅ Complete | `src/app/api/chat/route.ts` |
| 1.2 Chat Sidebar (Desktop) | ✅ Complete | `src/components/chat/ChatSidebar.tsx` |
| 1.3 System Prompt (Noir Persona) | ✅ Complete | `src/lib/ai/prompts.ts` |
| 1.4 Multi-provider API Key Support | ✅ Complete | `src/lib/ai/factory.ts` |

### Epic 2: Tool-Driven Generation ✅ COMPLETE

| Story | Status | Evidence |
|-------|--------|----------|
| 2.1 Define `generate_ui` Tool | ✅ Complete | `src/lib/ai/tools.ts` |
| 2.2 Connect Tool to Zustand | ✅ Complete | `src/components/layout/DetectiveWorkspace.tsx` |
| 2.3 Contextual Updates | ✅ Complete | Evidence in system prompt, `buildSystemPrompt()` |
| 2.4 In-Character Error Handling | ✅ Complete | "REDACTED" fallback UI |

### Track: eject-mode ✅ COMPLETE

| Phase | Status | Evidence |
|-------|--------|----------|
| Generator Core | ✅ Complete | `src/lib/eject/exportA2UI.ts` (20+ component types) |
| UI Entry Point | ✅ Complete | `src/components/eject/EjectPanel.tsx` |
| Formatting & Export | ✅ Complete | React + JSON tabs, copy-to-clipboard |

### Track: stability-polish 🔄 IN PROGRESS

| Phase | Status | Notes |
|-------|--------|-------|
| Harden message parsing | ✅ Complete | Legacy + modern AI SDK formats |
| Sanity checks | ✅ Complete | `pnpm sanity:chat` script |
| CI verification | ⚠️ Blocked | Prettier errors (5 files) |

### Track: tool-driven-generation 🔄 IN PROGRESS

| Phase | Status | Notes |
|-------|--------|-------|
| Tool Schema | ✅ Complete | Core exists in tools.ts |
| Client State Sync | ✅ Complete | Parts parsing + legacy fallback |
| Contextual Updates | ✅ Complete | Evidence injection working |
| Error Handling | ✅ Complete | Noir-themed error UI |
| Verification | ⚠️ Blocked | Prettier errors |

---

## A2UI Protocol Status

### Supported Component Types (20 total)

| Category | Components | Status |
|----------|------------|--------|
| **Layout** | container, row, column, grid, tabs | ✅ Complete |
| **Content** | text, heading, paragraph, callout, badge, divider, list, table, stat, card | ✅ Complete |
| **Form** | input, textarea, select, checkbox, button | ✅ Complete |
| **Media** | image (with prompt → generation → URL) | ✅ Complete |

### Style System

```typescript
{
  padding: "none" | "xs" | "sm" | "md" | "lg" | "xl",
  gap: "none" | "xs" | "sm" | "md" | "lg" | "xl",
  align: "start" | "center" | "end" | "stretch",
  width: "auto" | "full" | "1/2" | "1/3" | "2/3",
  variant: "primary" | "secondary" | "ghost" | "danger",
  className: string  // Custom Tailwind
}
```

---

## AI Provider Status

### Supported Providers (4)

| Provider | Status | Key Source |
|----------|--------|------------|
| OpenAI | ✅ Active | `OPENAI_API_KEY` |
| OpenAI-Compatible | ✅ Active | `OPENAI_BASE_URL` |
| Anthropic | ✅ Active | `ANTHROPIC_API_KEY` |
| Google | ✅ Active | `GOOGLE_GENERATIVE_AI_API_KEY` |

### Model Registry (28 models)

| Provider | Chat Models | Image Models |
|----------|-------------|--------------|
| OpenAI | gpt-5.2, gpt-5.2-mini, gpt-5, o3, o4-mini, gpt-4o, gpt-4o-mini | gpt-image-1.5, dall-e-3 |
| Anthropic | claude-opus-4.5, claude-sonnet-4, claude-3-5-haiku | — |
| Google | gemini-3-pro, gemini-3-flash, gemini-2.5-flash | gemini-3-pro-image, imagen-4.0 |

### Image Generation
- **Noir styling auto-injected:** "rain-slicked streets, moody low-key lighting, high contrast, film grain"
- **Storage:** `.data/images/` served via `/api/images/[id]`
- **Fallback:** SVG placeholder if generation fails

---

## UI Components Status

| Component | Location | Status |
|-----------|----------|--------|
| DetectiveWorkspace | `src/components/layout/` | ✅ Complete |
| DeskLayout | `src/components/layout/` | ✅ Complete |
| ResizeHandle | `src/components/layout/` | ✅ Complete |
| ChatSidebar | `src/components/chat/` | ✅ Complete |
| EvidenceBoard | `src/components/board/` | ✅ Complete |
| A2UIRenderer | `src/components/renderer/` | ✅ Complete |
| EjectPanel | `src/components/eject/` | ✅ Complete |
| TypewriterText | `src/components/noir/` | ✅ Complete |
| ModelSelector | `src/components/settings/` | ✅ Complete |
| Print View | `src/app/print/` | ✅ Complete |

---

## Test Coverage

### Summary

| Category | Files | Tests |
|----------|-------|-------|
| AI Layer | 6 | ~25 |
| API Routes | 2 | ~10 |
| Protocol/Export | 2 | ~20 |
| Components | 7 | ~45 |
| E2E | 1 | 1 |
| **Total** | **21** | **~100** |

### Quality Gates

```bash
pnpm check    # prettier + eslint + vitest + build
pnpm test     # Vitest unit/integration
pnpm e2e      # Playwright E2E
pnpm sanity:chat  # Live API validation
```

### Coverage Gaps

| Gap | Priority | Notes |
|-----|----------|-------|
| No coverage thresholds | Medium | Add 80% target to vitest.config |
| Limited E2E scenarios | Low | Expand beyond basic chat flow |
| No visual regression | Low | Consider for noir theme consistency |

---

## Current Blockers

### CI Gate Failure

**Status:** `pnpm check` failing due to Prettier formatting

**Affected Files:**
1. `implementation_plan.md`
2. `plan_review.md`
3. `research_findings.md`
4. `research_review.md`
5. `src/components/layout/DetectiveWorkspace.test.tsx`

**Resolution:** Run `pnpm prettier --write .`

### Pre-existing Type Errors in Tests

**Status:** LSP reports type errors in test files (tests may still pass at runtime)

| File | Issue |
|------|-------|
| `src/lib/ai/tools.test.ts` | Property 'type' on JSONSchema7 Promise |
| `src/lib/protocol/schema.test.ts` | Property access on union types |
| `src/lib/ai/resolveImages.test.ts` | Type literal vs string incompatibility |
| `src/app/api/images/[id]/route.test.ts` | Request vs NextRequest type mismatch |

**Resolution:** Add proper type assertions or narrow union types in tests.

### Untracked Files

| File | Decision Needed |
|------|-----------------|
| `conductor/AGENTS.md` | Track or gitignore |
| `implementation_plan.md` | Archive or delete |
| `plan_review.md` | Archive or delete |
| `research_findings.md` | Archive or delete |
| `research_review.md` | Archive or delete |
| `tests/stress/` | Track or gitignore |

---

## Roadmap

### Immediate (Fix CI)
- [ ] Fix Prettier formatting errors
- [ ] Decide on untracked planning docs
- [ ] Run `pnpm check` to verify

### Short-term
- [ ] Add test coverage thresholds (80%)
- [ ] Expand E2E test suite
- [ ] Document model switching in README

### Medium-term
- [ ] Form submission handlers (input/button actions)
- [ ] Multi-file export (scaffold complete component directories)
- [ ] Persistent evidence storage (localStorage/IndexedDB)

### Future Considerations
- [ ] Live sandbox execution (Sandpack)
- [ ] Collaborative editing
- [ ] Mobile responsive design

---

## Key Files Reference

| Task | Location |
|------|----------|
| Add A2UI component type | `src/lib/protocol/schema.ts` |
| Change AI behavior | `src/lib/ai/prompts.ts` |
| Add/modify provider | `src/lib/ai/factory.ts` |
| Image generation | `src/lib/ai/images.ts` |
| Model capabilities | `src/lib/ai/model-registry.ts` |
| Global state | `src/lib/store/useA2UIStore.ts` |
| Main orchestrator | `src/components/layout/DetectiveWorkspace.tsx` |
| Code export | `src/lib/eject/exportA2UI.ts` |

---

## Commands Reference

```bash
# Development
pnpm dev              # Start dev server (port 3000)
pnpm build            # Production build

# Validation
pnpm check            # Full CI gate (prettier + eslint + vitest + build)
pnpm lint             # ESLint only
pnpm test             # Vitest tests
pnpm test:coverage    # Tests with coverage report
pnpm e2e              # Playwright E2E

# Utilities
pnpm sanity:chat      # Live API tool validation
```

---

*This document auto-generated from codebase analysis. Update as features are added.*
