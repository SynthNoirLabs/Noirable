# Story 1.4: Flexible Auth/Provider Setup (ProviderFactory)

## Context
As a developer, I want to support various LLM providers via env vars or CLI-style config, so I'm not locked in and can use Agent CLIs.

## Acceptance Criteria
- [x] Create `src/lib/ai/factory.ts` (Server-Only).
- [x] Implement `getProvider()` logic:
    1. Check Env Vars (`OPENAI_API_KEY`).
    2. Check Local Config (`~/.config/opencode/auth.json` or standard locations).
    3. Return configured AI SDK provider instance.
- [x] Update `/api/chat` to use the Factory.

## Technical Notes
- **Security:** Ensure this code NEVER bundles to client (`import 'server-only'`).
- **Dependencies:** `fs` node module.
- **Fallbacks:** Throw clear error if no key found.

## Test Plan
- Unit test: Mock `process.env` and `fs.readFileSync` to verify discovery logic.
- Verify `server-only` constraint.
