# Technology Stack: synthNoirUI

## Frontend Core
-   **Framework:** Next.js (App Router)
-   **Library:** React 19 (RC/Latest)
-   **Language:** TypeScript
-   **Build Tool:** Turbopack (via Next.js)

## Styling & Design
-   **CSS Framework:** Tailwind CSS v4
-   **Animation:** Framer Motion (for the "Noir" shadows and transitions)
-   **Icons:** Lucide React (clean, consistent icons)
-   **Fonts:** Google Fonts (Special Elite for typewriter, Inter for UI)

## AI & Data Protocol
-   **AI SDK:** Vercel AI SDK (for streaming chat and tool calling)
-   **LLM Provider:** OpenAI (GPT-4o) or Anthropic (Claude 3.5 Sonnet)
-   **Schema Validation:** Zod (Strict A2UI protocol enforcement)
-   **Protocol:** Custom A2UI-inspired JSON schema

## State & Ejection
-   **State Management:** Zustand (Global editor state)
-   **Code formatting:** Prettier (for formatting ejected code)
-   **Sandboxing (Optional):** Sandpack (if we decide to run the ejected code live later)

## Development Tools
-   **Linting:** ESLint
-   **Formatting:** Prettier
-   **Package Manager:** pnpm
