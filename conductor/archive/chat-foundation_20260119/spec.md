# Track Specification: chat-foundation_20260119

#### Overview
This track implements the foundational AI Chat interface for **synthNoirUI**. It establishes the communication bridge between the user and the system using the Vercel AI SDK, sets the thematic tone via a specialized System Prompt, and ensures robust multi-provider authentication.

#### Functional Requirements
- **FR1: Vercel AI SDK Integration:** Setup the core chat API route (`/api/chat`) and client hooks (`useChat`).
- **FR2: Noir Chat Sidebar:**
    - Typewriter animation for incoming messages.
    - Interrogation/Logbook styling for inputs.
    - Configurable UI toggles for simple effects (e.g., sound on/off, animation speed).
- **FR3: Hybrid Auth Factory:** 
    - A server-side provider factory that checks `~/.local/share/opencode/auth.json` first (supporting Claude Code, Codex, etc.).
    - Fallback support for standard `OPENAI_API_KEY` and `GEMINI_API_KEY`.
- **FR4: The "Narrator-Veteran" Persona:**
    - System prompt combining poetic noir descriptions ("Noir Narrator") with cynical, hard-boiled brevity ("Weary Veteran").
    - Maintains the "A2UI" protocol as the "evidence" being processed.

#### Non-Functional Requirements
- **Thematic Consistency:** All UI elements must strictly adhere to the established Noir palette and typography.
- **Latency:** Streamed responses must begin within 1s to maintain the "Typewriter" illusion.

#### Acceptance Criteria
- [ ] Chat sidebar is visible and functional on the desktop workspace.
- [ ] AI responses appear with a typewriter effect.
- [ ] The system correctly identifies and uses the `opencode` auth config if present.
- [ ] The AI persona responds in character, describing UI generation as "gathering evidence" or "writing the case file."

#### Out of Scope
- Implementation of actual tool-calling (`generate_ui`) — this is reserved for Epic 2.
- Mobile responsiveness (Desktop-only focus).
