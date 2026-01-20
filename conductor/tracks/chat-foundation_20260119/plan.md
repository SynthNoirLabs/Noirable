# Implementation Plan: chat-foundation_20260119

#### Phase 1: Environment & Auth Scaffolding
- [ ] Task: Implement Multi-provider Auth Factory
    - [ ] Write tests for `getProvider` to check `auth.json`, Env vars, and fallback logic.
    - [ ] Implement `getProvider` in `src/lib/ai/factory.ts`.
- [ ] Task: Create Chat API Route
    - [ ] Write tests for `POST /api/chat` (mocking the AI SDK response).
    - [ ] Implement the route handler in `src/app/api/chat/route.ts` using the Auth Factory.
- [ ] Task: Conductor - User Manual Verification 'Environment & Auth Scaffolding' (Protocol in workflow.md)

#### Phase 2: Core Chat UI (Noir Style)
- [ ] Task: Implement Noir Chat Sidebar Component
    - [ ] Write tests for `ChatSidebar.tsx` (Prop rendering, loading states).
    - [ ] Implement the UI with "Logbook" styling and Framer Motion integration.
- [ ] Task: Implement Typewriter Animation Hook/Component
    - [ ] Write tests for character-by-character rendering logic.
    - [ ] Implement `TypewriterText` component for AI messages.
- [ ] Task: Integrate Sidebar into Detective Workspace
    - [ ] Write integration test for the split-pane layout with Sidebar.
    - [ ] Add `ChatSidebar` to `DetectiveWorkspace.tsx`.
- [ ] Task: Conductor - User Manual Verification 'Core Chat UI (Noir Style)' (Protocol in workflow.md)

#### Phase 3: Persona & Polish
- [ ] Task: Define System Prompt (Narrator-Veteran)
    - [ ] Write tests to verify prompt inclusion in the API payload.
    - [ ] Implement `SYSTEM_PROMPT` in `src/lib/ai/prompts.ts`.
- [ ] Task: Implement Configurable UI Toggles
    - [ ] Write tests for the configuration store/state.
    - [ ] Add simple toggles (e.g., animation speed) to the Sidebar or a settings menu.
- [ ] Task: Conductor - User Manual Verification 'Persona & Polish' (Protocol in workflow.md)
