# Implementation Plan: chat-foundation_20260119

#### Phase 1: Environment & Auth Scaffolding [checkpoint: e1012ec]
- [x] Task: Implement Multi-provider Auth Factory e9f0df9
    - [ ] Write tests for `getProvider` to check `auth.json`, Env vars, and fallback logic.
    - [ ] Implement `getProvider` in `src/lib/ai/factory.ts`.
- [x] Task: Create Chat API Route 0bd9db9
    - [ ] Write tests for `POST /api/chat` (mocking the AI SDK response).
    - [ ] Implement the route handler in `src/app/api/chat/route.ts` using the Auth Factory.
- [x] Task: Conductor - User Manual Verification 'Environment & Auth Scaffolding' (Protocol in workflow.md)

#### Phase 2: Core Chat UI (Noir Style) [checkpoint: dd7d055]
- [x] Task: Implement Noir Chat Sidebar Component 1558f8d
    - [x] Write tests for `ChatSidebar.tsx` (Prop rendering, loading states).
    - [x] Implement the UI with "Logbook" styling and Framer Motion integration.
- [x] Task: Implement Typewriter Animation Hook/Component
    - [x] Write tests for character-by-character rendering logic.
    - [x] Implement `TypewriterText` component for AI messages.
- [x] Task: Integrate Sidebar into Detective Workspace 18d3eca
    - [x] Write integration test for the split-pane layout with Sidebar.
    - [x] Add `ChatSidebar` to `DetectiveWorkspace.tsx`.
- [x] Task: Conductor - User Manual Verification 'Core Chat UI (Noir Style)' (Protocol in workflow.md)

#### Phase 3: Persona & Polish
- [x] Task: Define System Prompt (Narrator-Veteran)
    - [ ] Write tests to verify prompt inclusion in the API payload.
    - [ ] Implement `SYSTEM_PROMPT` in `src/lib/ai/prompts.ts`.
- [ ] Task: Implement Configurable UI Toggles
    - [ ] Write tests for the configuration store/state.
    - [ ] Add simple toggles (e.g., animation speed) to the Sidebar or a settings menu.
- [ ] Task: Conductor - User Manual Verification 'Persona & Polish' (Protocol in workflow.md)
