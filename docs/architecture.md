# Architecture

> Technical blueprint for synthNoirUI's AI-driven UI generation system.
> There is exactly ONE live rendering path — the A2UI v0.9 SSE pipeline.

## System Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                          Client (Next.js)                        │
├─────────────┬──────────────────┬─────────────┬───────────────────┤
│ JSON Editor │ Evidence Board   │ Eject Panel │ Chat Sidebar      │
│             │ (SurfaceRenderer)│ (Sandpack)  │ (useA2UIStream)   │
└──────┬──────┴────────┬─────────┴──────┬──────┴─────────┬─────────┘
       │               │                │                │
       │      ┌────────▼─────────┐      │                │
       │      │ useSurfaceStore  │◄─────┴────────────────┤
       │      │ (flat components,│                       │
       │      │  data model)     │                       │
       │      └────────▲─────────┘                       │
       │               │ parsed SSE messages             │
       │     ┌─────────┴──────────┐            ┌─────────▼──────────┐
       └────►│  stream-parser     │◄───────────│ POST /api/a2ui/    │
             │  (JSONL → typed    │    SSE     │ stream             │
             │   ServerMessages)  │            │ (streamText +      │
             └────────────────────┘            │  generate_ui tool) │
                                               └─────────┬──────────┘
                                         ┌───────────────┼───────────────┐
                                         ▼               ▼               ▼
                                    ┌────────┐     ┌─────────┐     ┌────────┐
                                    │ OpenAI │     │Anthropic│     │ Google │
                                    └────────┘     └─────────┘     └────────┘
```

## Tech Stack

| Category  | Technology           | Version | Purpose             |
| --------- | -------------------- | ------- | ------------------- |
| Framework | Next.js (App Router) | 16.x    | Application core    |
| AI SDK    | Vercel AI SDK        | 6.x     | Streaming & tools   |
| State     | Zustand              | 5.x     | Surface state       |
| Schema    | Zod                  | 4.x     | Protocol validation |
| Styling   | Tailwind CSS         | 4.x     | UI styling          |
| Testing   | Vitest + Playwright  | -       | Unit + E2E tests    |
| Animation | Framer Motion        | -       | Entrance motion     |

---

## The Generation Pipeline

One request flows through these stages (server first, then client):

```
prompt
  → POST /api/a2ui/stream                 src/app/api/a2ui/stream/route.ts
      → buildSystemPrompt()               src/lib/ai/prompts.ts
          persona voice                   src/lib/aesthetic/personas.ts
          + per-world LAYOUT DOCTRINE     src/lib/aesthetic/definitions.ts
          + shared COMPONENT PLAYBOOK     src/lib/ai/composition.ts
          + optional variant seed / baseline ("Current Evidence" update rules)
      → streamText() forcing the generate_ui tool (component tree as a JSON STRING)
      → per tool call:
          coerceComponentInput()          src/lib/ai/tools.ts   (string → object)
          normalizeA2UI() + a2uiInputSchema   src/lib/protocol/schema.ts
          enrichA2UI()                    src/lib/a2ui/enrich.ts (auto-grid, heading promotion)
          resolveA2UIImagePrompts()       src/lib/ai/images.ts  (prompt → /api/images/<id> deferred url)
          flattenLegacyToCatalog()        src/lib/a2ui/adapter/legacyToCatalog.ts
      → SSE: createSurface, updateComponents, source (pre-flatten tree for eject),
             narration, [DONE]
client
  → useA2UIStream                         src/lib/a2ui/hooks/useA2UIStream.ts
  → parseA2UIStream                       src/lib/a2ui/transport/stream-parser.ts
  → useSurfaceStore                       src/lib/a2ui/store/useSurfaceStore.ts
  → <SurfaceRenderer/>                    src/components/a2ui/SurfaceRenderer.tsx
