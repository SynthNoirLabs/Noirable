# Maintenance Docs + Quality Checks Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Run quality checks/tests, update outdated documentation (including `AGENTS.md` and relevant docs), review local state, and commit the current changes.

**Architecture:** Audit current repo state and documentation for drift against the codebase (chat transport, evidence typing, scripts), then update docs to reflect the current behavior and commands. Run the project’s quality gate and commit all intended changes together.

**Tech Stack:** Next.js 16, TypeScript, Zod, Zustand, Vercel AI SDK, pnpm, Vitest, ESLint, Prettier.

### Task 1: Inspect local state and doc drift

**Files:**
- Read: `AGENTS.md`
- Read: `README.md`
- Read: `docs/architecture.md`
- Read: `docs/ai-sdk-llms.txt`
- Read: `docs/stories/*.md`

**Step 1: Check repo status**

Run: `git status -sb`
Expected: show modified files and untracked entries (record what’s pending).

**Step 2: Scan docs for outdated references**

Run: `rg "A2UIComponent|A2UIInput|useChat|DefaultChatTransport|pnpm check|/api/chat" docs -n`
Expected: locate candidates to update.

### Task 2: Update AGENTS.md and docs to match current behavior

**Files:**
- Modify: `AGENTS.md`
- Modify: `README.md`
- Modify: `docs/architecture.md`
- Modify (as needed): `docs/stories/*.md`

**Step 1: Update AGENTS.md commands**

- Ensure `pnpm check` reflects the current script (includes build).

**Step 2: Update README.md**

- Replace template content with project-specific run/test commands and brief project overview.

**Step 3: Update architecture/stories**

- Align documentation to reflect current chat transport + evidence flow and A2UI input typing where referenced.

### Task 3: Run quality checks/tests

**Files:** none

**Step 1: Run the quality gate**

Run: `pnpm check`
Expected: exit 0.

### Task 4: Commit changes

**Files:**
- Modify: `AGENTS.md`
- Modify: `README.md`
- Modify: `docs/architecture.md`
- Modify (as needed): `docs/stories/*.md`
- Modify: code files already changed in working tree
- Create: `docs/plans/2026-01-21-maintenance-docs-quality-checks.md`

**Step 1: Review diff**

Run: `git status -sb` and `git diff`
Expected: confirm intended files only.

**Step 2: Commit**

Run:
```
git add AGENTS.md README.md docs/architecture.md docs/stories/*.md docs/plans/2026-01-21-maintenance-docs-quality-checks.md src package.json
```
Commit:
```
git commit -m "chore(maintenance): update docs and run quality checks"
```
