# A2UI Protocol Reference

> Declarative JSON protocol for AI-generated UI components.

## Overview

A2UI (AI-to-UI) is a schema-validated JSON protocol that allows AI models to generate UI components without executing arbitrary code. All components are validated against Zod schemas before rendering.

## Component Types

### Layout Components

| Type | Description | Children |
|------|-------------|----------|
| `container` | Vertical stack container | Yes |
| `row` | Horizontal flex row | Yes |
| `column` | Vertical flex column | Yes |
| `grid` | CSS grid (2-4 columns) | Yes |
| `tabs` | Tabbed container | Tab items |

### Content Components

| Type | Description | Key Props |
|------|-------------|-----------|
| `text` | Inline text | `content`, `priority` |
| `heading` | Section heading (h1-h4) | `text`, `level` |
| `paragraph` | Block paragraph | `text` |
| `callout` | Highlighted message | `content`, `priority` |
| `badge` | Status badge | `label`, `variant` |
| `divider` | Horizontal separator | `label` (optional) |
| `list` | Ordered/unordered list | `items`, `ordered` |
| `table` | Data table | `columns`, `rows` |
| `stat` | Statistic display | `label`, `value`, `helper` |
| `card` | Evidence card | `title`, `description`, `status` |
| `image` | Image (src or prompt) | `src`/`prompt`, `alt` |

### Form Components

| Type | Description | Key Props |
|------|-------------|-----------|
| `input` | Text input field | `label`, `placeholder`, `value` |
| `textarea` | Multi-line input | `label`, `placeholder`, `rows` |
| `select` | Dropdown select | `label`, `options`, `value` |
| `checkbox` | Checkbox toggle | `label`, `checked` |
| `button` | Action button | `label`, `variant` |

---

## Style System

All components accept an optional `style` object:

```typescript
{
  padding: "none" | "xs" | "sm" | "md" | "lg" | "xl",
  gap: "none" | "xs" | "sm" | "md" | "lg" | "xl",
  align: "start" | "center" | "end" | "stretch",
  width: "auto" | "full" | "1/2" | "1/3" | "2/3",
  variant: "primary" | "secondary" | "ghost" | "danger",
  className: string  // Custom Tailwind classes
}
```

## Token Values

### Spacing Tokens

| Token | CSS Value |
|-------|-----------|
| `none` | 0 |
| `xs` | 0.25rem |
| `sm` | 0.5rem |
| `md` | 1rem |
| `lg` | 1.5rem |
| `xl` | 2rem |

### Priority Tokens

| Token | Usage |
|-------|-------|
| `low` | De-emphasized content |
| `normal` | Default content |
| `high` | Important content |
| `critical` | Urgent/error content |

### Variant Tokens

| Token | Usage |
|-------|-------|
| `primary` | Primary actions |
| `secondary` | Secondary actions |
| `ghost` | Subtle/tertiary |
| `danger` | Destructive actions |

---

## Component Schemas

### Container

```json
{
  "type": "container",
  "style": { "padding": "md", "gap": "sm" },
  "children": [...]
}
```

### Row

```json
{
  "type": "row",
  "style": { "gap": "md", "align": "center" },
  "children": [...]
}
```

### Grid

```json
{
  "type": "grid",
  "columns": "3",
  "style": { "gap": "md" },
  "children": [...]
}
```

### Tabs

```json
{
  "type": "tabs",
  "activeIndex": 0,
  "tabs": [
    { "label": "Tab 1", "content": {...} },
    { "label": "Tab 2", "content": {...} }
  ]
}
```

### Heading

```json
{
  "type": "heading",
  "text": "Case #42",
  "level": 2
}
```

### Text

```json
{
  "type": "text",
  "content": "The suspect was last seen...",
  "priority": "normal"
}
```

### Callout

```json
{
  "type": "callout",
  "content": "Warning: Evidence may be compromised",
  "priority": "high"
}
```

### Badge

```json
{
  "type": "badge",
  "label": "Active",
  "variant": "primary"
}
```

### List

```json
{
  "type": "list",
  "items": ["Item 1", "Item 2", "Item 3"],
  "ordered": false
}
```

### Table

```json
{
  "type": "table",
  "columns": ["Name", "Status", "Date"],
  "rows": [
    ["John Doe", "Active", "2026-01-15"],
    ["Jane Smith", "Archived", "2026-01-10"]
  ]
}
```

### Stat

```json
{
  "type": "stat",
  "label": "Open Cases",
  "value": "42",
  "helper": "+5 this week"
}
```

### Card

```json
{
  "type": "card",
  "title": "Suspect Profile",
  "description": "Last known location: Downtown",
  "status": "active"
}
```

Card status values: `active`, `archived`, `missing`, `redacted`

### Image

```json
// With URL
{
  "type": "image",
  "src": "/api/images/abc123",
  "alt": "Crime scene photo"
}

// With generation prompt (input only)
{
  "type": "image",
  "prompt": "A noir detective's desk with scattered papers",
  "alt": "Detective's desk"
}
```

### Input

```json
{
  "type": "input",
  "label": "Suspect Name",
  "placeholder": "Enter name...",
  "value": ""
}
```

### Textarea

```json
{
  "type": "textarea",
  "label": "Notes",
  "placeholder": "Enter observations...",
  "rows": 4
}
```

### Select

```json
{
  "type": "select",
  "label": "Case Status",
  "options": ["Open", "Closed", "Pending"],
  "value": "Open"
}
```

### Checkbox

```json
{
  "type": "checkbox",
  "label": "Mark as urgent",
  "checked": false
}
```

### Button

```json
{
  "type": "button",
  "label": "Submit Report",
  "variant": "primary"
}
```

---

## Complete Example

```json
{
  "type": "container",
  "style": { "padding": "md", "gap": "md" },
  "children": [
    {
      "type": "heading",
      "text": "Suspect Dossier",
      "level": 1
    },
    {
      "type": "row",
      "style": { "gap": "lg" },
      "children": [
        {
          "type": "image",
          "prompt": "Noir mugshot silhouette",
          "alt": "Suspect photo"
        },
        {
          "type": "column",
          "style": { "gap": "sm" },
          "children": [
            { "type": "stat", "label": "Name", "value": "John Doe" },
            { "type": "stat", "label": "Age", "value": "42" },
            { "type": "badge", "label": "Wanted", "variant": "danger" }
          ]
        }
      ]
    },
    {
      "type": "callout",
      "content": "Subject considered armed and dangerous",
      "priority": "critical"
    },
    {
      "type": "table",
      "columns": ["Date", "Location", "Activity"],
      "rows": [
        ["2026-01-15", "Downtown", "Suspicious meeting"],
        ["2026-01-14", "Harbor", "Package exchange"]
      ]
    }
  ]
}
```

---

## Validation

All A2UI payloads are validated using Zod schemas defined in `src/lib/protocol/schema.ts`.

### Input vs Output Schemas

- **Input Schema (`a2uiInputSchema`):** Accepts `prompt` for images, runs normalization
- **Output Schema (`a2uiSchema`):** Requires `src` for images, strict validation

### Normalization

The `normalizeA2UI()` function handles common LLM output variations:
- Converts `text` to `content` for text/callout components
- Converts `text`/`content` to `label` for badges
- Defaults image `alt` to prompt if not provided

### Error Handling

Invalid components render as a "REDACTED" placeholder to maintain the noir theme without breaking the UI.

---

*Schema source: `src/lib/protocol/schema.ts`*
