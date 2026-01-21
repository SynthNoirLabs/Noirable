# bmad

Noir-themed evidence board driven by AI chat. The client streams UI updates from `/api/chat` and renders validated A2UI JSON into the Evidence Board.

## Quickstart

```bash
pnpm install
pnpm dev
```

Open `http://localhost:3000`.

## Scripts

- `pnpm dev`: start Next.js dev server.
- `pnpm build`: production build.
- `pnpm start`: start production server.
- `pnpm test`: Vitest unit/integration tests.
- `pnpm lint`: ESLint.
- `pnpm check`: prettier + lint + tests + build.
- `pnpm sanity:chat`: live API sanity check for tool output.
- `pnpm e2e` / `pnpm e2e:ui`: Playwright E2E.

## Environment

Set any of the following in `.env.local`:

- `OPENAI_API_KEY`, `OPENAI_BASE_URL`, `AI_MODEL`
- `GEMINI_API_KEY` / `GOOGLE_GENERATIVE_AI_API_KEY`
- `AI_GATEWAY_API_KEY`
- `AI_IMAGE_MODEL`
- `A2UI_IMAGE_DIR` (defaults to `.data/images/`)

## Endpoints

- `POST /api/chat`: chat + tool execution (A2UI generation).
- `GET /api/images/[id]`: serve generated images saved under `.data/images/`.
- `GET /print`: print-friendly view of current evidence.
