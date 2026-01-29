# Project Tracks

Development tracks for bmad. All Epic 1 & 2 work is **COMPLETE**.

---

## Completed Tracks

### tool-driven-generation (Epic 2)

**Status:** COMPLETE

Implemented tool-driven UI generation via `generate_ui` tool with Zod validation, streaming state sync, and noir error handling.

**Evidence:**

- `src/lib/ai/tools.ts` - Tool definition
- `src/components/layout/DetectiveWorkspace.tsx` - State sync
- `src/lib/ai/prompts.ts` - Contextual updates
- Tests: 100+ passing

### eject-mode

**Status:** COMPLETE

Export A2UI evidence to editable React + Tailwind code.

**Evidence:**

- `src/lib/eject/exportA2UI.ts` - Generator (20+ components)
- `src/components/eject/EjectPanel.tsx` - UI entry point
- React + JSON tabs with copy-to-clipboard

### stability-polish

**Status:** COMPLETE

Hardened message parsing, sanity checks, and CI verification.

**Evidence:**

- Supports AI SDK v6 `parts` + legacy `toolInvocations` fallback
- `pnpm sanity:chat` for live API validation
- All tests passing

---

## Archive

Completed tracks are archived in `conductor/archive/`.

---

_For current project status, see [docs/PRODUCT.md](../docs/PRODUCT.md)_
