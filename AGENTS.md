# bmad — AI Evidence Board

Noir-themed evidence board where AI generates UI via tool calls. Chat streams A2UI JSON, validated via Zod, rendered as "evidence."

## Commands

```bash
# Development
pnpm dev              # Next.js dev server (port 3000)
pnpm build            # Production build
pnpm start            # Start production server

# Validation (CI gate)
pnpm check            # prettier + eslint + vitest + build (run before PR)

# Testing
pnpm test             # Run all Vitest tests
pnpm test src/lib/ai/factory.test.ts              # Single test file
pnpm test -t "uses env var"                       # Test by name pattern
pnpm test --watch                                 # Watch mode
pnpm test:coverage                                # With coverage report

# E2E
pnpm e2e              # Playwright headless
pnpm e2e:ui           # Playwright with UI

# Utilities
pnpm lint             # ESLint only
pnpm sanity:chat      # Live API tool validation
```

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/chat/           # AI streaming + tool execution
│   └── api/images/[id]/    # Serves generated images
├── components/
│   ├── board/              # EvidenceBoard (history)
│   ├── chat/               # ChatSidebar
│   ├── layout/             # DetectiveWorkspace, DeskLayout
│   ├── noir/               # Theme components
│   ├── renderer/           # A2UIRenderer
│   └── settings/           # ModelSelector
└── lib/
    ├── ai/                 # Provider factory, tools, images, model registry
    ├── protocol/           # A2UI Zod schema
    ├── store/              # Zustand state
    ├── evidence/           # Label/status derivation
    └── eject/              # A2UI to React export
```

## Code Style

### TypeScript

- `strict: true` enforced — explicit types required, no implicit `any`
- Named exports only — no default exports
- Path alias: `@/*` maps to `./src/*`
- Semicolons required

### Imports (order)

```typescript
// 1. Server-only directive (if needed)
import "server-only";

// 2. External packages
import { z } from "zod";
import { createOpenAI } from "@ai-sdk/openai";

// 3. Internal absolute imports (@/)
import { a2uiSchema } from "@/lib/protocol/schema";
import { cn } from "@/lib/utils";

// 4. Relative imports
import { TypewriterText } from "./TypewriterText";
```

### Naming

| Type                | Convention                 | Example             |
| ------------------- | -------------------------- | ------------------- |
| Components          | PascalCase                 | `EvidenceBoard.tsx` |
| Functions/variables | camelCase                  | `getProvider()`     |
| Types/interfaces    | PascalCase                 | `ProviderResult`    |
| Files               | kebab-case or match export | `use-a2ui-store.ts` |
| Constants           | UPPER_SNAKE_CASE           | `DEFAULT_MODEL`     |

### Components

```typescript
// Named export, interface for props
interface CardProps {
  title: string;
  status?: "active" | "archived";
}

export function Card({ title, status = "active" }: CardProps) {
  return <div className={cn("base-class", status === "active" && "active-class")}>{title}</div>;
}
```

### Error Handling

```typescript
// Use safeParse for validation
const result = schema.safeParse(data);
if (!result.success) {
  return { error: result.error.message };
}

// Wrap external calls in try-catch
try {
  const response = await externalApi();
} catch (error) {
  console.error("API failed:", error);
  return null;
}
```

### Testing (Vitest)

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock server-only in test files that import server modules
vi.mock("server-only", () => ({}));

describe("FeatureName", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("describes expected behavior", () => {
    expect(result).toBe(expected);
  });
});
```

## Key Files

| Task                    | Location                                       |
| ----------------------- | ---------------------------------------------- |
| Add A2UI component type | `src/lib/protocol/schema.ts`                   |
| Change AI behavior      | `src/lib/ai/prompts.ts`                        |
| Add/modify AI provider  | `src/lib/ai/factory.ts`                        |
| Image generation        | `src/lib/ai/images.ts`                         |
| Model capabilities      | `src/lib/ai/model-registry.ts`                 |
| Global state            | `src/lib/store/useA2UIStore.ts`                |
| Main orchestrator       | `src/components/layout/DetectiveWorkspace.tsx` |

## Anti-Patterns

| Avoid                  | Instead                         |
| ---------------------- | ------------------------------- |
| `any` type             | Use `unknown` or proper types   |
| `as any`, `@ts-ignore` | Fix the type error              |
| `{}` type              | Use `Record<string, unknown>`   |
| Default exports        | Named exports only              |
| Base64 in image src    | Use `/api/images/[id]` endpoint |
| Auth logic in client   | Use `import "server-only"`      |
| Empty catch blocks     | Log or handle the error         |
| `var` keyword          | Use `const` or `let`            |

## Environment Variables

```bash
# AI Provider (priority order)
OPENAI_BASE_URL=         # OpenAI-compatible proxy (highest priority)
OPENAI_API_KEY=          # OpenAI direct
ANTHROPIC_API_KEY=       # Anthropic
GOOGLE_GENERATIVE_AI_API_KEY=  # Gemini

# Optional overrides
AI_MODEL=                # Override chat model
AI_IMAGE_MODEL=          # Override image model
A2UI_IMAGE_DIR=          # Image storage (default: .data/images/)
```

Fallback auth: `~/.local/share/opencode/auth.json`

## Conventions

- **Tool-Driven UI**: AI calls `generate_ui` tool, result becomes evidence
- **Image Pipeline**: `prompt` in image component triggers generation, saved to `.data/images/`
- **Commits**: Conventional style — `feat(ui):`, `fix(api):`, `chore(deps):`
- **Noir Persona**: Maintain detective theme in AI responses unless debugging

## Documentation

| Doc                                                                | Purpose                                   |
| ------------------------------------------------------------------ | ----------------------------------------- |
| [docs/PRODUCT.md](docs/PRODUCT.md)                                 | Product spec, features, design guidelines |
| [docs/architecture.md](docs/architecture.md)                       | Technical architecture, data flows        |
| [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md)                         | Dev workflow, code style, testing         |
| [docs/reference/a2ui-protocol.md](docs/reference/a2ui-protocol.md) | A2UI component schema reference           |

## A2UI v0.9 Protocol

The project now supports A2UI v0.9 specification for agent-generated UI.

### API Endpoint

- `/api/a2ui/stream` - SSE streaming endpoint
- Accepts: `{ prompt: string }`
- Returns: JSONL stream with A2UI v0.9 messages

### Message Types

- `createSurface` - Initialize new surface
- `updateComponents` - Add/update components
- `deleteSurface` - Remove surface

### Components

18 standard catalog components:

| Category | Components                                                       |
| -------- | ---------------------------------------------------------------- |
| Layout   | Row, Column, List, Card, Tabs, Divider, Modal                    |
| Content  | Text, Image, Icon, Video, AudioPlayer                            |
| Input    | Button, CheckBox, TextField, DateTimeInput, ChoicePicker, Slider |

### Testing

```bash
# Unit tests
pnpm test src/lib/a2ui/
pnpm test src/components/a2ui/

# E2E tests
pnpm e2e tests/e2e/a2ui/
```

### Key Files

| Task                     | Location                   |
| ------------------------ | -------------------------- |
| A2UI v0.9 message schema | `src/lib/a2ui/schema/`     |
| A2UI catalog components  | `src/lib/a2ui/catalog/`    |
| A2UI surface management  | `src/lib/a2ui/surfaces/`   |
| A2UI React components    | `src/components/a2ui/`     |
| A2UI streaming endpoint  | `src/app/api/a2ui/stream/` |

### Legacy Protocol

The old tool-result protocol (`src/lib/protocol/schema.ts`) is deprecated but still functional.
New features should use A2UI v0.9
