# Layout Controls Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Narrow the left JSON pane and add collapsible layout controls for the editor and sidebar.

**Architecture:** Store layout flags in `useA2UIStore` (persisted). `DeskLayout` renders conditional grid templates based on state and shows toggle rails when panes are hidden. `ChatSidebar` exposes a collapse button in its header.

**Tech Stack:** Next.js, React, Zustand, Vitest.

### Task 1: Add failing tests for layout toggles

**Files:**
- Modify: `src/components/layout/DeskLayout.test.tsx`
- Modify: `src/components/chat/ChatSidebar.test.tsx`

**Step 1: Write the failing test**

Add tests that assert:
- `DeskLayout` uses the new clamp-based grid classes when sidebar is present.
- `DeskLayout` hides the editor when `showEditor={false}` and shows a reopen button.
- `ChatSidebar` renders a collapse button when `onToggleCollapse` is provided and calls it on click.

**Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/components/layout/DeskLayout.test.tsx src/components/chat/ChatSidebar.test.tsx`  
Expected: FAIL because props/controls don’t exist yet.

### Task 2: Implement layout state + toggles

**Files:**
- Modify: `src/lib/store/useA2UIStore.ts`
- Modify: `src/components/layout/DeskLayout.tsx`
- Modify: `src/components/layout/DetectiveWorkspace.tsx`
- Modify: `src/components/chat/ChatSidebar.tsx`

**Step 1: Minimal implementation**

- Add `layout` to the store with `showEditor/showSidebar` and `updateLayout`.
- Persist layout in zustand’s `persist`.
- Pass layout state to `DeskLayout` from `DetectiveWorkspace`.
- Update `DeskLayout` to render the new grid templates and collapse/expand buttons.
- Add a collapse button in `ChatSidebar` header (near settings) that calls `onToggleSidebar`.

**Step 2: Run tests to verify they pass**

Run: `pnpm vitest run src/components/layout/DeskLayout.test.tsx src/components/chat/ChatSidebar.test.tsx`  
Expected: PASS.

**Step 3: Commit**

```bash
git add src/lib/store/useA2UIStore.ts src/components/layout/DeskLayout.tsx src/components/layout/DetectiveWorkspace.tsx src/components/chat/ChatSidebar.tsx src/components/layout/DeskLayout.test.tsx src/components/chat/ChatSidebar.test.tsx
git commit -m "feat(ui): add collapsible layout controls"
```

### Task 3: Full verification

**Step 1: Run tests**

Run: `pnpm test`  
Expected: PASS.

**Step 2: Commit (if needed)**

```bash
git status
```
