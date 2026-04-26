# Changelog

All notable changes to this project are documented here. Format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project
intends to adopt semantic versioning once it stabilizes past `0.1.0`.

## [Unreleased]

### Security

- Removed raw request body logging from `POST /api/chat`. Bodies contained
  full user prompts and could include pasted secrets. Replaced with a
  shape-only summary helper (`src/lib/api/logger.ts`).
- Hardened `apiSecurityCheck` rate limiter: TTL eviction, 10k-key cap, and a
  one-time warning when the in-memory backend is used in production. Added an
  Upstash REST adapter that activates when `UPSTASH_REDIS_REST_URL` and
  `UPSTASH_REDIS_REST_TOKEN` are set.
- The `/api/chat` E2E mock path is now gated by `NODE_ENV !== "production"` in
  addition to `E2E === "1"`, so a stray env var cannot ship mock responses.
- TTS input is stripped of ASCII control characters before being forwarded to
  the upstream voice API.
- `imageStore.saveImageBase64` now refuses 0-byte and >5 MiB blobs, and
  non-`ENOENT` read failures surface via `console.warn` instead of being
  silently dropped.
- Decryption failures in `crypto.decryptValue` now log the failure reason via
  `console.warn`. Public contract (`string | null`) is unchanged.
- Evidence interpolated into the system prompt is now wrapped in `<evidence>`
  fenced delimiters with embedded closing tags stripped, as defense-in-depth
  against prompt-injection via stored state.

### Added

- `GET /api/openai/status` probes a user-provided OpenAI key against
  `/v1/models`. The OpenAI input in `ApiKeyManager` now has the same "Test"
  affordance as the ElevenLabs input.
- `assertModelAllowed` in `src/lib/ai/factory.ts` rejects unknown model ids
  for known providers. `auto` and `openai-compatible` intentionally skip
  validation since the upstream is user-configured.
- A2UI button action dispatch: `ButtonRenderer` fires a window
  `CustomEvent("a2ui:action")` carrying the component id and raw action
  payload when `btn.action` is set. Buttons without an action render disabled
  with a "No action wired" tooltip.
- `ELEVENLABS_VOICE_ID` env var (with the prior literal as default) so the
  TTS voice is no longer hardcoded.
- `LICENSE` (MIT, matching the README claim) and `CONTRIBUTING.md` (pointer
  to `docs/DEVELOPMENT.md`).
- `lint-staged` for the Husky pre-commit hook so commits run prettier +
  eslint + stylelint only on staged files. The full `pnpm check` remains the
  CI gate.
- GitHub Actions now runs a second `e2e` job (Playwright on Chromium) after
  the existing `check` job.
- New Vitest coverage: `security.test.ts`, `openai/status/route.test.ts`,
  three new `factory.test.ts` cases, and one new `prompts.test.ts` case for
  the evidence escape behavior.

### Changed

- `apiSecurityCheck` is now `async`. All three call sites (`/api/chat`,
  `/api/tts`, `/api/a2ui/stream`) updated to `await` it.
- Fallback SVG colors in `src/lib/ai/images.ts` are extracted to named
  constants. Theme tokens cannot apply inside a Data URL, so the constants
  document the palette in one place rather than pretending it can be
  themed.

### Deferred / known follow-ups

- The original review flagged `SurfaceRenderer.tsx` as monolithic. On
  re-reading, the file is 422 lines with already-isolated per-component
  renderers; splitting into category files would force a third "core" module
  to dodge circular imports. The legacy `A2UIRenderer.tsx` is the better
  candidate for a future extraction pass.
- Several deprecated transitive dependencies (`rimraf<4`,
  `intersection-observer-polyfill`, old `glob`) are pinned by upstream
  packages. Direct dependencies were not changed in this pass.
- The package version stays at `0.1.0`. A semver bump and tagging policy is
  an editorial decision pending a stable release.
- Buildkite (`.buildkite/pipeline.yml`) and GitHub Actions both run the same
  checks. Consolidation onto one CI is left as a separate decision.
