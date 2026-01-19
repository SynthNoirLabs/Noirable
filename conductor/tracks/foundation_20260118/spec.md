# Specification: Build the synthNoirUI Foundation

## 1. Overview
This track focuses on establishing the core technical and visual foundation of synthNoirUI. We will scaffold the Next.js application, configure the "Detective Noir" design system, and implement the initial A2UI rendering engine with a live "Detective's Desk" split-pane interface.

## 2. Goals
-   **Scaffold Project:** Initialize a robust Next.js + TypeScript + Tailwind CSS repository.
-   **Establish Testing:** Set up a TDD-friendly environment (Vitest/Jest + React Testing Library).
-   **Define Protocol:** Implement the Zod schema for the A2UI protocol.
-   **Create Design System:** Implement the "Noir" theme (Typewriter fonts, shadows, paper textures).
-   **Build Core UI:** Create the "Split Pane" layout and the first set of A2UI components (Typewriter Text, Dossier Card).
-   **Implement Renderer:** Build the engine that transforms A2UI JSON into React components.

## 3. Requirements
-   **Framework:** Next.js (App Router).
-   **Styling:** Tailwind CSS with custom configuration for colors and fonts (Special Elite, Inter).
-   **Testing:** 80% coverage required. All features must be built using TDD.
-   **Protocol:**
    -   Schema must be defined in Zod.
    -   Must support at least `type: "text"` and `type: "card"`.
-   **UI:**
    -   "Detective's Desk" layout: Split view (JSON editor | UI Preview).
    -   Must look "Noir" (Dark mode, shadows, paper texture).

## 4. Out of Scope
-   Full AI integration (Chat UI skeleton only).
-   "Eject" functionality (Next track).
-   Complex components (Charts, Tables).
