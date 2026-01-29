# Resizable Layout Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add draggable resize handles for editor and sidebar panes, persisting widths.

**Architecture:** Store widths in `useA2UIStore` and render them through CSS variables on `DeskLayout`.

**Tech Stack:** React, Zustand, Vitest.

### Task 1: Add failing tests for resizable widths

**Files:**
- Modify: `src/components/layout/DeskLayout.test.tsx`
- Modify: `src/lib/store/useA2UIStore.ts` (if needed for defaults)

**Step 1: Write the failing test**

Add a test that:
- renders `DeskLayout` with `editorWidth=280` and `sidebarWidth=360`
- asserts the container has inline style `--editor-w: 280px` and `--sidebar-w: 360px`

**Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/components/layout/DeskLayout.test.tsx`  
Expected: FAIL (no CSS vars yet).

### Task 2: Implement drag handles + store fields

**Files:**
- Modify: `src/lib/store/useA2UIStore.ts`
- Modify: `src/components/layout/DeskLayout.tsx`
- Create: `src/components/layout/ResizeHandle.tsx`
- Modify: `src/components/layout/DetectiveWorkspace.tsx`

**Step 1: Minimal implementation**

- Add `editorWidth/sidebarWidth` to layout state with defaults.
- Update `DeskLayout` to set CSS vars and use them in `grid-template-columns`.
- Add `ResizeHandle` component for pointer drag logic.
- Wire the handle callbacks to update store widths.

**Step 2: Run tests to verify they pass**

Run: `pnpm vitest run src/components/layout/DeskLayout.test.tsx`  
Expected: PASS.

**Step 3: Commit**

```bash
git add src/lib/store/useA2UIStore.ts src/components/layout/DeskLayout.tsx src/components/layout/DetectiveWorkspace.tsx src/components/layout/ResizeHandle.tsx src/components/layout/DeskLayout.test.tsx
git commit -m "feat(ui): add resizable layout panes"
```

### Task 3: Full verification

**Step 1: Run tests**

Run: `pnpm test`  
Expected: PASS.
