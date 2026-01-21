# Repository Guidelines

## Project Structure & Module Organization

- `src/app/`: Next.js App Router pages and API routes (e.g., `src/app/api/chat/route.ts`).
- `src/app/api/images/`: serves persisted generated images (`/api/images/[id]`).
- `src/app/print/`: print‑friendly evidence view (`/print`).
- `src/components/`: UI components (chat, layout, noir UI, renderer).
- `src/components/board/`: Evidence Board (history + selection UI).
- `src/lib/`: AI integration, protocol schema, state store, utilities.
- `src/lib/evidence/`: helpers for evidence labels/status.
- `src/__tests__/`: UI/layout tests.
- `tests/e2e/`: Playwright end‑to‑end tests.
- `scripts/`: Sanity scripts (e.g., `scripts/sanity-chat.ts`).
- `conductor/` and `docs/`: product docs, architecture, tracks, and plans.
- `.buildkite/`: Buildkite pipeline config.
- `.data/images/`: local persisted generated images (gitignored; configurable via `A2UI_IMAGE_DIR`).

## Build, Test, and Development Commands

- `pnpm dev`: run the Next.js dev server.
- `pnpm build`: production build.
- `pnpm start`: run production server.
- `pnpm test`: unit/integration tests (Vitest).
- `pnpm lint`: ESLint.
- `pnpm check`: format check + lint + tests + build.
- `pnpm sanity:chat`: live API sanity check for tool output.
- `pnpm e2e` / `pnpm e2e:ui`: Playwright E2E (headless/UI).
- `pnpm prettier --write .`: auto-format.

## HTTP Endpoints

- `POST /api/chat`: chat + tool execution (A2UI generation).
- `GET /api/images/[id]`: serve generated images saved under `.data/images/`.
- `GET /print`: print-friendly view of current/active evidence.

## Coding Style & Naming Conventions

- TypeScript + React; follow existing patterns in `src/`.
- Formatting via Prettier; linting via ESLint.
- Prefer explicit types and avoid `any`.
- Use existing naming (PascalCase for components, camelCase for functions, kebab‑case for file names where already used).

## Testing Guidelines

- Framework: Vitest + React Testing Library.
- Test files live alongside features (`src/**/*.test.tsx`) or in `src/__tests__/`.
- E2E tests in `tests/e2e/` using Playwright.
- Run unit tests with `pnpm test`; run E2E with `pnpm e2e`.

## Commit & Pull Request Guidelines

- Commit messages follow Conventional‑style prefixes (examples from history):
  - `feat(ui): ...`, `fix(auth): ...`, `test(api): ...`, `docs(conductor): ...`
  - `conductor(plan): ...`, `conductor(checkpoint): ...`, `chore(conductor): ...`
- PRs should include a brief summary, test results, and screenshots for UI changes.

## Configuration & Secrets

- Local AI credentials can come from env vars (e.g., `OPENAI_API_KEY`, `OPENAI_BASE_URL`, `AI_MODEL`, `GEMINI_API_KEY`, `GOOGLE_GENERATIVE_AI_API_KEY`, `AI_GATEWAY_API_KEY`, `AI_IMAGE_MODEL`) or `~/.local/share/opencode/auth.json`.
- Image persistence directory: `A2UI_IMAGE_DIR` (defaults to `.data/images/`).
- Use `.env.local` for local environment overrides.
