# A2UI v0.9 → v0.9.1 Migration

> Source specs (fetched 2026-06-19):
>
> - https://a2ui.org/specification/v0.9.1-a2ui/
> - https://a2ui.org/specification/v0.9.1-a2ui-extension-specification/
> - https://a2ui.org/specification/v0.9.1-evolution-guide/
> - https://a2ui.org/specification/v0.9.1-basic-catalog-implementation-guide/

## TL;DR

v0.9.1 is a **minor refinement** of v0.9, not a breaking release. The upstream
evolution guide lists exactly **two** changes, and v0.9.1 is declared "fully
compatible with v0.9 payloads" — the `version` field accepts both `"v0.9"` and
`"v0.9.1"`, so clients and servers upgrade seamlessly.

| #   | Change                       | Kind                    | Impact on this repo                          |
| --- | ---------------------------- | ----------------------- | -------------------------------------------- |
| 1   | MIME type standardized       | Standardization         | **None** — we don't use the A2A transport.   |
| 2   | `surfaceId` uniqueness relaxed | Behavioral relaxation | **None** — our store already keys per-active-surface. |

No new components, no renamed fields, no removed fields, no new functions. The
basic catalog (17 components, 15 functions) is unchanged between v0.9 and v0.9.1.

> **Looking further ahead:** v1.0 (release candidate) is a much larger step —
> bidirectional RPC, `theme` → `surfaceProperties`, `null`-based deletion, and
> more. See [`a2ui-v1.0-candidate.md`](./a2ui-v1.0-candidate.md) for the full
> assessment (verdict: track, don't migrate yet).

## The two changes

### 1. MIME type standardization

All references to the A2UI message payload MIME type are standardized to:

```
application/a2ui+json
```

replacing the legacy `application/json+a2ui` used in earlier draft iterations of
the v0.9 extension spec. This value goes in the A2A `DataPart` metadata's
`mimeType` field when A2UI rides the A2A protocol.

**Migration step (upstream):** change any hardcoded `application/json+a2ui` to
`application/a2ui+json`.

**Why it doesn't affect us:** this repo does **not** transport A2UI over A2A. The
live path is a plain Server-Sent Events stream
(`Content-Type: text/event-stream`) carrying JSONL messages — see
`src/app/api/a2ui/stream/route.ts` and `src/lib/a2ui/transport/stream-parser.ts`.
There is no `application/json+a2ui` literal anywhere in `src/`, so nothing to
rename. If A2UI is ever exposed over A2A here, use `application/a2ui+json` from
the start.

### 2. `surfaceId` uniqueness relaxation

- **Removed constraint:** `surfaceId` no longer needs to be "globally unique for
  the renderer's lifetime."
- **Retained constraint:** `surfaceId` must be unique among **active** surfaces —
  it remains an error to `createSurface` for an id that already exists without
  first `deleteSurface`-ing it. A `surfaceId` may be reused once its surface has
  been deleted.

**Why it doesn't affect us:** `useSurfaceStore`
(`src/lib/a2ui/store/useSurfaceStore.ts`) already keys surfaces by id and creates
them fresh per stream; the harness/gallery/print surfaces use stable ids
(`"harness"`, `"gallery"`, `"print"`) that are recreated, not required to be
lifetime-globally-unique. The relaxed rule is strictly more permissive, so the
existing behavior is already compliant.

## Extension-spec reference values (for any future A2A binding)

If A2UI is ever bound to the A2A protocol from this app, these are the v0.9.1
string constants:

| Concept            | Value                                              |
| ------------------ | -------------------------------------------------- |
| Payload MIME type  | `application/a2ui+json`                             |
| Extension URI      | `https://a2ui.org/a2a-extension/a2ui/v0.9.1`       |
| Message `version`  | `"v0.9.1"` (and `"v0.9"` still accepted)           |
| Activation header  | `X-A2A-Extensions`                                  |

AgentCard capability declaration lives under `AgentCapabilities.extensions`, with
`params.supportedCatalogIds` (string array) and `params.acceptsInlineCatalogs`
(boolean, default `false`). The `data` field of the A2A `DataPart` MUST be an
**array** of A2UI messages, processed sequentially; a renderer SHOULD NOT repaint
until the whole list is processed (flicker avoidance).

## What this repo deliberately does NOT adopt

This app's transport intentionally deviates from the canonical envelope (already
true under v0.9, unchanged by v0.9.1):

- **Flattened envelope.** Upstream wraps each message in a named key
  (`{"createSurface": {...}}`); we emit a top-level `type` discriminator
  (`{"type": "createSurface", ...}`) — see `src/lib/a2ui/schema/messages.ts`.
- **No `version` field on the wire.** The local stream omits the envelope
  `version` entirely; it is a single-app SSE pipeline, not an interoperable A2A
  endpoint. Accepting/emitting `"v0.9.1"` would only matter for cross-vendor
  interop we don't do.
- **`catalogId: "standard"`** rather than the spec's basic-catalog id
  (`https://a2ui.org/specification/v0_9_1/catalogs/basic/catalog.json`). The
  model emits legacy-shaped trees that the adapter
  (`src/lib/a2ui/adapter/legacyToCatalog.ts`) flattens to the catalog shape; the
  catalog id is a local label, not a resolvable URI.

These are conscious simplifications for a local, single-app renderer. None are
affected by the v0.9.1 deltas.

## Verdict

**No code change is required to be v0.9.1-compatible.** The repo is already
compatible (v0.9.1 only loosens a constraint we never violated and renames a MIME
type we never used). The remaining work is purely documentation hygiene —
updating "v0.9" version labels to note v0.9.1 — captured below.

### Optional follow-ups (doc/label only, low priority)

- Update the "v0.9" mentions in `docs/architecture.md`, `docs/reference/`, and the
  code comments to read "v0.9 / v0.9.1" where they describe the protocol level
  (cosmetic; the protocol behavior is identical).
- If interop over A2A is ever added: emit `"version": "v0.9.1"`, use the
  `application/a2ui+json` MIME type, and the named-key envelope.
