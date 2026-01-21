# A2UI Image Storage Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Persist generated images on disk and return short `/api/images/...` URLs instead of base64 in evidence.

**Architecture:** Add an image store helper that writes base64 image data to `.data/images`. Update `resolveA2UIImagePrompts` to save data URLs and use the image API route to serve files.

**Tech Stack:** Next.js App Router, Node `fs/promises`, Vitest.

### Task 1: Write failing tests for image persistence

**Files:**
- Create: `src/lib/ai/imageStore.test.ts`
- Modify: `src/lib/ai/images.test.ts`

**Step 1: Write the failing test**

Create `src/lib/ai/imageStore.test.ts` (node environment) with a test that:
- creates a temp dir
- sets `A2UI_IMAGE_DIR` to that dir
- calls `saveImageBase64` (new helper) with a tiny base64 PNG
- expects a `/api/images/` URL and the file to exist on disk

Add a failing test to `src/lib/ai/images.test.ts` that:
- feeds `resolveA2UIImagePrompts` a `data:image/...;base64,...` src
- expects the returned `image.src` to start with `/api/images/` (not `data:`)

**Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/lib/ai/imageStore.test.ts src/lib/ai/images.test.ts`
Expected: FAIL because `saveImageBase64` does not exist and `resolveA2UIImagePrompts` returns data URLs.

### Task 2: Implement image store + resolver changes

**Files:**
- Create: `src/lib/ai/imageStore.ts`
- Modify: `src/lib/ai/images.ts`
- Modify: `.gitignore`

**Step 1: Write minimal implementation**

Add `saveImageBase64` in `src/lib/ai/imageStore.ts`:
- compute a filename from `uuid + ext`
- write bytes to `A2UI_IMAGE_DIR` (default `.data/images`)
- return `{ url, filePath }`

Update `resolveA2UIImagePrompts` to:
- persist any `data:image/...` src via `saveImageBase64`
- persist generated images before returning
- fall back to SVG placeholder on failure

Add `.data/` to `.gitignore`.

**Step 2: Run test to verify it passes**

Run: `pnpm vitest run src/lib/ai/imageStore.test.ts src/lib/ai/images.test.ts`
Expected: PASS

**Step 3: Commit**

```bash
git add src/lib/ai/imageStore.ts src/lib/ai/images.ts src/lib/ai/imageStore.test.ts src/lib/ai/images.test.ts .gitignore
git commit -m "feat(ai): persist generated images to disk"
```

### Task 3: Add image serving API route

**Files:**
- Create: `src/app/api/images/[id]/route.ts`
- Create: `src/app/api/images/[id]/route.test.ts`

**Step 1: Write the failing test**

Write a test that:
- creates a temp dir and writes a small file
- sets `A2UI_IMAGE_DIR`
- calls `GET` with the filename
- expects status 200 and matching bytes
- calls `GET` with a bad id and expects 404

**Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/app/api/images/[id]/route.test.ts`
Expected: FAIL because the route does not exist.

**Step 3: Write minimal implementation**

Implement `GET` to:
- validate the id format
- read the file from `A2UI_IMAGE_DIR`
- return `Response` with proper `Content-Type` + cache headers
- return 404 when missing/invalid

**Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/app/api/images/[id]/route.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/app/api/images/[id]/route.ts src/app/api/images/[id]/route.test.ts
git commit -m "feat(api): serve persisted A2UI images"
```

### Task 4: Full verification

**Step 1: Run tests**

Run: `pnpm test`
Expected: PASS

**Step 2: Commit**

```bash
git status
```
