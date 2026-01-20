# Track Specification: tool-driven-generation

#### Overview
This track completes Epic 2 by formalizing tool-driven UI generation. It aligns the `generate_ui` tool with A2UI component output, ensures streaming UI message parts are processed correctly on the client, and adds hard-boiled error handling.

#### Functional Requirements
- **FR1: Tool Definition & Validation**
    - Define `generate_ui` with a root object input schema and Zod validation for A2UI components.
    - Server tool execution returns validated component output.
- **FR2: Client State Synchronization**
    - Parse `messages[].parts` tool outputs and update Zustand evidence.
    - Include legacy `toolInvocations` fallback for older payloads.
- **FR3: Contextual Updates**
    - Support iterative updates to current evidence using conversational context.
- **FR4: In-Character Error Handling**
    - Surface validation or tool failures with noir-themed messaging.

#### Non-Functional Requirements
- **Reliability:** Tool outputs must be schema-validated before UI rendering.
- **Streaming:** UI updates arrive via `toUIMessageStreamResponse` with minimal latency.
- **Compatibility:** Works with AI SDK v6 message parts.

#### Acceptance Criteria
- [ ] `generate_ui` tool input is a root object and output is a validated A2UI component.
- [ ] Client updates evidence from tool output parts and ignores invalid payloads.
- [ ] Contextual update path is covered by tests.
- [ ] Error states render noir-themed fallbacks without breaking UI.

#### Out of Scope
- Full visual editor for A2UI JSON.
- Sandboxed execution of arbitrary ejected code.
