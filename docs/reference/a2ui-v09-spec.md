# A2UI Protocol v0.9 (Draft) - Reference

> This is a local copy of the A2UI v0.9 specification for reference.
> Source: https://a2ui.org/specification/v0.9-a2ui/
> (Canonical spec: https://github.com/google/A2UI/blob/main/specification/0.9/docs/a2ui_protocol.md)
> Last fetched: 2026-02-01

> **Implementation note:** The message structures below follow the upstream
> spec, which wraps each message in a named-key envelope (e.g.
> `{"createSurface": {...}}`). This repo's stream implementation emits a
> flattened variant instead, with a top-level `type` discriminator
> (e.g. `{"type": "createSurface", "surfaceId": "...", "catalogId": "standard"}`)
> and a `catalogId` of `"standard"`. See `src/lib/a2ui/schema/messages.ts` and
> `src/app/api/a2ui/stream/route.ts` for the authoritative in-repo shape.

---

## Overview

**Version:** 0.9
**Status:** Draft
**Created:** Nov 20, 2025
**Last Updated:** Dec 3, 2025

The A2UI Protocol is designed for dynamically rendering user interfaces from a stream of JSON objects sent from a server (Agent). Its core philosophy emphasizes a clean separation of UI structure and application data, enabling progressive rendering as the client processes each message.

## Message Types

Communication occurs via a stream of JSON objects. The server-to-client protocol defines four message types:

| Message Type | Purpose |
|--------------|---------|
| `createSurface` | Signals the client to create a new surface and begin rendering it |
| `updateComponents` | Provides component definitions to add/update in a surface |
| `updateDataModel` | Provides new data to insert/replace in a surface's data model |
| `deleteSurface` | Explicitly removes a surface and its contents from the UI |

## Message Structures

### createSurface

```json
{
  "createSurface": {
    "surfaceId": "user_profile_card",
    "catalogId": "https://a2ui.org/specification/v0_9/standard_catalog.json",
    "theme": {
      "primaryColor": "#00BFFF"
    },
    "sendDataModel": true
  }
}
```

**Properties:**
- `surfaceId` (string, required): Unique identifier for the UI surface
- `catalogId` (string, required): Unique identifier for the catalog (components/functions)
- `theme` (object, optional): Theme parameters
- `sendDataModel` (boolean, optional): If true, client sends full data model with every message

### updateComponents

```json
{
  "updateComponents": {
    "surfaceId": "user_profile_card",
    "components": [
      {
        "id": "root",
        "component": "Column",
        "children": ["user_name", "user_title"]
      },
      {
        "id": "user_name",
        "component": "Text",
        "text": "John Doe"
      }
    ]
  }
}
```

**Properties:**
- `surfaceId` (string, required): The surface to update
- `components` (array, required): Flat list of component objects with ID references

### updateDataModel

```json
{
  "updateDataModel": {
    "surfaceId": "user_profile_card",
    "path": "/user/name",
    "value": "Jane Doe"
  }
}
```

**Properties:**
- `surfaceId` (string, required): The surface this update applies to
- `path` (string, optional): JSON Pointer to update location (defaults to `/`)
- `value` (any, optional): New value (if omitted, key is removed)

### deleteSurface

```json
{
  "deleteSurface": {
    "surfaceId": "user_profile_card"
  }
}
```

## Component Model

### Component Object Structure

- `id` (ComponentId, required): Unique string identifying this component instance
- `component` (string, required): Component type (e.g., "Text", "Button")
- Additional properties specific to the component type

### Standard Catalog Components (18 total)

#### Layout Components (7)
| Component | Description |
|-----------|-------------|
| `Row` | Horizontal layout container |
| `Column` | Vertical layout container |
| `List` | Scrollable list of items |
| `Card` | Container with elevation/border |
| `Tabs` | Tabbed interface |
| `Divider` | Visual separator line |
| `Modal` | Overlay dialog |

#### Content Components (5)
| Component | Description |
|-----------|-------------|
| `Text` | Display text with optional styling |
| `Image` | Display images from URLs |
| `Icon` | Display icons (Material Icons) |
| `Video` | Video player |
| `AudioPlayer` | Audio player |

#### Input Components (6)
| Component | Description |
|-----------|-------------|
| `Button` | Clickable button with action support |
| `CheckBox` | Boolean toggle |
| `TextField` | Text input field |
| `DateTimeInput` | Date/time picker |
| `ChoicePicker` | Single/multi-select options |
| `Slider` | Numeric range slider |

## Data Binding

### Dynamic Types

Properties that can be bound to data use `Dynamic*` types:
- `DynamicString`: Literal string, `{path: "/..."}`, or function call
- `DynamicNumber`: Literal number, `{path: "/..."}`, or function call
- `DynamicBoolean`: Literal boolean, `{path: "/..."}`, or function call
- `DynamicStringList`: Array of strings or path

### Path Resolution

Uses JSON Pointer (RFC 6901) syntax:
- Absolute paths start with `/` (e.g., `/user/name`)
- Relative paths used in collection scopes

### Two-Way Binding

Input components support two-way binding:
1. Display current value from data model
2. Update data model when user modifies input
3. Optionally sync back to server

## Actions

### Server Actions (Events)

```json
{
  "action": {
    "event": {
      "name": "submit_form",
      "context": {
        "itemId": "123"
      }
    }
  }
}
```

### Local Actions (Function Calls)

```json
{
  "action": {
    "functionCall": {
      "call": "toggleVisibility",
      "args": {
        "targetId": "details-panel"
      }
    }
  }
}
```

## Client-to-Server Messages

### action

```json
{
  "type": "action",
  "surfaceId": "main",
  "sourceComponentId": "submit-btn",
  "actionName": "submit",
  "timestamp": 1706789012345,
  "context": {
    "formValues": { "email": "user@example.com" }
  }
}
```

## Standard Validation Functions

| Function | Description |
|----------|-------------|
| `required` | Value must be non-empty |
| `email` | Value must be valid email format |
| `regex` | Value must match pattern |
| `minLength` | String must have minimum length |
| `maxLength` | String must not exceed length |
| `min` | Number must be >= value |
| `max` | Number must be <= value |

## Transport Options

A2UI is transport-agnostic. Common bindings:
- **A2A (Agent2Agent)**: For agentic systems
- **AG UI**: Agent-User Interaction protocol
- **SSE + JSON RPC**: Standard web integrations
- **WebSockets**: Bidirectional real-time
- **MCP**: Tool outputs or resource subscriptions

## Example Stream (JSONL)

```jsonl
{"createSurface":{"surfaceId":"form","catalogId":"https://a2ui.org/specification/v0_9/standard_catalog.json"}}
{"updateComponents":{"surfaceId":"form","components":[{"id":"root","component":"Column","children":["title","input","submit"]}]}}
{"updateDataModel":{"surfaceId":"form","path":"/user","value":{"name":""}}}
{"deleteSurface":{"surfaceId":"form"}}
```

---

## Conformance in this repo

What the live renderer (`src/components/a2ui/SurfaceRenderer.tsx`, driven by
`A2UIv09Preview`) currently supports:

| Area | Status |
|------|--------|
| **Messages** | All four server messages — `createSurface`, `updateComponents`, `updateDataModel`, `deleteSurface` |
| **Components** | All 18 standard-catalog components (Row, Column, List, Card, Tabs, Divider, Modal, Text, Image, Icon, Video, AudioPlayer, Button, CheckBox, TextField, DateTimeInput, ChoicePicker, Slider) |
| **Data binding** | JSON Pointer (RFC 6901) resolution of `{path}` bindings, scope-aware (relative pointers resolve against the current item) |
| **Function-call bindings** | `{ call, args }` dynamic values evaluated via a built-in registry (`concat`, `uppercase`, `lowercase`, `not`, `eq`, `and`, `or`, `count`); args may be nested `{path}` bindings or function calls (`src/lib/a2ui/binding/functions.ts`) |
| **Template children** | Both static `string[]` and the template form `{ componentId, path }` — the latter expands `componentId` once per array element with a per-item scope (`src/lib/a2ui/binding/template-children.ts`) |
| **Two-way binding** | Input components (TextField, CheckBox, Slider, ChoicePicker, DateTimeInput) write edits back to the data model |
| **Validation** | Catalog `checks` (`required`, `email`, `regex`, `minLength`, `maxLength`, `min`, `max`) enforced at the input layer with inline, touch-gated error messages and `aria-invalid` (`src/lib/a2ui/validation/`) |
| **Actions** | Button `action` dispatch — server `event` posts an `ActionMessage` to `POST /api/a2ui/action` and applies the returned follow-up messages to the surface (plus an `onAction` observer); local `functionCall` supports the built-in `set`/`setValue`/`toggle` client functions |
| **Theme** | String identifiers and v0.9 object themes (`{ primaryColor, backgroundColor, textColor }`) mapped onto CSS variables |

Known deviations / not yet implemented:

- **Wire format:** flat `type` discriminator instead of the upstream named-key envelope (see the implementation note at the top).
- **Back-channel:** the server-action round-trip is a request/response HTTP call (`POST /api/a2ui/action`) with a deterministic demo handler — not a persistent connection, so the agent cannot push unsolicited updates. A live agent would replace that route's handler (or a WebSocket transport would be needed for server-initiated pushes).
- **Function registry** is intentionally a small safe built-in set; arbitrary client functions are not evaluated.

---

*This document is for reference. For the authoritative spec, see: https://a2ui.org/specification/v0.9-a2ui/*
