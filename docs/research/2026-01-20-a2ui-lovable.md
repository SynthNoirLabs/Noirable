# A2UI + Lovable-Style Tools Research (2026-01-20)

## A2UI protocol highlights (official)
- A2UI is a JSON-based streaming UI protocol: the server streams JSON objects and the client parses each message to progressively build or update the UI. citeturn3view0
- The server-to-client envelope defines message types such as `createSurface`, `updateComponents`, `updateDataModel`, `deleteSurface`, and `watchDataModel`. citeturn3view0
- v0.9 is explicitly marked as a draft with a “prompt-first” approach and emphasizes a prompt → generate → validate loop, including validation and correction when JSON is invalid. citeturn3view0
- The component model uses IDs and a catalog of component types; component definitions are sent inside `updateComponents` messages. citeturn3view0

## A2UI project status (GitHub)
- The A2UI repo describes A2UI as an open standard and set of libraries for agent-generated UI using declarative JSON, with renderers on the client side. citeturn3view4
- The project is labeled “Early Stage Public Preview” and notes v0.8 is public preview while specifications and implementations are still evolving. citeturn3view4

## Lovable-style workflow (official docs)
- Lovable positions itself as a full-stack AI development platform that builds production-grade web apps from natural language, generating frontend, backend, database, authentication, and integrations with editable code. citeturn4view0
- Lovable projects live in shared workspaces; each project produces a codebase that can be synced to GitHub and integrated into existing engineering workflows. citeturn4view0
- The documented workflow is: describe what you want, review/iterate, sync code to GitHub, then deploy and govern. citeturn4view3

## Implications for bmad
- **Protocol alignment:** A2UI’s message-based streaming model suggests moving from single-component payloads toward a minimal surface/update model (even if we keep a constrained subset first). citeturn3view0
- **Validation loop:** A2UI’s prompt → generate → validate loop maps well to our tool execution and schema validation, suggesting we should keep validation tight and design a structured retry path. citeturn3view0
- **Eject & ownership:** Lovable’s workflow emphasizes code ownership and GitHub sync; our “eject mode” track should similarly prioritize deterministic code output and export flows. citeturn4view0turn4view3

## Gaps / open questions
- **A2UI version choice:** v0.9 is draft while v0.8 is public preview; we should decide which version to track and document that decision. citeturn3view0turn3view4
- **Catalog scope:** A2UI expects a component catalog; we need to define a compatible subset (or map our current schema to a catalog) before full alignment. citeturn3view0
- **Surface/data model:** A2UI separates component updates from data model updates; we currently do not model data binding explicitly. citeturn3view0
- **Workflow integration:** If we want Lovable-like ownership, we need decisions on where ejected code lives and how GitHub sync should work. citeturn4view0turn4view3
