# src/lib/ai — AI Integration Layer

## Overview

Multi-provider AI SDK integration with tool-driven UI generation. Handles provider selection, system prompts, narration, and image / video / music / voice generation, plus the `generate_ui` and `set_aesthetic` tools.

## Files

| File                   | Purpose                                                                     |
| ---------------------- | --------------------------------------------------------------------------- |
| `factory.ts`           | Provider selection: env vars → auth.json → mock fallback                    |
| `tools.ts`             | Tool definitions: `generate_ui` and `set_aesthetic`                         |
| `prompts.ts`           | System prompt (noir persona, A2UI constraints)                              |
| `narration.ts`         | Tool-less detective narration call (parallel to UI generation)              |
| `images.ts`            | `resolveA2UIImagePrompts()` — converts image `prompt` to generated images   |
| `image-style.ts`       | Module-level custom image style prompt override (get/set, ephemeral)        |
| `imageStore.ts`        | Persistence layer for generated images (base64 → file + `/api/images/{id}`) |
| `resolveImageBytes.ts` | Shared lazy-generate-then-read helper for the image + video routes          |
| `video.ts`             | Veo REST integration (start / poll / download; reference images)            |
| `videoStore.ts`        | Persistence + job records for generated video (`/api/video/file/{id}`)      |
| `musicStore.ts`        | Persistence for generated music beds (`/api/music/file/{id}`)               |
| `recordingStore.ts`    | Persistence for TTS recordings (`/api/tts/file/{id}`)                       |
| `composition.ts`       | Composition-seed helpers for the "Take 1/2/3" variant arrangements          |
| `theme-generator.ts`   | Builds a full CustomProfile from a plain-text vibe (`/api/theme`)           |
| `model-registry.ts`    | `MODEL_REGISTRY` of chat + image + video models across providers            |

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
  // BuiltInAestheticId — see src/lib/aesthetic/types.ts
  aestheticId: "noir" | "minimal" | "cyber-fixer" | "nostromo-console" | "gothic-manor",
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
