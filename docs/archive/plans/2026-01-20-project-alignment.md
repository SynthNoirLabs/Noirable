# Project Alignment Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Align documentation and project tracking with current code, create three active tracks, align `generate_ui` with A2UI output, and deliver web research findings.

**Architecture:** Update docs to match current AI SDK v6 + tool flow. Create conductor tracks for upcoming epics. Adjust tool schema/output to return A2UI components and update client processing. Research A2UI/Lovable patterns to guide next steps.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Vercel AI SDK v6, Zod v4, Zustand, Vitest, Playwright, pnpm.

---

### Task 1: Align core docs with current implementation

**Files:**
- Modify: `conductor/tech-stack.md`
- Modify: `docs/architecture.md`
- Modify: `docs/prd.md`
- Modify: `docs/stories/story-2.1-tool-definition.md`
- Modify: `docs/stories/story-2.2-tool-state.md`

**Step 1: Update docs content**
- Reflect AI SDK v6 and streaming via `toUIMessageStreamResponse`.
- Note tool input root object requirement and current provider behavior.
- Document auth path `~/.local/share/opencode/auth.json` and env vars.
- Update tool flow to use UI message `parts` with legacy fallback.

**Step 2: Verify formatting**
Run: `pnpm exec prettier --check .`
Expected: PASS

**Step 3: Commit**
```bash
git add conductor/tech-stack.md docs/architecture.md docs/prd.md docs/stories/story-2.1-tool-definition.md docs/stories/story-2.2-tool-state.md
git commit -m "docs: align specs with current implementation"
```

---

### Task 2: Create active conductor tracks (3)

**Files:**
- Create: `conductor/tracks/tool-driven-generation/index.md`
- Create: `conductor/tracks/tool-driven-generation/spec.md`
- Create: `conductor/tracks/tool-driven-generation/plan.md`
- Create: `conductor/tracks/tool-driven-generation/metadata.json`
- Create: `conductor/tracks/eject-mode/index.md`
- Create: `conductor/tracks/eject-mode/spec.md`
- Create: `conductor/tracks/eject-mode/plan.md`
- Create: `conductor/tracks/eject-mode/metadata.json`
- Create: `conductor/tracks/stability-polish/index.md`
- Create: `conductor/tracks/stability-polish/spec.md`
- Create: `conductor/tracks/stability-polish/plan.md`
- Create: `conductor/tracks/stability-polish/metadata.json`
- Modify: `conductor/tracks.md`

**Step 1: Write specs & plans**
- Define goals, requirements, acceptance criteria for each track.
- Include phased tasks with TDD steps.

**Step 2: Update registry**
- Add track entries in `conductor/tracks.md`.

**Step 3: Verify formatting**
Run: `pnpm exec prettier --check .`
Expected: PASS

**Step 4: Commit**
```bash
git add conductor/tracks.md conductor/tracks/*
git commit -m "conductor: add active tracks for next epics"
```

---

### Task 3: Align generate_ui tool to A2UI output

**Files:**
- Modify: `src/lib/ai/tools.ts`
- Modify: `src/lib/ai/prompts.ts`
- Modify: `src/components/layout/DetectiveWorkspace.tsx`
- Modify: `src/lib/ai/tools.test.ts`
- Modify: `src/components/layout/DetectiveWorkspace.test.tsx`
- Modify: `docs/stories/story-2.1-tool-definition.md`

**Step 1: Write failing tests**
- Tool schema test asserts `{ component: A2UIComponent }` input.
- Integration test updates evidence from tool output.

**Step 2: Run tests (RED)**
Run: `pnpm test -- src/lib/ai/tools.test.ts src/components/layout/DetectiveWorkspace.test.tsx`
Expected: FAIL

**Step 3: Implement minimal code (GREEN)**
- Tool input: `{ component: A2UIComponent }`
- Tool output: validated component
- Prompt instructs tool usage with component object
- Client updates evidence from tool output

**Step 4: Run tests (GREEN)**
Run: `pnpm test -- src/lib/ai/tools.test.ts src/components/layout/DetectiveWorkspace.test.tsx`
Expected: PASS

**Step 5: Full checks**
Run: `pnpm lint` and `pnpm exec prettier --check .`
Expected: PASS

**Step 6: Commit**
```bash
git add src/lib/ai/tools.ts src/lib/ai/prompts.ts src/components/layout/DetectiveWorkspace.tsx src/lib/ai/tools.test.ts src/components/layout/DetectiveWorkspace.test.tsx docs/stories/story-2.1-tool-definition.md
git commit -m "feat(ai): align generate_ui with A2UI output"
```

---

### Task 4: Web research report (A2UI + Lovable-style tools)

**Files:**
- Create: `docs/research/2026-01-20-a2ui-lovable.md`

**Step 1: Research**
- Official A2UI specs or repos (if public)
- Lovable-style tools patterns and workflows
- Open-source clones or similar projects

**Step 2: Write report**
- Summary, citations, recommendations, gaps

**Step 3: Commit**
```bash
git add docs/research/2026-01-20-a2ui-lovable.md
git commit -m "docs(research): summarize A2UI and Lovable-style workflows"
```

---

### Task 5: Final verification

**Step 1: Run full checks**
Run: `pnpm check`
Expected: PASS

**Step 2: Optional e2e**
Run: `pnpm e2e`
Expected: PASS

