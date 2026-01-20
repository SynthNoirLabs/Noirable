# Repository Guidelines

## Project Structure & Module Organization

- `src/app/`: Next.js App Router pages and API routes (e.g., `src/app/api/chat/route.ts`).
- `src/components/`: UI components (chat, layout, noir UI, renderer).
- `src/lib/`: AI integration, protocol schema, state store, utilities.
- `src/__tests__/`: UI/layout tests.
- `tests/e2e/`: Playwright end‑to‑end tests.
- `scripts/`: Sanity scripts (e.g., `scripts/sanity-chat.ts`).
- `conductor/` and `docs/`: product docs, architecture, tracks, and plans.

## Build, Test, and Development Commands

- `pnpm dev`: run the Next.js dev server.
- `pnpm build`: production build.
- `pnpm start`: run production server.
- `pnpm test`: unit/integration tests (Vitest).
- `pnpm lint`: ESLint.
- `pnpm check`: format check + lint + tests.
- `pnpm sanity:chat`: live API sanity check for tool output.
- `pnpm e2e` / `pnpm e2e:ui`: Playwright E2E (headless/UI).
- `pnpm exec prettier --check .`: formatting check.

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

- Local AI credentials can come from env vars (e.g., `OPENAI_API_KEY`, `OPENAI_BASE_URL`, `AI_MODEL`) or `~/.local/share/opencode/auth.json`.
- Use `.env.local` for local environment overrides.
