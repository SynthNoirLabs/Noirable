# Story 1.3: Define System Prompt (Hard-boiled Persona)

## Context
As a user, I want the AI to speak like a Noir detective, so that I feel immersed.

## Acceptance Criteria
- [x] Create `src/lib/ai/prompts.ts` to hold the system prompt.
- [x] Define the "Hard-boiled Detective" persona:
    - Tone: Cynical, professional, atmospheric.
    - Style: Short sentences, metaphor-heavy.
    - Constraints: Never break character.
- [x] Inject this prompt into the `/api/chat` route (DetectiveBrain).

## Technical Notes
- Template string allowing injection of current context (if needed later).
- Versioning the prompt (v1).

## Test Plan
- Unit test: Verify prompt export exists.
- Manual verification: Chat with the bot and check if it sounds cool.
