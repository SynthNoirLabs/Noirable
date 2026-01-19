# synthNoirUI: AI Chat Integration PRD (v1.0)

## 1. Goals and Background Context
### Goals
- Enable natural language commands to generate and iterate on A2UI JSON.
- Maintain high immersion through a "Detective Noir" AI persona.
- Provide a real-time "Evidence Board" (Preview) that reacts to chat commands.

### Background Context
The project has a functional foundation with a Noir-styled split-pane workspace. We are now adding the "Brain"—a Chat Interface that allows developers to describe UI elements instead of writing JSON manually.

### Change Log
| Date | Version | Description | Author |
| :--- | :--- | :--- | :--- |
| 2026-01-18 | 1.0 | Initial PRD for AI Chat Integration | PM (John) |

## 2. Requirements
### Functional
- **FR1:** Chat Input for natural language commands.
- **FR2:** AI generation of valid A2UI JSON payloads.
- **FR3:** "Update" commands to modify current state based on conversational context.
- **FR4:** AI persona adheres to "Hard-boiled Detective" style.
- **FR5:** Integrated Chat History with state persistence for debugging.

### Non-Functional
- **NFR1:** < 3s latency for text generation.
- **NFR2:** Strict adherence to `src/lib/protocol/schema.ts` (Zod).
- **NFR3:** Handle LLM errors with thematic "The lead went cold" fallbacks.

## 3. User Interface Design Goals
- **Vision:** Minimalist "Evidence Room" vibe.
- **Screen:** Desktop-focused Split-Pane with a Chat Sidebar.
- **Branding:** Muted tones, sepia, CRT scanline effects for AI text.

## 4. Technical Assumptions
- **Framework:** Next.js (App Router), Vercel AI SDK.
- **State:** Zustand for managing the current A2UI JSON artifact.
- **LLM:** GPT-4o / Claude 3.5 Sonnet with Tool Calling.
- **Auth:** Compatibility with Agent-based CLI environments (Gemini CLI, etc.).

## 5. Roadmap & Epics
### Epic 1: Foundation & Persona
- **Story 1.1:** Setup Vercel AI SDK Core.
- **Story 1.2:** Implement Chat Sidebar (Desktop-only).
- **Story 1.3:** Define System Prompt (Hard-boiled Persona).
- **Story 1.4:** Multi-provider API Key Support.

### Epic 2: Tool-Driven Generation
- **Story 2.1:** Define `generate_ui` Tool using Zod.
- **Story 2.2:** Connect Tool execution to Zustand State.
- **Story 2.3:** Implement Contextual Updates (State Compression).
- **Story 2.4:** In-Character Error Handling.
