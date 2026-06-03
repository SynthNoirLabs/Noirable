# src/lib/ai — AI Integration Layer

## Overview

Multi-provider AI SDK integration with tool-driven UI generation. Handles provider selection, system prompts, image generation, and the `generate_ui` and `set_aesthetic` tools.

## Files

| File                | Purpose                                                                     |
| ------------------- | --------------------------------------------------------------------------- |
| `factory.ts`        | Provider selection: env vars → auth.json → mock fallback                    |
| `tools.ts`          | Tool definitions: `generate_ui` and `set_aesthetic`                         |
| `prompts.ts`        | System prompt (noir persona, A2UI constraints)                              |
| `images.ts`         | `resolveA2UIImagePrompts()` — converts image `prompt` to generated images   |
| `image-style.ts`    | Module-level custom image style prompt override (get/set, ephemeral)        |
| `imageStore.ts`     | Persistence layer for generated images (base64 → file + `/api/images/{id}`) |
| `model-registry.ts` | `MODEL_REGISTRY` of chat + image models across OpenAI, Anthropic, Google    |

## Provider Priority

1. `OPENAI_BASE_URL` → OpenAI-compatible proxy (key optional for local)
2. `OPENAI_API_KEY` → OpenAI direct
3. `ANTHROPIC_API_KEY` → Anthropic
4. `GOOGLE_GENERATIVE_AI_API_KEY` (or `GEMINI_API_KEY`) → Gemini
5. `~/.local/share/opencode/auth.json` fallback (per-provider keys)
6. Mock provider (only when `NODE_ENV === "development"`; otherwise `getProvider()` throws)

## Tool Contract

```typescript
tools.generate_ui({
  component: A2UIInput, // Zod-validated, allows image.prompt
}) → A2UIComponent      // Resolved, images have real URLs

tools.set_aesthetic({
  aestheticId: "noir" | "minimal",
  reason?: string,
}) → SetAestheticResult // { success, aestheticId, appliedAt, message }
```

**Image resolution:** If `component` contains `{ type: "image", prompt: "..." }`, `resolveA2UIImagePrompts()` generates the image and replaces `prompt` with `/api/images/{id}` in `src`. If generation fails, it falls back to an in-world "darkroom" SVG placeholder.

## Conventions

- Server-only entry points (`factory.ts`, `prompts.ts`, `image-style.ts`) use `import "server-only"`
- Auth config (`auth.json`) cached at module level via `getProvider()`
- System prompt must maintain noir persona unless user requests debug mode
- Never return base64 in image `src` — always persist + return URL

## Testing

- Unit tests colocated: `*.test.ts`
- Mock provider returned by `getProvider()` only when `NODE_ENV === "development"` (otherwise it throws); tests stub the env and filesystem to exercise this path
- `pnpm sanity:chat` validates live API tool responses
