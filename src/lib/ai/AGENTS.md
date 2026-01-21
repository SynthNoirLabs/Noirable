# src/lib/ai — AI Integration Layer

## Overview

Multi-provider AI SDK integration with tool-driven UI generation. Handles provider selection, system prompts, image generation, and the single `generate_ui` tool.

## Files

| File            | Purpose                                                             |
| --------------- | ------------------------------------------------------------------- |
| `factory.ts`    | Provider selection: env vars → auth.json → mock fallback            |
| `tools.ts`      | Single `generate_ui` tool definition                                |
| `prompts.ts`    | System prompt (noir persona, A2UI constraints)                      |
| `images.ts`     | `resolveA2UIImagePrompts()` — converts `prompt` to generated images |
| `imageStore.ts` | Persistence layer for generated images                              |

## Provider Priority

1. `OPENAI_BASE_URL` → OpenAI-compatible proxy (key optional for local)
2. `OPENAI_API_KEY` → OpenAI direct
3. `ANTHROPIC_API_KEY` → Anthropic
4. `GOOGLE_GENERATIVE_AI_API_KEY` → Gemini
5. `~/.local/share/opencode/auth.json` fallback
6. Mock provider (dev only)

## Tool Contract

```typescript
tools.generate_ui({
  component: A2UIInput  // Zod-validated, allows image.prompt
}) → A2UIComponent      // Resolved, images have real URLs
```

**Image resolution:** If `component` contains `{ type: "image", prompt: "..." }`, `resolveA2UIImagePrompts()` generates the image and replaces `prompt` with `/api/images/{id}` in `src`.

## Conventions

- All files use `import 'server-only'`
- Provider instances cached at module level
- System prompt must maintain noir persona unless user requests debug mode
- Never return base64 in image `src` — always persist + return URL

## Testing

- Unit tests colocated: `*.test.ts`
- Mock provider used in tests via `NODE_ENV=test`
- `pnpm sanity:chat` validates live API tool responses
