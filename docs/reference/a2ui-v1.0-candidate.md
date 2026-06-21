# A2UI v1.0 (Release Candidate) — Assessment & Migration Notes

> Source specs (fetched 2026-06-19):
>
> - https://a2ui.org/specification/v1.0-a2ui/
> - https://a2ui.org/specification/v1.0-a2ui-extension-specification/
> - https://a2ui.org/specification/v1.0-evolution-guide/
> - https://a2ui.org/specification/v1.0-basic-catalog-implementation-guide/
>
> **Status:** v1.0 is a **release candidate** (previously drafted as "v0.10").
> Upstream still recommends **v0.9.1 for production**. This document is a
> forward-looking assessment, not a commitment to migrate.

## TL;DR

Unlike v0.9.1 (a two-line refinement — see
[`a2ui-v091-migration.md`](./a2ui-v091-migration.md)), **v1.0 is a major release
with genuine breaking changes**: bidirectional RPC, single-message UI
instantiation, a `theme` → `surfaceProperties` rename, `functions` array → map,
`null`-based data deletion, and UAX #31 identifier enforcement.

**Impact on this repo is still mostly low** — for the same reason v0.9.1 was: we
run a local, single-app SSE/JSONL pipeline with a flattened `type`-discriminated
envelope, no on-wire `version`, no A2A binding, and a model that emits
legacy-shaped trees the adapter flattens. Most v1.0 changes target the A2A
transport, the catalog wire schema, and bidirectional RPC — none of which we
expose. The handful that _could_ touch us are opt-in conveniences, not
requirements.

**Recommendation:** do **not** migrate yet. Track it; revisit when v1.0 leaves RC.
If/when we adopt, the work is contained and listed at the bottom.

## Full change inventory (v0.9.1 → v1.0)

### Version strings & MIME

| Change                | v0.9.1                  | v1.0                      |
| --------------------- | ----------------------- | ------------------------- |
| Envelope `version`    | `"v0.9.1"` / `"v0.9"`   | `"v1.0"`                  |
| Payload MIME type     | `application/a2ui+json` | `application/a2ui+json` (unchanged) |
| Extension URI         | `…/a2ui/v0.9.1`         | `…/a2ui/v1.0`             |
| Capabilities namespace| `v0.9.1`                | `v1.0`                    |

### Renamed fields (breaking)

- `theme` → `surfaceProperties` (in `createSurface`, catalog `$defs`,
  `client_capabilities.json`).
- `$defs/theme` → `$defs/surfaceProperties`.
- Icon `svgPath` → `path`.

### Removed fields (breaking)

- `primaryColor` removed entirely — "separate layout from branding." Branding now
  lives in extensible `surfaceProperties` (`iconUrl`, `agentDisplayName`), not
  hardcoded theme colors.
- `callableFrom` / `returnType` removed from **wire** payloads (`callFunction`,
  `FunctionCall`, dynamic value schemas). They become **static catalog metadata**
  instead; boundary/return checking is deferred to runtime.

### New messages & fields (the headline feature: bidirectional RPC)

**Server → client:**

- `actionResponse` — replies to a client action that set `wantResponse: true`,
  keyed by `actionId`, carrying `value` _or_ `error {code,message}`.
- `callFunction` — server-initiated function execution: `{ functionCallId,
  wantResponse?, callFunction: { call, args? } }`. Rejected with
  `code: "INVALID_FUNCTION_CALL"` if the function is `clientOnly` or unregistered.
- `createSurface` may now inline `components` (array) and `dataModel` (object) —
  **a full UI in one message**, instead of `createSurface` + a follow-up
  `updateComponents`.

**Client → server:**

- `action` gains `wantResponse` (bool) and `actionId` (required when
  `wantResponse` is true).
- `functionResponse` — `{ functionCallId, call, value }`, the result of a
  server-initiated `callFunction`.
- `error` gains `functionCallId` (mutually exclusive with `surfaceId`).

### Catalog / capabilities schema changes (breaking)

- `functions` changes from a **list/array** to a **map keyed by function name**
  (O(1) lookup).
- `FunctionDefinition` gains a `callableFrom` enum: `clientOnly` | `remoteOnly` |
  `clientOrRemote` (default `clientOnly`), plus static `returnType`.
- Optional `instructions` (Markdown) added to `Catalog`, replacing an external
  `rules.txt`.
- Standard JSON-Schema metadata allowed at catalog root: `$schema`, `$id`,
  `title`, `description`. Only nine root keys permitted total.

### Component additions (non-breaking)

- `Video`: `posterUrl` (preview frame before play).
- `TextField`: `placeholder`.
- `Slider`: `steps` (snap to discrete intervals).
- _No components removed._

### Behavioral changes (breaking)

- **`@index` system function** — 0-based loop index inside list templates
  (optional `offset`). The `@` prefix is reserved for system functions; custom
  catalogs may not use it. Using `@index` outside a Collection Scope is an error.
- **`null`-based deletion** — in `updateDataModel`, setting a path to `null`
  deletes the key. (Previously, key omission signaled deletion.)
- **Surface uniqueness re-tightened** — `surfaceId` "must be globally unique per
  client session." (Note: this partly walks back the v0.9.1 relaxation;
  re-creating an id without deleting it first is an error.)
- **Runtime function-boundary enforcement** — remote calls to `clientOnly` or
  unregistered functions rejected with `INVALID_FUNCTION_CALL`.
- **UAX #31 naming** — component/function/arg names must match
  `^[\p{XID_Start}_][\p{XID_Continue}]*$` (no leading digit, no whitespace/symbols
  except `_`).

## Impact on THIS repo, change by change

