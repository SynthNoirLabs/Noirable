# Noirable — Repo & Code-Review Audit (2026-06-10)

> A broad, **verified** code-review sweep across CSS/styling, architecture, dead code,
> linting/TS config, documentation, dependencies/stack, tooling/CI/husky/pnpm, and testing.
> Run as a 8-dimension parallel audit where **every finding was adversarially re-checked
> against the live code** before it counted — 65 raw findings, **7 refuted**, **58 confirmed**.
>
> Calibrated for this repo's reality: a **playground / POC / local-fun** project, not a
> production service. Security/scaling/observability findings were deliberately suppressed;
> maintainability, correctness, dead code, drift, and docs were the focus.
>
> **Status legend:** 🔴 High · 🟠 Medium · 🟡 Low · ⚪ Nit. Effort: S/M/L.

---

## On the roadmap question first

Per the original ask — "see what could be the next steps; if we don't have much, do a code review."
**There isn't much *foundational* roadmap left.** The polish batch (PR #121) just closed 3 of the
6 Tier-1 items from [`aesthetic-identity-status.md`](./aesthetic-identity-status.md) (themed
skeleton, TTS-timed SFX, per-preset image model) plus the enrich pass (#26). What remains is:

- **#1 Wire `atmosphere` into `NoirEffects`** — still the single highest-leverage item left; the
  data + CSS vars exist, the overlays just don't read them yet (every world still rains noir-blue).
- The **audio-DSP epic** (Web Audio mixer → procedural beds → spatialization → crossfades) — large, gated on the mixer.
- Assorted **polish/UX** (few-shot examples, variants gallery, onboarding wizard, parallax).

None of it is structural. So this audit is the substantive "next step."

---

## TL;DR — what to actually do

The codebase is in good shape. One real correctness bug, a handful of worthwhile cleanups, and a
long tail of nits. Recommended order:

1. 🔴 **Fix the legacy renderer dropping `video`/`slider`/`modal`** — the *default* render path
   silently renders nothing for node types the model is now told to emit. This is the only High.
2. 🟠 **Quick-win cleanups** (all S, ~30 min total): delete the stale committed `package-lock.json`,
   drop 2 unused deps, lighten the pre-commit hook, fix `test`→`vitest run`, add `.nvmrc`/bump `@types/node`.
3. 🟠 **Close the two CSS drift traps**: the blanket `stylelint-disable` and the untested palette mirror.
4. 🟠 **Add tests for the new video hook** (the most logic-dense unverified code on the branch).
5. 🟡 The rest is opportunistic — fix when next touching the area.

| Dimension | 🔴 | 🟠 | 🟡 | ⚪ | Verdict |
|---|---|---|---|---|---|
| CSS / styling | 0 | 2 | 3 | 3 | Crafted but triple-sourced; lint is half-off |
| Architecture | 1 | 2 | 2 | 2 | One real bug; two god-files are deferred-OK |
| Dead code | 0 | 1 | 4 | 1 | Stale npm lockfile + 2 unused deps + orphan scripts |
| Lint / TS config | 0 | 0 | 3 | 3 | Sound; minor gaps (scripts untyped, no type-aware lint) |
| Docs | 0 | 0 | 7 | 1 | Many small staleness drifts; nothing broken |
| Deps / stack | 0 | 0 | 2 | 6 | Coherent; AI-SDK far behind but stable |
| Tooling / CI | 0 | 1 | 5 | 2 | Pre-commit too heavy; dead Buildkite; small CI gaps |
| Testing | 0 | 1 | 5 | 2 | Strong coverage; new video code is the gap |
| **Total** | **1** | **7** | **31** | **20** | |

---

## 🔴 HIGH (1)

### H1 · Legacy renderer silently drops `video` / `slider` / `modal` — drifted behind the schema
**`src/components/renderer/A2UIRenderer.tsx:104-487`** (switch) vs **`src/lib/protocol/schema.ts:719-746`** (union) · Effort: **M**

The `a2uiInputSchema` discriminated union has 24 types including `video`, `slider`, and `modal`,
and the legacy `generate_ui` tool description (`src/lib/ai/tools.ts:76`) now **explicitly instructs
the model to emit `video` nodes** ("video renders as an on-demand 'Generate footage' placeholder").
But `A2UIRenderer`'s switch has cases for `image` etc. and **no case for `video`/`slider`/`modal`** —
they fall through to `default: return null` (line 486). Because `useV09 = settings.useA2UIv09 ?? false`
(`DetectiveWorkspace.tsx:190`), **this legacy renderer is the DEFAULT path**. So a model-emitted video
node renders as *blank nothing* with no error or placeholder — on the default surface. (The feature was
validated on the v0.9 `SurfaceRenderer`, which does handle it — that's why it looked fine.)

This is the exact silent-drift failure mode that maintaining two renderers for one schema invites, and
it has already materialized for the very feature (`video`) that just shipped.

**Fix (minimal):** add `video`/`slider`/`modal` cases to the switch — at minimum give `video` a visible
placeholder mirroring the existing `image` branch (`A2UIRenderer.tsx:336-348`), e.g. a "FOOTAGE PENDING —
Generate footage" stub; render `slider` as a range input and `modal` as trigger+content. Then add a
**drift-guard test** that iterates the `a2uiInputSchema` discriminants and asserts each renders to
something non-null (catches the next silently-added type). Longer term: retire one of the two renderers.

---

## 🟠 MEDIUM (7)

### M1 · Blanket `stylelint-disable` silently turns off linting for 59% of globals.css
**`src/app/globals.css:629`** (no matching `stylelint-enable` through EOF at 1537) · Effort: **M**

A lone `/* stylelint-disable */` at line 629 is the only stylelint directive in the file — everything
after it (all the card materials, form overrides, reduced-motion reset) is **unlinted**. Empirically
verified: removing it surfaces **11 real violations**, including 3 duplicate `[data-aesthetic=...]`
selectors (cyber/nostromo/gothic re-opened at 634/640/646 after first defined at 118/143/168) — and the
cyber-fixer one **silently overrides the body font** (`var(--font-typewriter)` → mono stack), a real
cascade-order trap relevant to the [aesthetic-font](../../) memory. `lint:css` / `check` pass today
partly *because* of this suppression — false confidence.

**Fix:** delete line 629, run `stylelint --fix` (4 auto-fix), merge the 3 duplicate blocks into their
originals, and scope any genuinely-needed disable to a specific rule + matching `enable`.

### M2 · Per-aesthetic palette is triple-sourced but only `accent` is parity-tested
**`globals.css:34-191`** vs **`definitions.ts` theme.colors**; test at **`definitions.test.ts:155-169`** · Effort: **M**

Each `[data-aesthetic]` block hardcodes ~18 vars that mirror `definitions.ts` (the documented "single
source of truth"), but the parity test asserts **only `--aesthetic-accent`**. Change a `surface` color in
the def and the CSS keeps the old value with zero test failure — exactly the drift the test was meant to
prevent. No live bug today (they currently match); the risk is future silent drift.

**Fix (interim, ~15 lines):** extend `definitions.test.ts` to loop over all 9 `theme.colors` keys + the
mirrored scalars (glowStrength, particle/lightning/vignette colors, vignetteIntensity, lightningFrequency)
and assert each `--aesthetic-*` var matches. Defer full build-time codegen (roadmap line 1296) until the preset count grows.

### M3 · `SurfaceManager` class is dead code; `useSurfaceStore` falsely claims to "wrap" it
**`src/lib/a2ui/surfaces/manager.ts:88-235`** + **`useSurfaceStore.ts:10-11`** + `manager.test.ts` (360 lines) · Effort: **S-M**

`new SurfaceManager()` appears **zero times** in production — all callers import only its *types*. Yet
`useSurfaceStore`'s header says "This store wraps the SurfaceManager class" while reimplementing the logic
inline with **divergent semantics** (class *throws* at the surface ceiling; store *evicts* oldest). ~595
lines of class + test exercise behavior nothing ships, and the comment points readers at the wrong source of truth.

**Fix:** delete the dead class (keep only the `SurfaceConfig`/`SurfaceComponent`/`SurfaceState` types it
exports) + `manager.test.ts`, and fix the `useSurfaceStore` comment to describe it as the standalone source of truth.

### M4 · `DetectiveWorkspace` is a 900-line dual-architecture bridge
**`src/components/layout/DetectiveWorkspace.tsx:190,261,584-730,820-873`** · Effort: **L**

Instantiates **both** generation stacks (legacy `useChat` + v0.9 `useA2UIStream`) and selects per-call via
`useV09 ? … : …` branches at 4 points + picks the renderer at 846. This scattered seam is *where the two
architectures drift independently* (see H1). Real but low-urgency for a POC — the duality is explicit and working.

**Fix (deferred):** extract `useLegacyGeneration` + `useV09Generation` hooks so the workspace reads `useV09`
once and swaps a clean `{isLoading, send, error}` interface. Do this when one path is slated for removal.

### M5 · Stale npm `package-lock.json` committed in a pnpm project
**`package-lock.json`** (12,226 lines, tracked alongside `pnpm-lock.yaml`) · Effort: **S**

An accidental WIP artifact from commit `0726ca5` (2026-03-02, "Changes before error encountered"). It
disagrees with reality (pins `ai@6.0.105` in a sub-tree vs the real `6.0.41`) and **nothing consumes it** —
zero `npm install/ci` invocations anywhere. Pure misleading dead metadata; Corepack would block `npm install` anyway.

**Fix:** `git rm package-lock.json` and add it to `.gitignore`. One-line cleanup, no workflow impact.

### M6 · Pre-commit runs a full `next build` on every commit
**`.husky/pre-commit`** → `pnpm check` (= prettier + eslint + stylelint + **vitest (108 files)** + **`next build`**) · Effort: **M**

A commit takes minutes because the hook runs the entire CI gate, including a production build of a ~48k-LOC
app. The #1 cause of devs reaching for `git commit --no-verify` — which then bypasses the *cheap*
format/lint guards too. CI already runs `pnpm check`, so the heavy steps are redundant in the commit loop.

**Fix:** add `lint-staged`, set pre-commit to `pnpm exec lint-staged` (eslint --fix + prettier --write on
staged files, stylelint --fix on CSS). Leave full `vitest` + `next build` to CI (or a `pre-push` hook).

### M7 · New video hook `useVideoGeneration.ts` has zero tests (33.67% cov)
**`src/lib/hooks/useVideoGeneration.ts`** (whole file) · Effort: **M**

The most logic-dense new code on the branch — race-supersede via `runId` identity, `setTimeout` polling
(`POLL_INTERVAL_MS=6000`, `MAX_POLLS=60`), unmount cleanup, start-failure — is completely unverified. These
are exactly the timer-race bugs unit tests catch and humans miss; a regression silently breaks every
"Generate footage" button.

**Fix:** add `useVideoGeneration.test.ts` with `renderHook` + `vi.useFakeTimers` + mocked `fetch`. Cover 3
paths: (1) generate → starting → pending → ready; (2) second `generate()` supersedes the first (old poll
timer stops firing); (3) advancing past `MAX_POLLS` yields `failed` / "timed out". Not a release gate — worthwhile cleanup.

---

## 🟡 LOW (31) — fix opportunistically

**Dead code / deps (5)**
- **L-dc1** `@ai-sdk/openai-compatible` (package.json) is **never imported** — the provider works via `createOpenAI`+`baseURL` in `factory.ts:100`. Remove the dep. *(S)*
- **L-dc2** `zod-to-json-schema` devDep is **never referenced**. Remove it. *(S)*
- **L-dc3** 3 orphaned Playwright capture scripts (`scripts/capture-*.ts`, `take-screenshots.ts`) import the bare `playwright` (undeclared; only transitively present). Either repoint to `@playwright/test` or delete. *(M)*

**Architecture (2)**
- **L-arch1** JSON-Pointer set-at-path logic is **duplicated** (mutating in `useSurfaceStore.ts:129-180`; immutable in `SurfaceRenderer.tsx:210-259`). Consolidate into the existing `binding/pointer.ts`. *(M)*
- **L-arch2** `SurfaceRenderer.tsx` is a **2428-line god file**. Low-risk to split (COMPONENT_MAP already decouples renderers): lift the 3 buried mini-apps (VideoGenerator, KanbanBoard, DataDashboard) to their own files; finish the half-done `binding/` extraction. Opportunistic. *(L)*

**CSS (3)**
- **L-css1** 10 of 12 `@theme` noir color tokens (`globals.css:12-25`) are never used as utilities — only `--color-noir-paper`/`-ink` are live. Delete the dead 10. *(S)*
- **L-css2** `--aesthetic-font-body/heading` set **twice** for cyber/nostromo/gothic; the colors-block copy (128/153/178) is dead (and misleadingly claims `var(--font-typewriter)`). Keep the typography-block copy. *(S)*
- **L-css3** Theme-agnostic primary button hardcodes noir-amber glow `rgba(255,191,0,…)` at 4 sites (`SurfaceRenderer.tsx:1441`, `ChatSidebar.tsx:528`, `EvidenceBoard.tsx:181,228`) instead of `color-mix(... var(--aesthetic-accent) ...)`. *(S)*

**Lint / TS (3)**
- **L-ts1** `scripts/` is excluded from tsconfig and never type-checked (also: undeclared `playwright` import). Add a `typecheck` script + include scripts, or accept as throwaway. *(S)*
- **L-ts2** No type-aware ESLint, so `no-floating-promises`/`no-misused-promises` can never fire in an async-heavy app. Optional `'warn'`-level typed block. *(M)*
- **L-ts3** `@types/node` pinned `^20` while runtime + CI are Node 24. Bump to `^24`. *(S)*

**Docs (7)** — all S, all pure-text drift
- **L-doc1** "23 component types" is now 24 (`video` added) — README:23, AGENTS.md:254, a2ui-protocol.md:9.
- **L-doc2** `video` component type is undocumented in `docs/reference/a2ui-protocol.md`.
- **L-doc3** `src/lib/ai/AGENTS.md:35-38` `set_aesthetic` says only `noir|minimal`; code accepts all 5.
- **L-doc4** `.env.example` omits `A2UI_MUSIC_DIR` / `A2UI_RECORDING_DIR` (read in code).
- **L-doc5** README test badge (1193) + DEVELOPMENT.md (875/91) are stale; actual ~1261/108. De-precise or drop.
- **L-doc6** `ci.yml:45-47` comment claims e2e "serves a production build" — it runs `pnpm dev`. Reword.
- **L-doc7** `src/lib/ai/AGENTS.md:9-17` Files table omits video/music/voice/theme modules.

**Deps (2)**
- **L-dep1** AI-SDK cluster is ~150 patches behind (`ai` 6.0.41→6.0.199) but internally coherent + API-stable. Do one deliberate `pnpm up ai '@ai-sdk/*'` family bump when convenient, then `pnpm check` + `pnpm sanity:chat`. *(M)*
- **L-dep2** Node version told 3 ways (engines `>=20`, CI-only-24, no `.nvmrc`). Add `.nvmrc` (`24`) + bump `@types/node`. *(S)*

**Tooling / CI (5)**
- **L-ci1** `.buildkite/pipeline.yml` is a dead, git-tracked near-duplicate of GH Actions (its E2E *does* run the macOS visual-snapshot the GH Linux job skips). Delete it (+ the docs bullet) **or** add a header comment explaining it's the mac-baseline runner. *(S)*
- **L-ci2** CI runs bare `pnpm install` (no `--frozen-lockfile`) in both jobs — lockfile can silently drift. Add the flag. *(S)*
- **L-ci3** No standalone `typecheck` script; `check`/CI rely on `next build` to catch type errors. Add `"typecheck": "tsc --noEmit"`. *(M)*
- **L-ci4** `test` and `test:watch` are **identical** (both bare `vitest`). Set `test` → `vitest run`. *(S)*
- **L-ci5** `ci.yml:45` e2e prod-build comment mismatch (dup of L-doc6, from the tooling lens). *(S)*

**Testing (5)**
- **L-test1** 7 API routes untested; only `video/status/[jobId]` is worth covering (unknown-id 404, cached-status short-circuit). *(M)*
- **L-test2** 14 `act()` warnings in `ChatSidebar`/`VideoLab` tests from an unawaited `/api/elevenlabs/status` fetch. Stub `fetch` in `beforeEach` to silence ~12 at once. *(M)*
- **L-test3** Only the visual-snapshot test is excluded in CI, so the committed darwin+linux PNG baselines never run. Delete the orphan linux baseline (or the whole snapshot test). *(S)*
- **L-test4** 11 fixed `waitForTimeout` sleeps in e2e (flaky-prone, masked by retries). Replace only the ~4 with deterministic post-conditions (`document.fonts.ready`, `expect.poll` on boundingBox). *(M)*
- **L-test5** `video.ts` `downloadVideo` non-ok-response path untested. Add one mocked-403 test. *(S)*

---

## ⚪ NIT (20) — note, don't prioritize

Cosmetic or defensible-as-is. Highlights: `:root` palette fully duplicates the `[data-aesthetic="noir"]`
block (`globals.css`); inconsistent `import "server-only"` across API routes; 2 unguarded `console.log` in
source (no `no-console` rule); `eslint-config-next` (16.1.3) trails `next` (16.1.6); no CI `concurrency`
group (superseded runs not auto-cancelled); no `lint:fix` script. **Confirmed-clean areas:** reduced-motion
guards, aesthetic module layering, prettier/stylelint configs, all `eslint-disable`/`@ts-expect-error`/
`as any` (legitimate), vitest↔coverage-v8 version lock-step, tailwind in-range minors, exact pins on next/react/ai.

---

## Refuted by adversarial verification (7) — checked and dismissed

Honesty about what *didn't* hold up:
- **Mock/id-gen "duplication" across routes** — not duplicated; `generateSurfaceId`/`generateComponentId` live only in `stream/route.ts`.
- **`useA2UIStream` handles "unsent" messages** — `updateDataModel`/`deleteSurface` are part of the protocol union by design, not dead branches.
- **`.Jules/palette.md` is orphan scratch** — it's a tracked design-reference doc, not unconsumed scratch.
- **`target: ES2017` forces downleveling** — `noEmit: true`; tsc only type-checks, SWC handles transpile. Inert.
- **Missing strict flags (`noUncheckedIndexedAccess` etc.)** — `strict: true` already covers the real risks here; the cited case was a non-issue.
- **No `.npmrc` is a problem** — pnpm defaults + `packageManager` pin + Corepack already handle it.
- **Branch-coverage threshold is a "razor-thin tripwire"** — thresholds are *never enforced* (`check` runs bare `vitest`, not `vitest run --coverage`), so it's inert, not fragile.

---

_Generated by an 8-dimension parallel audit (73 agents, ~2.4M tokens) with per-finding adversarial
verification against the live code. Every confirmed finding cites a file:line you can open._
