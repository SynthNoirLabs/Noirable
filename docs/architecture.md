# synthNoirUI: AI Chat Integration Architecture (v1.0)

## 1. Introduction
This document establishes the architectural blueprint for the AI Chat Integration in synthNoirUI. It bridges the gap between the "Detective Desk" UI and the "Detective Brain" AI logic.

### Relationship to Existing Code
This design builds on the established Next.js + Tailwind v4 + Zod foundation. It introduces server-side AI orchestration and client-side state synchronization.

## 2. High Level Architecture
### Technical Summary
The system uses a streaming serverless architecture. The frontend (Next.js) requests a stream from the backend (/api/chat), which orchestrates an LLM call with tool-calling enabled. Results are streamed back to update a client-side Zustand store.

### High Level Diagram
```mermaid
graph TD
    User[User] -->|Chat Message| UI[Chat Interface]
    UI -->|Stream Request| API[Next.js API Route /api/chat]
    API -->|Prompt + History| LLM[LLM Provider]
    LLM -->|Tool Call: generate_ui| API
    API -->|Stream Tool Result| UI
    UI -->|Update State| Store[Zustand Store]
    Store -->|Render| Renderer[A2UI Renderer]
```

## 3. Tech Stack
| Category | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| Framework | Next.js | 16.x | Application Core |
| AI SDK | Vercel AI SDK | 3.x | Streaming & Tools |
| State | Zustand | 5.x | Evidence State |
| Schema | Zod | 3.x | Protocol Validation |
| Auth | Multi-Tier | N/A | CLI/Env Key Discovery |

## 4. Components
### DetectiveBrain (API)
- **Role:** Handles the LLM interaction.
- **Pattern:** Uses Vercel AI SDK `streamText` with tools.
- **Persona:** Injects the "Hard-boiled Detective" system prompt.

### ProviderFactory (Server-only)
- **Role:** Resolves API keys.
- **Hierarchy:** process.env -> local config (~/.config/opencode/auth.json) -> User Headers.

### ChatSidebar (Client)
- **Role:** UI for conversation.
- **Pattern:** Reactive to the Zustand store.

## 5. Core Workflows
### AI UI Generation
1. User types "Make a card".
2. AI calls `generate_ui` tool.
3. System validates JSON via Zod.
4. Valid JSON is sent to client.
5. Zustand state updates.
6. Renderer displays the new component.

## 6. Coding Standards
- **Server-Only:** Auth logic must never be imported in client components.
- **Protocol First:** All UI updates must originate from a valid A2UI JSON artifact.
- **Test-Driven:** Test the `/api/chat` logic with mock LLM responses.
