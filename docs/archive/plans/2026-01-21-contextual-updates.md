# Contextual Updates Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Always include the current evidence tree in the model context so follow-up requests can update the existing A2UI tree, with tests covering prompt injection and API behavior.

**Architecture:** Add a `buildSystemPrompt(evidence)` helper, inject evidence into `/api/chat` system prompt, and send evidence from the client via `useChat` request body. Tests verify prompt content and API call behavior.

**Tech Stack:** Next.js App Router, Vercel AI SDK v6, Zod v4, Vitest.

---

### Task 1: Add prompt helper for evidence injection

**Files:**
- Modify: `src/lib/ai/prompts.ts`
- Modify: `src/lib/ai/prompts.test.ts`

**Step 1: Write failing test**
Add a test that calls `buildSystemPrompt` with evidence and expects a `Current Evidence` block.

**Step 2: Run test to verify failure**
Run: `pnpm test -- src/lib/ai/prompts.test.ts`
Expected: FAIL.

**Step 3: Implement helper**
Add `buildSystemPrompt(evidence?: unknown)` that appends a JSON block when evidence is provided.

**Step 4: Run test to verify pass**
Run: `pnpm test -- src/lib/ai/prompts.test.ts`
Expected: PASS.

**Step 5: Commit**
```bash
git add src/lib/ai/prompts.ts src/lib/ai/prompts.test.ts
git commit -m "feat(ai): add system prompt builder for evidence"
```

---

### Task 2: Inject evidence in /api/chat

**Files:**
- Modify: `src/app/api/chat/route.ts`
- Modify: `src/app/api/chat/route.test.ts`

**Step 1: Write failing test**
Add a test that sends `{ evidence: { type: "text", content: "..." } }` and asserts `streamText` receives a `system` containing `Current Evidence` and that JSON.

**Step 2: Run test to verify failure**
Run: `pnpm test -- src/app/api/chat/route.test.ts`
Expected: FAIL.

**Step 3: Implement evidence injection**
Read `evidence` from request JSON and pass `buildSystemPrompt(evidence)` to `streamText`.

**Step 4: Run test to verify pass**
Run: `pnpm test -- src/app/api/chat/route.test.ts`
Expected: PASS.

**Step 5: Commit**
```bash
git add src/app/api/chat/route.ts src/app/api/chat/route.test.ts
git commit -m "feat(api): include evidence in system prompt"
```

---

### Task 3: Send evidence from the client

**Files:**
- Modify: `src/components/layout/DetectiveWorkspace.tsx`

**Step 1: Write failing test**
Update `DetectiveWorkspace` tests to expect `useChat` to be called with a body including `evidence`.

**Step 2: Run test to verify failure**
Run: `pnpm test -- src/components/layout/DetectiveWorkspace.test.tsx`
Expected: FAIL.

**Step 3: Implement request body**
Pass `body: { evidence }` to `useChat` so evidence is sent on requests.

**Step 4: Run test to verify pass**
Run: `pnpm test -- src/components/layout/DetectiveWorkspace.test.tsx`
Expected: PASS.

**Step 5: Commit**
```bash
git add src/components/layout/DetectiveWorkspace.tsx src/components/layout/DetectiveWorkspace.test.tsx
git commit -m "feat(ui): send current evidence with chat requests"
```

---

### Task 4: Final verification

**Step 1: Run full checks**
Run: `pnpm check`
Expected: PASS.

**Step 2: Optional e2e**
Run: `pnpm e2e`
Expected: PASS.
