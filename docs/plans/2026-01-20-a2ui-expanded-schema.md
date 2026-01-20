# A2UI Expanded Schema Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Expand the A2UI schema to support full-page component trees (layout, content, inputs), update the renderer, prompt guidance, and tests.

**Architecture:** Introduce a recursive A2UI component tree with tokenized style props plus optional `className`. Update `A2UIRenderer` to recursively render layouts, content, and inputs with noir defaults and token mappings. Keep validation via Zod and existing tool flow.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Zod v4, Vercel AI SDK v6, Vitest.

---

### Task 1: Expand A2UI schema for layout/content/input components

**Files:**
- Modify: `src/lib/protocol/schema.ts`
- Modify: `src/lib/protocol/schema.test.ts`

**Step 1: Write failing schema tests**
Add tests that validate a nested tree and fail on invalid shapes.

```ts
const data = {
  type: "container",
  style: { padding: "lg", gap: "md", align: "center" },
  children: [
    { type: "heading", level: 2, text: "Case Intake" },
    {
      type: "row",
      style: { gap: "sm" },
      children: [
        { type: "input", label: "Name", placeholder: "Jane Doe" },
        { type: "button", label: "Submit", variant: "primary" },
      ],
    },
  ],
};
expect(a2uiSchema.safeParse(data).success).toBe(true);
```

Also add an invalid test (e.g., `grid` without `children` or `image` without `src`).

**Step 2: Run tests to verify failures**
Run: `pnpm test -- src/lib/protocol/schema.test.ts`
Expected: FAIL (new tests).

**Step 3: Implement expanded schema**
In `src/lib/protocol/schema.ts`, add:
- `styleSchema` with tokens: `padding`, `gap`, `align`, `width`, `variant`, `className?`
- Component schemas for `container`, `row`, `column`, `grid`, `heading`, `paragraph`, `image`, `input`, `textarea`, `select`, `checkbox`, `button`.
- Use `z.lazy` to define `a2uiSchema` recursively.

Example skeleton:
```ts
const styleSchema = z.object({
  padding: z.enum(["none","xs","sm","md","lg","xl"]).optional(),
  gap: z.enum(["none","xs","sm","md","lg","xl"]).optional(),
  align: z.enum(["start","center","end","stretch"]).optional(),
  width: z.enum(["auto","full","1/2","1/3","2/3"]).optional(),
  variant: z.enum(["primary","secondary","ghost","danger"]).optional(),
  className: z.string().optional(),
});

const containerSchema = z.object({
  type: z.literal("container"),
  style: styleSchema.optional(),
  children: z.array(z.lazy(() => a2uiSchema)),
});
```

**Step 4: Run tests to verify pass**
Run: `pnpm test -- src/lib/protocol/schema.test.ts`
Expected: PASS.

**Step 5: Commit**
```bash
git add src/lib/protocol/schema.ts src/lib/protocol/schema.test.ts
git commit -m "feat(a2ui): expand schema for layouts and inputs"
```

---

### Task 2: Update A2UIRenderer to render component trees

**Files:**
- Modify: `src/components/renderer/A2UIRenderer.tsx`
- Modify: `src/components/renderer/A2UIRenderer.test.tsx`

**Step 1: Write failing renderer tests**
Add a test that renders a nested layout and checks for heading, input label, and button text.

```tsx
render(<A2UIRenderer data={tree} />);
expect(screen.getByText("Case Intake")).toBeInTheDocument();
expect(screen.getByLabelText("Name")).toBeInTheDocument();
expect(screen.getByText("Submit")).toBeInTheDocument();
```

**Step 2: Run tests to verify failure**
Run: `pnpm test -- src/components/renderer/A2UIRenderer.test.tsx`
Expected: FAIL.

**Step 3: Implement recursive renderer**
- Add a `renderComponent(node)` helper.
- Map tokenized style values to Tailwind classes.
- Render semantic tags (`h1–h4`, `p`, `img`) and noir-styled form controls.

Example mapping helper:
```ts
const spacing = { none:"", xs:"p-2", sm:"p-3", md:"p-4", lg:"p-6", xl:"p-8" };
```

**Step 4: Run tests to verify pass**
Run: `pnpm test -- src/components/renderer/A2UIRenderer.test.tsx`
Expected: PASS.

**Step 5: Commit**
```bash
git add src/components/renderer/A2UIRenderer.tsx src/components/renderer/A2UIRenderer.test.tsx
git commit -m "feat(ui): render expanded A2UI component trees"
```

---

### Task 3: Update prompts & tool guidance for tree output

**Files:**
- Modify: `src/lib/ai/prompts.ts`
- Modify: `src/lib/ai/prompts.test.ts`

**Step 1: Write failing prompt test**
Add an assertion that the prompt mentions nested trees and layout primitives.

**Step 2: Run tests to verify failure**
Run: `pnpm test -- src/lib/ai/prompts.test.ts`
Expected: FAIL.

**Step 3: Update prompt**
Add explicit guidance:
- “Return a single root component (container) with nested children.”
- “Prefer layout primitives: container/row/column/grid.”
- “Use tokenized styles; use className sparingly.”

**Step 4: Run tests to verify pass**
Run: `pnpm test -- src/lib/ai/prompts.test.ts`
Expected: PASS.

**Step 5: Commit**
```bash
git add src/lib/ai/prompts.ts src/lib/ai/prompts.test.ts
git commit -m "docs(ai): guide tool to output component trees"
```

---

### Task 4: Integration validation of complex structures

**Files:**
- Modify: `src/components/layout/DetectiveWorkspace.test.tsx`

**Step 1: Write failing integration test**
Add a tool output that returns a nested tree and assert that renderer outputs a heading + input.

**Step 2: Run tests to verify failure**
Run: `pnpm test -- src/components/layout/DetectiveWorkspace.test.tsx`
Expected: FAIL.

**Step 3: Minimal fixes**
Adjust any mapping or renderer behavior needed to satisfy integration expectations.

**Step 4: Run tests to verify pass**
Run: `pnpm test -- src/components/layout/DetectiveWorkspace.test.tsx`
Expected: PASS.

**Step 5: Commit**
```bash
git add src/components/layout/DetectiveWorkspace.test.tsx
git commit -m "test: cover nested A2UI tool output"
```

---

### Task 5 (Optional): Eject-mode exporter stub

**Files:**
- Create: `src/lib/eject/exportA2UI.ts`
- Create: `src/lib/eject/exportA2UI.test.ts`

**Step 1: Write failing test**
Add a test that renders a simple tree to a React/Tailwind string.

**Step 2: Run test to verify failure**
Run: `pnpm test -- src/lib/eject/exportA2UI.test.ts`
Expected: FAIL.

**Step 3: Implement minimal exporter**
Return a string for a limited subset (`container`, `heading`, `input`, `button`).

**Step 4: Run test to verify pass**
Run: `pnpm test -- src/lib/eject/exportA2UI.test.ts`
Expected: PASS.

**Step 5: Commit**
```bash
git add src/lib/eject/exportA2UI.ts src/lib/eject/exportA2UI.test.ts
git commit -m "feat(eject): add minimal A2UI exporter"
```

---

### Task 6: Final verification

**Step 1: Run full checks**
Run: `pnpm check`
Expected: PASS.

**Step 2: Optional e2e**
Run: `pnpm e2e`
Expected: PASS.
