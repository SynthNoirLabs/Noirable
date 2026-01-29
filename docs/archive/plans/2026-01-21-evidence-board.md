# Evidence Board Upgrades Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add evidence history (grid/list) and a print/export view.

**Architecture:** Store evidence history in Zustand. Render grid/list in the evidence board. Add `/print` route for print-friendly view.

**Tech Stack:** React, Zustand, Next.js App Router, Vitest.

### Task 1: Add failing tests for evidence history

**Files:**
- Modify: `src/components/layout/DetectiveWorkspace.test.tsx`
- Modify: `src/lib/store/useA2UIStore.ts`

**Step 1: Write the failing test**

Add a test that:
- simulates tool output updates
- expects `evidenceHistory` length to grow
- expects `activeEvidenceId` to update

**Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/components/layout/DetectiveWorkspace.test.tsx`  
Expected: FAIL (no history state).

### Task 2: Implement evidence history state + UI

**Files:**
- Modify: `src/lib/store/useA2UIStore.ts`
- Modify: `src/components/layout/DetectiveWorkspace.tsx`
- Modify: `src/components/renderer/A2UIRenderer.tsx` (if needed for label helpers)
- Create: `src/components/board/EvidenceBoard.tsx`
- Modify: `src/components/layout/DeskLayout.tsx`

**Step 1: Minimal implementation**

- Add `evidenceHistory`, `activeEvidenceId`, and actions.
- On tool output, push new evidence to history and set active id.
- Add `EvidenceBoard` component with grid/list view toggle.
- Render `EvidenceBoard` in the preview pane.

**Step 2: Run tests to verify they pass**

Run: `pnpm vitest run src/components/layout/DetectiveWorkspace.test.tsx`  
Expected: PASS.

**Step 3: Commit**

```bash
git add src/lib/store/useA2UIStore.ts src/components/layout/DetectiveWorkspace.tsx src/components/board/EvidenceBoard.tsx src/components/layout/DeskLayout.tsx src/components/layout/DetectiveWorkspace.test.tsx
git commit -m "feat(ui): add evidence history board"
```

### Task 3: Add print view route

**Files:**
- Create: `src/app/print/page.tsx`
- Create: `src/app/print/page.test.tsx`

**Step 1: Write failing test**

Ensure the print page renders evidence and shows a case header.

**Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/app/print/page.test.tsx`  
Expected: FAIL (no page).

**Step 3: Implement**

Render the active evidence with minimal styling and a print button.

**Step 4: Commit**

```bash
git add src/app/print/page.tsx src/app/print/page.test.tsx
git commit -m "feat(ui): add print view for evidence"
```

### Task 4: Full verification

Run: `pnpm test`
