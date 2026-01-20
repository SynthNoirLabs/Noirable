# A2UI Expanded Schema Design

## Goal
Expand A2UI from simple `text`/`card` nodes into a tree-based component system that can represent full pages with layouts, content, and form inputs, while keeping styling safe and consistent with a token system plus an optional `className` escape hatch.

## Scope
**In scope:** layout primitives, content nodes, form inputs, tokenized style props, renderer support, prompt/tool guidance, and tests.  
**Out of scope:** data binding, events, multi-surface updates, and full A2UI catalog parity.

## Schema Shape (tree + hybrid styling)
- Root is a single component (usually `container`).
- Layout nodes accept `children: A2UIComponent[]`.
- All nodes can optionally include `className` for one-off tweaks.

### Component Types
**Layout**
- `container`: `children`, `style`
- `row`: `children`, `style` (gap, align, wrap)
- `column`: `children`, `style`
- `grid`: `children`, `style` (columns, gap)

**Content**
- `heading`: `text`, `level` (1–4), `style`
- `paragraph`: `text`, `style`
- `image`: `src`, `alt`, `style` (width, radius)

**Inputs**
- `input`: `label`, `placeholder`, `value?`, `variant`, `style`
- `textarea`: `label`, `placeholder`, `value?`, `rows?`, `variant`, `style`
- `select`: `label`, `options[]`, `value?`, `variant`, `style`
- `checkbox`: `label`, `checked?`
- `button`: `label`, `variant`

### Style Tokens
- `spacing`: `none | xs | sm | md | lg | xl`
- `align`: `start | center | end | stretch`
- `width`: `auto | full | 1/2 | 1/3 | 2/3`
- `variant`: `primary | secondary | ghost | danger`
- Optional `className` for overrides

## Renderer Strategy
- Implement recursive `renderComponent(node)` that maps types to semantic tags.
- Layout nodes render `<div>` wrappers with token → Tailwind mapping.
- Content nodes render `h1–h4`, `p`, `img`.
- Inputs render styled noir form controls with variants.
- Keep existing “REDACTED” placeholder for validation failures.

## Prompt & Tool Guidance
- Tool output must return a single root component with nested `children`.
- Prefer layout nodes for structure; avoid overusing `className`.
- Inputs must include labels and placeholders where relevant.

## Testing Strategy
- Schema tests for each new type and nested trees.
- Renderer tests for layout wrappers, headings, inputs, and grid/row/column.
- Tool tests to validate expanded schema payloads.
- Integration test: tool output renders a full mini-form layout.
