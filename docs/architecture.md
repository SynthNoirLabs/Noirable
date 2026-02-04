# Architecture

> Technical blueprint for synthNoirUI's AI-driven UI generation system.

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client (Next.js)                        │
├─────────────┬─────────────┬─────────────┬──────────────────────┤
│ JSON Editor │ Evidence    │ Eject Panel │ Chat Sidebar         │
│             │ Board       │ (React/JSON)│ (useChat)            │
└──────┬──────┴──────┬──────┴──────┬──────┴──────────┬───────────┘
       │             │             │                  │
       └─────────────┴─────────────┴──────────────────┘
                              │
                    ┌─────────▼─────────┐
                    │   Zustand Store   │
                    │ (evidence, history)│
                    └─────────┬─────────┘
                              │
                    ┌─────────▼─────────┐
                    │  POST /api/chat   │
                    │  (streamText)     │
                    └─────────┬─────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
         ┌────────┐     ┌────────┐     ┌────────┐
         │ OpenAI │     │Anthropic│    │ Google │
         └────────┘     └────────┘     └────────┘
```

## Tech Stack

| Category | Technology | Version | Purpose |
|----------|------------|---------|---------|
| Framework | Next.js (App Router) | 16.x | Application core |
| AI SDK | Vercel AI SDK | 6.x | Streaming & tools |
| State | Zustand | 5.x | Evidence state |
| Schema | Zod | 4.x | Protocol validation |
| Styling | Tailwind CSS | 4.x | UI styling |
| Testing | Vitest + Playwright | - | Unit + E2E tests |
| Animation | Framer Motion | - | Noir effects |

---

## Core Components

### 1. API Layer (`/api/chat`)

**Role:** Orchestrate LLM interaction with tool calling.

```typescript
// Simplified flow
POST /api/chat
  → Parse messages + evidence from request
  → Build system prompt with noir persona
  → Call streamText() with generate_ui tool
  → Stream UI messages back to client
```

**Key file:** `src/app/api/chat/route.ts`

### 2. Provider Factory (Server-only)

**Role:** Resolve API keys and create AI provider instances.

**Priority order:**
1. `OPENAI_BASE_URL` (OpenAI-compatible proxy)
2. `OPENAI_API_KEY` (OpenAI direct)
3. `ANTHROPIC_API_KEY` (Anthropic)
4. `GOOGLE_GENERATIVE_AI_API_KEY` (Google)
5. `~/.local/share/opencode/auth.json` (fallback)

**Key file:** `src/lib/ai/factory.ts`

### 3. Tool System

**The `generate_ui` tool:**
- Input: A2UI component JSON (validated by Zod)
- Output: Validated A2UI component with resolved images
- Execution: Server-side via AI SDK `tool()` helper

```typescript
// Tool schema (simplified)
{
  name: "generate_ui",
  description: "Generate UI evidence",
  inputSchema: a2uiInputSchema, // Zod schema
  execute: async ({ component }) => {
    const validated = a2uiComponentSchema.parse(component);
    const resolved = await resolveImages(validated);
    return resolved;
  }
}
```

**Key file:** `src/lib/ai/tools.ts`

### 4. State Management (Zustand)

**Store structure:**
```typescript
{
  evidence: A2UIComponent | null,      // Current UI
  evidenceHistory: A2UIComponent[],    // History
  activeEvidenceId: string | null,     // Selected history item
  settings: { model, imageModel },     // User preferences
  layout: { sizes, collapsed },        // UI layout state
}
```

**Key file:** `src/lib/store/useA2UIStore.ts`

### 5. Client Synchronization

**Pattern:** Observer on `messages` stream.

```typescript
// DetectiveWorkspace.tsx (simplified)
useEffect(() => {
  const lastMessage = messages[messages.length - 1];
  
  // Check for tool result in message parts
  for (const part of lastMessage.parts) {
    if (part.type === "tool-invocation" && 
        part.toolInvocation.state === "result") {
      const result = part.toolInvocation.result;
      setEvidence(result);
      addEvidence(result);
    }
  }
}, [messages]);
```

**Key file:** `src/components/layout/DetectiveWorkspace.tsx`

---

## Data Flow

### UI Generation Flow

```
1. User types "Create a suspect card"
   ↓
2. ChatSidebar sends POST /api/chat
   Body: { messages, evidence: currentEvidence }
   ↓
3. API builds system prompt with:
   - Noir persona instructions
   - A2UI protocol reference
   - Current evidence (for updates)
   ↓
4. LLM calls generate_ui tool
   ↓
5. Server validates output against Zod schema
   ↓
6. If images have prompts, generate them
   ↓
7. Stream response via toUIMessageStreamResponse
   ↓
8. Client parses message.parts for tool-invocation
   ↓
9. Update Zustand store with new evidence
   ↓
10. A2UIRenderer displays the component
```

### Image Generation Flow

```
1. Tool output contains: { type: "image", prompt: "..." }
   ↓
2. resolveImages() detects prompt field
   ↓
3. Generate image via AI provider (DALL-E, Imagen, etc.)
   ↓
4. Save to .data/images/{uuid}.png
   ↓
5. Replace prompt with src: "/api/images/{uuid}"
   ↓
6. Return modified component
```

---

## API Reference

### `POST /api/chat`

**Request:**
```typescript
{
  messages: UIMessage[],
  evidence?: A2UIComponent  // Current state for updates
}
```

**Response:** Server-Sent Events stream with UI messages.

### `GET /api/images/[id]`

**Response:** Image file from `.data/images/` directory.

### `POST /api/a2ui/stream` (A2UI v0.9)

**Request:**
```typescript
{
  prompt: string  // Natural language UI request
}
```

**Response:** Server-Sent Events stream with A2UI v0.9 messages:
```jsonl
data: {"type":"createSurface","surfaceId":"...","catalogId":"standard"}
data: {"type":"updateComponents","surfaceId":"...","components":[...]}
data: [DONE]
```

**Message Types:**
- `createSurface` - Initialize new surface with catalog
- `updateComponents` - Add/update components in surface
- `updateDataModel` - Update data at JSON Pointer path
- `deleteSurface` - Remove surface

**Key Files:**
- Endpoint: `src/app/api/a2ui/stream/route.ts`
- Schemas: `src/lib/a2ui/schema/messages.ts`
- Components: `src/lib/a2ui/catalog/components.ts`

### `GET /print`

**Response:** Print-friendly HTML view of current evidence.

---

## Security Considerations

| Concern | Mitigation |
|---------|------------|
| API key exposure | Server-only imports, never in client |
| Code injection | A2UI is declarative JSON, no execution |
| Image storage | Local filesystem only, served via API |
| Input validation | All tool inputs validated by Zod |

---

## Extension Points

### Adding a New A2UI Component

1. Add type to `src/lib/protocol/schema.ts`
2. Add renderer in `src/components/renderer/A2UIRenderer.tsx`
3. Add exporter in `src/lib/eject/exportA2UI.ts`
4. Add tests

### Adding a New AI Provider

1. Add detection logic in `src/lib/ai/factory.ts`
2. Add models to `src/lib/ai/model-registry.ts`
3. Add tests

### Adding a New Tool

1. Define tool in `src/lib/ai/tools.ts`
2. Register in `/api/chat` route
3. Handle client-side in DetectiveWorkspace
4. Add tests

---

*Last updated: 2026-02-01*