Live path: `src/app/api/a2ui/stream/route.ts` (SSE) →
`src/lib/a2ui/transport/stream-parser.ts` → `src/lib/a2ui/store/useSurfaceStore.ts`
→ `src/components/a2ui/SurfaceRenderer.tsx`. Wire envelope:
`src/lib/a2ui/schema/messages.ts` (flattened `type` discriminator, `catalogId:
"standard"`, no `version`).

| v1.0 change                          | Impact | Notes                                                                                                   |
| ------------------------------------ | :----: | ------------------------------------------------------------------------------------------------------- |
| MIME type                            |  None  | We don't use A2A; SSE is `text/event-stream`.                                                            |
| Envelope `version: "v1.0"`           |  None  | We emit no `version` field (single-app pipeline, no interop).                                           |
| Extension URI / capabilities ns      |  None  | No AgentCard / A2A capability declaration here.                                                          |
| `theme` → `surfaceProperties`        |  **Low** | `createSurfaceMessageSchema` accepts `theme` (string\|object); `SurfaceRenderer` maps it to CSS vars. A rename would touch `messages.ts` + the renderer's theme mapping (~1 spot). Our theming is mostly CSS-var/`data-aesthetic` driven, so this is cosmetic. |
| `primaryColor` removal               |  None  | We don't read `theme.primaryColor`; palette comes from the aesthetic definitions + CSS vars.            |
| Icon `svgPath` → `path`              |  None  | No custom-SVG-icon wire field in use.                                                                    |
| `actionResponse` / `wantResponse`    |  None* | Actions round-trip via `POST /api/a2ui/action` (request/response already), not the streamed RPC. Adopting the v1.0 streamed form would be **new feature work**, not a migration fix. |
| `callFunction` / `functionResponse`  |  None* | No server-initiated client RPC today. Opt-in feature, not required.                                     |
| Inline `components`/`dataModel` in `createSurface` | None | Convenience. Our adapter already emits `createSurface` then `updateComponents`; nothing forces inlining. |
| `functions` array → map              |  None  | Our catalog functions aren't emitted on the wire; the model emits legacy trees flattened by the adapter. |
| `callableFrom` / `returnType`        |  None  | Not modeled on our wire.                                                                                 |
| `instructions` on Catalog            |  None  | We carry guidance in the system prompt (`src/lib/ai/composition.ts`), not a catalog field.              |
| Component props (`posterUrl`, `placeholder`, `steps`) | **Low / opportunistic** | Pure additions. `placeholder` and Slider `steps` are easy wins our legacy schema could expose; `Video posterUrl` maps to our deferred-video placeholder. Not required. |
| `@index` template function           |  None  | We don't expose list-template loops on the wire (legacy trees are pre-expanded).                         |
| `null`-based deletion                |  **Low** | Our pointer upsert (`src/lib/a2ui/binding/pointer.ts`) implements v0.9 "omit = delete." If we ever speak v1.0 on the wire, switch to "`null` = delete." No effect until then. |
| Surface uniqueness re-tightened      |  None  | `useSurfaceStore` keys by id and recreates per stream; stable ids (`harness`/`gallery`/`print`) are fine within a session.                                            |
| UAX #31 naming                       |  None  | Our component/function names are already plain ASCII identifiers.                                        |

\* "None" = no _migration_ obligation. These are net-new capabilities we could
choose to build on, not breakages to fix.

## Should we migrate?

**No — not yet.** Rationale:

1. **It's a release candidate.** Upstream explicitly recommends v0.9.1 for
   production. Adopting an RC for a local hobby app buys risk, not value.
2. **We're already "compatible" in the only sense that matters here.** We don't
   interoperate over A2A, so version strings/MIME/capabilities are moot. The
   breaking schema changes target wire surfaces we don't expose.
3. **The genuinely interesting v1.0 features are additive feature work, not
   migration.** Bidirectional streamed RPC (`callFunction`/`actionResponse`) is a
   real capability, but our `POST /api/a2ui/action` round-trip already covers the
   app's needs. Building the streamed RPC would be a _new feature_, decided on its
   own merits.

### If/when we do adopt v1.0 (contained checklist)

- **Wire labels:** emit `"version": "v1.0"` if we ever expose an interop endpoint;
  rename `theme` → `surfaceProperties` in `src/lib/a2ui/schema/messages.ts` and the
  `SurfaceRenderer` theme-mapping block; drop any `primaryColor` read.
- **Data deletion:** change `src/lib/a2ui/binding/pointer.ts` upsert from
  "omit = delete" to "`null` = delete" (and audit `updateDataModel` callers).
- **Opportunistic, independent of version:** expose `placeholder` (TextField) and
  `steps` (Slider) through the legacy schema + adapter; wire `Video posterUrl`
  into the deferred-footage placeholder. These are nice regardless of v1.0.
- **Only if we add A2A/interop:** AgentCard capabilities (`supportedCatalogIds`,
  `acceptsInlineCatalogs`), extension URI `https://a2ui.org/a2a-extension/a2ui/v1.0`,
  `X-A2A-Extensions` activation, `DataPart` with a message **array**.
- **Only if we build streamed RPC:** `callFunction`/`functionResponse`/
  `actionResponse`, `wantResponse`+`actionId` on actions, `INVALID_FUNCTION_CALL`
  boundary checks, `functionCallId` on errors.

## Verdict

v1.0 is a meaningful protocol step (bidirectional RPC + single-message
instantiation are the real story), but for this repo it is **track-don't-migrate**:
no breakage to fix, a couple of low-effort cosmetic renames _if_ we ever go
interop, and a few additive component props we can cherry-pick whenever. Stay on
v0.9.1-compatible behavior until v1.0 ships as stable.
