# Development Guide

> Everything you need to contribute to synthNoirUI.

## Quick Start

```bash
# Install dependencies
pnpm install

# Start dev server
pnpm dev

# Open http://localhost:3000
```

## Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start Next.js dev server (port 3000) |
| `pnpm build` | Production build |
| `pnpm start` | Start production server |
| `pnpm check` | **CI gate** - prettier + eslint + vitest + build |
| `pnpm test` | Run Vitest tests |
| `pnpm test:coverage` | Tests with coverage report |
| `pnpm lint` | ESLint only |
| `pnpm e2e` | Playwright E2E (headless) |
| `pnpm e2e:ui` | Playwright with UI |
| `pnpm sanity:chat` | Live API tool validation |

**Before every PR:** Run `pnpm check` to ensure CI will pass.

---

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/chat/           # AI streaming + tool execution
│   ├── api/images/[id]/    # Serves generated images
│   └── print/              # Print view page
├── components/
│   ├── board/              # EvidenceBoard (history)
│   ├── chat/               # ChatSidebar
│   ├── eject/              # EjectPanel (code export)
│   ├── layout/             # DetectiveWorkspace, DeskLayout
│   ├── noir/               # Theme components (TypewriterText)
│   ├── renderer/           # A2UIRenderer
│   └── settings/           # ModelSelector
└── lib/
    ├── ai/                 # Provider factory, tools, images, registry
    ├── protocol/           # A2UI Zod schema
    ├── store/              # Zustand state
    ├── evidence/           # Label/status derivation
    └── eject/              # A2UI to React export
```

### Key Files

| Task | Location |
|------|----------|
| Add A2UI component type | `src/lib/protocol/schema.ts` |
| Change AI behavior | `src/lib/ai/prompts.ts` |
| Add/modify AI provider | `src/lib/ai/factory.ts` |
| Image generation | `src/lib/ai/images.ts` |
| Model capabilities | `src/lib/ai/model-registry.ts` |
| Global state | `src/lib/store/useA2UIStore.ts` |
| Main orchestrator | `src/components/layout/DetectiveWorkspace.tsx` |
| Code export | `src/lib/eject/exportA2UI.ts` |

---

## Code Style

### TypeScript Rules

| Rule | Requirement |
|------|-------------|
| **Exports** | Named only. No default exports. |
| **Variables** | `const`/`let` only. No `var`. |
| **Private fields** | Use `private` modifier, not `#private` |
| **Types** | Explicit types required. No `any`. |
| **Equality** | Always `===` / `!==` |
| **Semicolons** | Required at end of statements |
| **Empty type** | Use `Record<string, unknown>` not `{}` |

### Import Order

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

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `EvidenceBoard.tsx` |
| Functions/variables | camelCase | `getProvider()` |
| Types/interfaces | PascalCase | `ProviderResult` |
| Files | kebab-case or match export | `use-a2ui-store.ts` |
| Constants | UPPER_SNAKE_CASE | `DEFAULT_MODEL` |

### Component Pattern

```typescript
// Named export, interface for props
interface CardProps {
  title: string;
  status?: "active" | "archived";
}

export function Card({ title, status = "active" }: CardProps) {
  return (
    <div className={cn("base-class", status === "active" && "active-class")}>
      {title}
    </div>
  );
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

---

## Testing

### Running Tests

```bash
pnpm test                              # All tests
pnpm test src/lib/ai/factory.test.ts   # Single file
pnpm test -t "uses env var"            # By name pattern
pnpm test --watch                      # Watch mode
pnpm test:coverage                     # With coverage
```

### Test Pattern

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

### Coverage Requirements

- Target: **>80%** for new code
- Run `pnpm test:coverage` to check

---

## Workflow

### Task Lifecycle

```
1. Create branch from main
2. Write failing tests (Red)
3. Implement to pass (Green)
4. Refactor
5. Run `pnpm check`
6. Commit with conventional message
7. Open PR
```

### Commit Messages

```
<type>(<scope>): <description>

Types:
- feat:     New feature
- fix:      Bug fix
- docs:     Documentation
- style:    Formatting
- refactor: Code restructure
- test:     Adding tests
- chore:    Maintenance
```

**Examples:**
```bash
git commit -m "feat(ui): add evidence history board"
git commit -m "fix(api): handle empty tool response"
git commit -m "test(ai): add provider factory tests"
```

### Quality Gates

Before marking any task complete:

- [ ] All tests pass (`pnpm test`)
- [ ] No lint errors (`pnpm lint`)
- [ ] Types check (`pnpm build`)
- [ ] Prettier passes (`pnpm prettier --check .`)
- [ ] Coverage adequate (>80%)

---

## Environment Variables

```bash
# AI Provider (priority order)
OPENAI_BASE_URL=                      # OpenAI-compatible proxy (highest)
OPENAI_API_KEY=                       # OpenAI direct
ANTHROPIC_API_KEY=                    # Anthropic
GOOGLE_GENERATIVE_AI_API_KEY=         # Gemini

# Optional overrides
AI_MODEL=                             # Override chat model
AI_IMAGE_MODEL=                       # Override image model
A2UI_IMAGE_DIR=                       # Image storage (default: .data/images/)
```

Fallback auth: `~/.local/share/opencode/auth.json`

---

## Anti-Patterns

| Avoid | Instead |
|-------|---------|
| `any` type | Use `unknown` or proper types |
| `as any`, `@ts-ignore` | Fix the type error |
| `{}` type | Use `Record<string, unknown>` |
| Default exports | Named exports only |
| Base64 in image src | Use `/api/images/[id]` endpoint |
| Auth logic in client | Use `import "server-only"` |
| Empty catch blocks | Log or handle the error |
| `var` keyword | Use `const` or `let` |

---

## Troubleshooting

### CI Failing

```bash
# Check what's wrong
pnpm check

# Fix formatting
pnpm prettier --write .

# Fix lint issues
pnpm lint --fix
```

### Tests Failing

```bash
# Run specific test with verbose output
pnpm test src/path/to/test.ts --reporter=verbose

# Debug in watch mode
pnpm test --watch
```

### Type Errors

```bash
# Check types without building
npx tsc --noEmit

# See full error output
pnpm build 2>&1 | head -50
```

---

*Last updated: 2026-02-01*
