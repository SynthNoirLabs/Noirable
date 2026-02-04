# A2UI Protocol v0.9 (Draft) - Reference

> This is a local copy of the A2UI v0.9 specification for reference.
> Source: https://a2ui.org/specification/v0.9-a2ui/
> Last fetched: 2026-02-01

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

*This document is for reference. For the authoritative spec, see: https://a2ui.org/specification/v0.9-a2ui/*
