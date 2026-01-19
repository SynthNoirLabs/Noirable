# Implementation Plan - Build the synthNoirUI Foundation

## Phase 1: Project Scaffolding & Configuration
- [x] Task: Initialize Next.js Project 01d3d48
    - [ ] Sub-task: Run `create-next-app` with TypeScript, Tailwind, ESLint.
    - [ ] Sub-task: Clean up default boilerplate code.
- [ ] Task: Configure Testing Environment (TDD Setup)
    - [ ] Sub-task: Install Vitest/Jest and React Testing Library.
    - [ ] Sub-task: Create a "Hello World" test to verify the harness.
    - [ ] Sub-task: Configure test script in `package.json`.
- [ ] Task: Implement Noir Design System
    - [ ] Sub-task: Configure Tailwind theme (colors: noir-black, paper-white, alert-amber).
    - [ ] Sub-task: Add "Special Elite" and "Inter" fonts via `next/font`.
    - [ ] Sub-task: Create global CSS for paper textures and venetian blind effects.
- [ ] Task: Conductor - User Manual Verification 'Project Scaffolding & Configuration' (Protocol in workflow.md)

## Phase 2: A2UI Protocol Definition (Logic)
- [ ] Task: Define A2UI Schema with Zod
    - [ ] Sub-task: Create test file `schema.test.ts` with valid/invalid JSON samples.
    - [ ] Sub-task: Run tests (expect fail).
    - [ ] Sub-task: Implement Zod schema for `TextComponent` and `CardComponent`.
    - [ ] Sub-task: Export TypeScript types from Zod schema.
- [ ] Task: Conductor - User Manual Verification 'A2UI Protocol Definition (Logic)' (Protocol in workflow.md)

## Phase 3: Core UI Components (TDD)
- [ ] Task: Implement Typewriter Text Component
    - [ ] Sub-task: Create `TypewriterText.test.tsx` (Snapshot & Prop tests).
    - [ ] Sub-task: Run tests (expect fail).
    - [ ] Sub-task: Implement `TypewriterText` component with monospaced font and typing animation.
- [ ] Task: Implement Dossier Card Component
    - [ ] Sub-task: Create `DossierCard.test.tsx` (Snapshot & Layout tests).
    - [ ] Sub-task: Run tests (expect fail).
    - [ ] Sub-task: Implement `DossierCard` with shadow, border, and paper texture.
- [ ] Task: Implement Split-Pane "Detective's Desk" Layout
    - [ ] Sub-task: Create `DeskLayout.test.tsx` (Layout structure tests).
    - [ ] Sub-task: Run tests (expect fail).
    - [ ] Sub-task: Implement `DeskLayout` with resizable panes (JSON vs Preview).
- [ ] Task: Conductor - User Manual Verification 'Core UI Components (TDD)' (Protocol in workflow.md)

## Phase 4: A2UI Renderer Engine (TDD)
- [ ] Task: Implement A2UI Renderer
    - [ ] Sub-task: Create `A2UIRenderer.test.tsx` (Mock JSON -> Component verify).
    - [ ] Sub-task: Run tests (expect fail).
    - [ ] Sub-task: Implement `A2UIRenderer` component that maps JSON types to React components.
    - [ ] Sub-task: Implement "REDACTED" fallback for unknown types.
- [ ] Task: Integrate Editor & Preview
    - [ ] Sub-task: Create integration test for Editor input -> Renderer update.
    - [ ] Sub-task: Connect a simple Textarea (JSON Editor) to the `A2UIRenderer`.
- [ ] Task: Conductor - User Manual Verification 'A2UI Renderer Engine (TDD)' (Protocol in workflow.md)