```

### The model-emission contract (live, not legacy cruft)

The model still emits "legacy-shaped" nested trees (`{ type: "card", … }`).
That contract is fully alive: `normalizeA2UI` repairs common LLM variations
(synonym keys, stray casing, object table rows, kanban/dashboard aliases),
`a2uiInputSchema` validates, and the adapter flattens to the v0.9 catalog's
flat adjacency list (`{ id, component: "Card", child: … }`).

The supported `type` list lives in ONE place — `SUPPORTED_LEGACY_TYPES` in
`src/lib/protocol/schema.ts` — and is interpolated into the tool description,
every persona's Core Directives, and (manually mirrored) the playbook. Never
hand-write a type list anywhere else.

### Deferred images

Image prompts become `/api/images/<uuid>.jpg` urls backed by a persisted
"recipe" (prompt + aesthetic + sessionSeed + imageIndex). The GET route
generates lazily on first request; `POST /api/images/<id>/redevelop` re-rolls
one image from its recipe with the motif index advanced (the PhotoDeveloper's
hover "Re-develop" button).

---

## The Aesthetic System

`src/lib/aesthetic/definitions.ts` is the client-safe single source of truth
for every built-in world: colors, fonts, audio pack, voice, copy, sample
prompts, layout doctrine (+ JSON exemplar), style tokens, effects profile,
atmosphere, motion personality, and image spec. `registry.ts` (server-only)
attaches the persona prompt body; `audio-packs.ts`, `voice-defaults.ts`, and
the settings panels all derive from the definitions.

Theming reaches the DOM three ways:

1. **CSS variables** — `[data-aesthetic="<id>"]` blocks in `globals.css`
   mirror the definitions (colors, fonts, atmosphere colors, max-width).
2. **Effect attributes** — DeskLayout emits `data-effect-card/stamp/screen`
   from the effects profile; materials (paper/parchment/hologram/wireframe/
   flat/gilded) are styled per attribute, never per preset id, so custom
   profiles inherit them.
3. **Motion personality** — `getMotionPersonality()` drives the per-child
   entrance stagger in SurfaceRenderer, the PhotoDeveloper reveal, the
   loading skeleton variant, and the world-switch cinematic
   (`WorldTransition.tsx`).

Custom profiles overlay the base preset via injected CSS
(`src/lib/customization/css-injection.ts`) scoped to
`[data-custom-profile="<id>"]`, including optional atmosphere overrides
(particle type + colors). AI-generated worlds (`src/lib/ai/theme-generator.ts`)
emit the same shape, with a programmatic WCAG-AA nudge on the palette.

### Reactive desk

`src/lib/audio/audioEvents.ts` hosts two module-level channels: music ducking
(TTS ↔ music bed) and semantic events. Rendered content can emit events —
e.g. a `danger` Badge fires `dramatic.beat` (throttled) — which ChatSidebar
resolves through the active world's `AudioEventMap` and pairs with the
lightning overlay.

---

## Checklists

### Add a new component

1. Legacy schema arm + (if needed) `normalizeA2UI` coercions —
   `src/lib/protocol/schema.ts`; add the type to `SUPPORTED_LEGACY_TYPES`.
2. Adapter case emitting catalog component(s) —
   `src/lib/a2ui/adapter/legacyToCatalog.ts`.
3. Renderer + `COMPONENT_MAP` entry —
   `src/components/a2ui/SurfaceRenderer.tsx`.
4. (Optional) catalog schema for direct v0.9 emission —
   `src/lib/a2ui/catalog/components.ts`.
5. Playbook guidance — `src/lib/ai/composition.ts`.

### Add a new world

1. Add the id to `BUILT_IN_AESTHETIC_IDS` — `src/lib/aesthetic/types.ts`
   (the zod enums and Record maps derive from it; the compiler walks you to
   the rest).
2. Full definition — `src/lib/aesthetic/definitions.ts`.
3. `[data-aesthetic]` block (+ heading treatment, form controls, board
   background) — `src/app/globals.css`.
4. Persona — `src/lib/aesthetic/personas.ts`; narration voice —
   `src/lib/ai/narration.ts`.
5. If the world needs a new card material / entrance / image reveal, extend
   the unions in `types.ts` and add the matching CSS + arms
   (`entranceHiddenVariant`, `REVEAL_CONFIG`, `WorldTransition`,
   `EvidenceSkeleton`).

---

## Surface state

`useSurfaceStore` holds surfaces as `Map<id, SurfaceComponent>` plus a JSON
data model per surface. Two-way bindings are explicit `{ path: "/ptr" }`
objects resolved against the data model (scope-aware for template-expanded
children); `SurfaceRenderer` keeps a local working copy and writes through to
the store. Server-event actions round-trip via `POST /api/a2ui/action`.

## Eject / export

The stream's `source` message carries the resolved pre-flatten legacy tree
(image prompts already swapped for real urls) — the high-fidelity shape
`src/lib/eject/exportA2UI.ts` converts to standalone React + Tailwind,
previewed in Sandpack (`src/components/eject/`).
