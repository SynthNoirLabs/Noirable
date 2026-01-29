# synthNoirUI Product Specification

> A noir-themed AI evidence board where natural language becomes visual UI.

## Vision

**synthNoirUI (bmad)** is a hybrid UI generation platform combining:

- **Draft Mode (A2UI):** Rapid, secure, declarative JSON protocol for UI drafting
- **Eject Mode:** One-click export to editable React + Tailwind code

The system features a "Detective's Desk" workspace where users describe UI in natural language and watch it materialize as visual "evidence" on a noir-themed board.

## Target Audience

Frontend developers exploring AI-assisted UI generation. This is an experimental/personal project, not intended for commercial production.

## Core Goals

1. **Rapid Exploration:** Instantly visualize UI concepts using A2UI JSON without writing boilerplate
2. **Seamless Ejection:** One-click transform from abstract A2UI to concrete React components
3. **Immersive Experience:** Maintain noir detective theme throughout the interaction

---

## Features

### Implemented (v1.0)

| Feature | Description | Status |
|---------|-------------|--------|
| **AI Chat Interface** | Natural language commands with noir detective persona | Done |
| **A2UI Protocol** | 20 component types with Zod validation | Done |
| **Evidence Board** | History of generated UI components | Done |
| **Split-Pane Workspace** | Live JSON editor + rendered preview | Done |
| **Multi-Provider Support** | OpenAI, Anthropic, Google, OpenAI-compatible | Done |
| **Image Generation** | AI-generated noir-styled images via prompts | Done |
| **Eject to Code** | Export to React + Tailwind components | Done |
| **Model Selector** | Switch between 28 registered models | Done |
| **Print View** | Print-friendly evidence export | Done |
| **Resizable Layout** | Drag-to-resize panes | Done |
| **Form Handlers** | Input/button components with actions | Done |
| **Persistent Storage** | Evidence saved to localStorage | Done |
| **Multi-File Export** | Generate component directories | Done |

### Implemented (v1.1)

| Feature | Description | Status |
|---------|-------------|--------|
| **Undo/Redo** | State history with Cmd+Z/Cmd+Shift+Z | Done |
| **Keyboard Shortcuts** | Cmd+Enter (send), Cmd+E (eject), Cmd+Z (undo) | Done |
| **Evidence Search** | Filter evidence history by label/status | Done |
| **Template Library** | 8 pre-built A2UI templates (forms, dashboards, cards) | Done |
| **Live Sandbox** | Sandpack integration for live code preview | Done |
| **Prompt History** | Save and recall previous prompts | Done |
| **Export to File** | Download .tsx files or .zip archives | Done |
| **Loading States** | Skeleton UI during AI generation | Done |
| **Error Recovery** | "Retry" button with last failed prompt context | Done |

### Roadmap

| Feature | Priority | Status |
|---------|----------|--------|
| AI Fine-Tuning | Medium | Proposed (see docs/proposals/ai-fine-tuning.md) |
| Collaborative editing | Low | Future |

---

## Design Guidelines

### The Detective Persona

| Aspect | Guideline |
|--------|-----------|
| **Voice** | Hard-boiled, laconic, punchy. Short sentences. |
| **Style** | Cynical but professional. Noir scene-setting. |
| **Engagement** | Acknowledge requests with detective's brevity |
| **Errors** | "The lead went cold" - stay in character |

**Example responses:**
- "The rain is coming down in sheets. I've pulled the data you're looking for. It's not pretty."
- "Case file assembled. The evidence speaks for itself."
- "REDACTED. Some things are better left buried."

### Visual Identity

| Element | Specification |
|---------|---------------|
| **Theme** | "Detective Noir" meets "Synth" |
| **Palette** | Muted grays, deep blacks, sepia, occasional neon accents |
| **Atmosphere** | Moody low-key lighting, heavy shadows, silhouettes |
| **Typography** | Typewriter serif (headers) + clean sans-serif (UI/code) |
| **Components** | Items on a detective's desk: dossiers, photographs, evidence bags |
| **Effects** | CRT scanlines for AI text, venetian blind light patterns |

### A2UI Protocol Standards

| Principle | Implementation |
|-----------|----------------|
| **Semantic Focus** | Use `priority: "critical"` not `color: "red"` |
| **Strict Schema** | All payloads validate against Zod schema |
| **Graceful Failure** | Unknown types render as "REDACTED" placeholder |
| **Determinism** | Same input = identical output |

### Code Generation Standards

| Aspect | Requirement |
|--------|-------------|
| **Structure** | Self-contained React files with "Case File" header |
| **Naming** | Thematic but readable (`SuspectList`, `DossierHeader`) |
| **Output** | Clean, valid React + Tailwind CSS |
| **Safety** | Inert code, no remote execution |

---

## Original Requirements (PRD v1.0)

### Functional Requirements

| ID | Requirement | Status |
|----|-------------|--------|
| FR1 | Chat input for natural language commands | Done |
| FR2 | AI generation of valid A2UI JSON payloads | Done |
| FR3 | "Update" commands to modify current state | Done |
| FR4 | AI persona adheres to "Hard-boiled Detective" | Done |
| FR5 | Chat history with state persistence | Done |

### Non-Functional Requirements

| ID | Requirement | Status |
|----|-------------|--------|
| NFR1 | < 3s latency for text generation | Met |
| NFR2 | Strict adherence to Zod schema | Met |
| NFR3 | Thematic error fallbacks | Met |

### Epic Completion Status

#### Epic 1: Foundation & Persona

| Story | Description | Status |
|-------|-------------|--------|
| 1.1 | Setup Vercel AI SDK Core | Done |
| 1.2 | Implement Chat Sidebar | Done |
| 1.3 | Define System Prompt (Noir Persona) | Done |
| 1.4 | Multi-provider API Key Support | Done |

#### Epic 2: Tool-Driven Generation

| Story | Description | Status |
|-------|-------------|--------|
| 2.1 | Define `generate_ui` Tool using Zod | Done |
| 2.2 | Connect Tool execution to Zustand State | Done |
| 2.3 | Implement Contextual Updates | Done |
| 2.4 | In-Character Error Handling | Done |

---

## Success Metrics

| Metric | Target | Current |
|--------|--------|---------|
| Core functionality | 100% | 100% |
| Test coverage | >80% | ~85% |
| CI gate passing | Yes | Yes (after prettier fix) |
| E2E smoke test | Pass | Pass |

---

*Last updated: 2026-01-29*
