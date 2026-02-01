# synthNoirUI (bmad)

> A noir-themed AI evidence board where natural language becomes visual UI.

[![CI](https://img.shields.io/badge/CI-passing-brightgreen)]()
[![Tests](https://img.shields.io/badge/tests-182%20passing-brightgreen)]()

## What is this?

**synthNoirUI** is an experimental AI-driven UI generation platform. Describe what you want in natural language, and watch it materialize as visual "evidence" on a noir detective's desk.

```
You: "Create a suspect profile card with name, photo, and last known location"

Detective: "The file's on your desk. Rain-soaked, like everything else in this town."

→ [Renders: A noir-styled card with generated image and data fields]
```

### Key Features

- **AI Chat Interface** - Talk to a hard-boiled detective AI persona
- **A2UI Protocol** - 20 validated component types via Zod
- **Live Evidence Board** - See UI generate in real-time with search/filter
- **Eject to Code** - Export to React + Tailwind with one click
- **Live Sandbox** - Sandpack integration for interactive code preview
- **Template Library** - 8 pre-built templates for quick starts
- **Undo/Redo** - Full state history with keyboard shortcuts
- **Multi-Provider** - OpenAI, Anthropic, Google, or any OpenAI-compatible API
- **A2UI v0.9 Protocol** - Full compliance with Google A2UI specification

## Quick Start

```bash
# Clone and install
git clone https://github.com/youruser/bmad.git
cd bmad
pnpm install

# Set up API key (any of these)
echo "OPENAI_API_KEY=sk-..." > .env.local
# OR: ANTHROPIC_API_KEY, GOOGLE_GENERATIVE_AI_API_KEY

# Run
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

## Documentation

| Document                                         | Description                         |
| ------------------------------------------------ | ----------------------------------- |
| [Product Spec](docs/PRODUCT.md)                  | Vision, features, design guidelines |
| [Architecture](docs/architecture.md)             | Technical design and data flows     |
| [Development Guide](docs/DEVELOPMENT.md)         | Setup, workflow, code style         |
| [A2UI Protocol](docs/reference/a2ui-protocol.md) | Component schema reference          |

## Commands

```bash
pnpm dev          # Start dev server (port 3000)
pnpm build        # Production build
pnpm check        # CI gate: prettier + eslint + vitest + build
pnpm test         # Run tests
pnpm e2e          # Playwright E2E tests
pnpm sanity:chat  # Live API validation
```

## Environment Variables

```bash
# AI Provider (uses first available)
OPENAI_BASE_URL=         # OpenAI-compatible proxy
OPENAI_API_KEY=          # OpenAI direct
ANTHROPIC_API_KEY=       # Anthropic
GOOGLE_GENERATIVE_AI_API_KEY=  # Gemini

# Optional
AI_MODEL=                # Override default model
AI_IMAGE_MODEL=          # Override image model
```

Fallback: `~/.local/share/opencode/auth.json`

## Project Structure

```
src/
├── app/api/chat/     # AI streaming endpoint
├── components/       # React components
│   ├── board/        # Evidence history
│   ├── chat/         # Chat sidebar
│   ├── eject/        # Code export
│   ├── layout/       # Main workspace
│   └── renderer/     # A2UI renderer
└── lib/
    ├── ai/           # Provider factory, tools
    ├── protocol/     # A2UI Zod schema
    └── store/        # Zustand state
```

## Status

| Component                | Status |
| ------------------------ | ------ |
| Core AI Chat             | Done   |
| A2UI Protocol (20 types) | Done   |
| Evidence Board + Search  | Done   |
| Eject to Code            | Done   |
| Multi-Provider Support   | Done   |
| Image Generation         | Done   |
| Form Handlers            | Done   |
| Persistent Storage       | Done   |
| Multi-File Export        | Done   |
| Undo/Redo                | Done   |
| Keyboard Shortcuts       | Done   |
| Template Library         | Done   |
| Live Sandbox (Sandpack)  | Done   |
| Prompt History           | Done   |
| Export to File (.zip)    | Done   |
| Loading States           | Done   |
| Error Recovery UI        | Done   |

See [PRODUCT.md](docs/PRODUCT.md) for full roadmap.

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **AI:** Vercel AI SDK 6
- **State:** Zustand
- **Schema:** Zod 4
- **Styling:** Tailwind CSS 4

## License

MIT

---

_"The rain never stops in this town. Neither does the code."_
