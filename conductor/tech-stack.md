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
-   **AI SDK:** Vercel AI SDK v6 (streaming via `toUIMessageStreamResponse`)
-   **LLM Provider:** Flexible (OpenAI, Anthropic, Gemini, or local proxies via `OPENAI_BASE_URL`)
-   **Authentication:** Hybrid factory (env vars + `~/.local/share/opencode/auth.json`)
-   **Schema Validation:** Zod v4 (A2UI protocol enforcement)
-   **Protocol:** Custom A2UI-inspired JSON schema (tool inputs must be root objects)

## State & Ejection
-   **State Management:** Zustand (Global editor state)
-   **Code formatting:** Prettier (for formatting ejected code)
-   **Sandboxing (Optional):** Sandpack (if we decide to run the ejected code live later)

## Development Tools
-   **Linting:** ESLint
-   **Formatting:** Prettier
-   **Package Manager:** pnpm
