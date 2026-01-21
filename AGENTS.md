# bmad — AI Evidence Board

**Generated:** 2026-01-21 | **Commit:** 2d532ad | **Branch:** main

## Overview

Noir-themed evidence board where AI generates UI via tool calls. Chat streams A2UI JSON → validated → rendered as "evidence." Draft Mode (A2UI) for speed, Eject Mode for React code export.

## Structure

```
bmad/
├── src/
│   ├── app/              # Next.js App Router
│   │   ├── api/chat/     # AI chat + tool execution
│   │   ├── api/images/   # Serves generated images from .data/
│   │   └── print/        # Print-friendly evidence view
│   ├── components/
│   │   ├── board/        # EvidenceBoard (history + selection)
│   │   ├── chat/         # ChatSidebar
│   │   ├── layout/       # DetectiveWorkspace, DeskLayout
│   │   ├── noir/         # Theme components (typewriter, dossier)
│   │   └── renderer/     # A2UIRenderer
│   └── lib/
│       ├── ai/           # Provider factory, tools, images, prompts
│       ├── protocol/     # A2UI schema (Zod validation)
│       ├── store/        # Zustand state (useA2UIStore)
│       ├── evidence/     # Label/status derivation
│       └── eject/        # Export to React code
├── conductor/            # AI-driven dev orchestration (see conductor/AGENTS.md)
├── tests/e2e/            # Playwright specs
└── .data/images/         # Generated images (gitignored)
```

## Where to Look

| Task                  | Location                                       | Notes                                   |
| --------------------- | ---------------------------------------------- | --------------------------------------- |
| Add UI component type | `src/lib/protocol/schema.ts`                   | Update Zod schema + discriminated union |
| Change AI behavior    | `src/lib/ai/prompts.ts`                        | System prompt lives here                |
| Add AI provider       | `src/lib/ai/factory.ts`                        | Priority: env → config file → mock      |
| Modify tool output    | `src/lib/ai/tools.ts`                          | Single `generate_ui` tool               |
| Fix image generation  | `src/lib/ai/images.ts`                         | `resolveA2UIImagePrompts()`             |
| Update evidence logic | `src/lib/evidence/utils.ts`                    | `deriveEvidenceLabel/Status`            |
| State persistence     | `src/lib/store/useA2UIStore.ts`                | Zustand + localStorage                  |
| Main workspace        | `src/components/layout/DetectiveWorkspace.tsx` | Orchestrates chat + board               |

## Code Map

| Symbol               | Type      | Location                    | Role                                            |
| -------------------- | --------- | --------------------------- | ----------------------------------------------- |
| `a2uiSchema`         | Zod       | `lib/protocol/schema.ts`    | Output validation (20+ component types)         |
| `a2uiInputSchema`    | Zod       | `lib/protocol/schema.ts`    | Input validation (allows `prompt` for images)   |
| `getProvider()`      | fn        | `lib/ai/factory.ts`         | Returns AI provider + model based on env/config |
| `tools.generate_ui`  | Tool      | `lib/ai/tools.ts`           | Single tool for UI generation                   |
| `useA2UIStore`       | Hook      | `lib/store/useA2UIStore.ts` | Global state: evidence, history, layout         |
| `DetectiveWorkspace` | Component | `components/layout/`        | Main orchestrator                               |

## Conventions

**TypeScript:**

- `strict: true` — explicit types, avoid `any`
- Named exports only — no default exports
- Path alias: `@/*` → `./src/*`
- Semicolons required (no ASI reliance)

**Naming:**

- Components: `PascalCase`
- Functions/vars: `camelCase`
- Files: `kebab-case` where established

**Commits:** Conventional style — `feat(ui):`, `fix(api):`, `conductor(plan):`

## Anti-Patterns

| Pattern                        | Why                                           |
| ------------------------------ | --------------------------------------------- |
| Auth in client components      | Use `import 'server-only'` for auth logic     |
| Base64 in `image.src`          | Always use `/api/images/[id]` endpoint        |
| `var`, `namespace`, `#private` | Use `const`/`let`, modules, `private` keyword |
| `{}` type                      | Use `unknown` or `Record<string, unknown>`    |
| Partial A2UI fragments         | Always return complete root component         |
| Breaking noir persona          | Maintain character unless debugging           |

## Commands

```bash
pnpm dev          # Dev server
pnpm check        # Format + lint + test + build (CI gate)
pnpm test         # Vitest
pnpm e2e          # Playwright
pnpm sanity:chat  # Live API tool validation
```

## Environment

```bash
# AI Provider (pick one)
OPENAI_API_KEY=          # OpenAI
OPENAI_BASE_URL=         # Custom proxy (takes priority)
ANTHROPIC_API_KEY=       # Anthropic
GOOGLE_GENERATIVE_AI_API_KEY=  # Gemini

# Optional
AI_MODEL=                # Override model name
AI_IMAGE_MODEL=          # Image generation model
A2UI_IMAGE_DIR=          # Image storage (default: .data/images/)
```

Fallback: `~/.local/share/opencode/auth.json`

## Notes

- **Tool-Driven UI:** Chat doesn't render text responses directly. AI calls `generate_ui` tool → result becomes evidence.
- **Image Pipeline:** `prompt` in image component → AI generates → saves to `.data/images/` → returns `/api/images/{id}` URL.
- **Buildkite CI:** Uses macOS agents. `pnpm check` is the single validation gate.
- **Eject Mode:** `src/lib/eject/exportA2UI.ts` — transforms A2UI JSON to React/Tailwind code.
