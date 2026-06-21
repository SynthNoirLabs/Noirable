/**
 * Pure, dependency-free primitives shared by the legacy protocol schema
 * (`schema.ts`) AND its normalization layer (`normalize.ts`). Extracted into a
 * LEAF module (no imports) so `normalize.ts` can use them without importing
 * `schema.ts` — which would create a cycle, since `schema.ts`'s `z.preprocess`
 * imports `normalizeA2UI` back. The dependency graph stays one-way:
 *
 *   legacy-constants.ts  ←  normalize.ts  ←  schema.ts
 *
 * `schema.ts` re-exports these so existing `@/lib/protocol/schema` imports keep
 * working unchanged.
 */

/**
 * Every legacy component `type` the generation path supports. The single source
 * of truth: interpolated into the tool description, every persona's Core
 * Directives, and the playbook (manually mirrored). Never hand-write a type
 * list elsewhere. A model that emits a type NOT in this list produces a node
 * the discriminated union rejects and the surface drops it (the kanban/dashboard
 * vanishing bug was exactly that failure).
 */
export const SUPPORTED_LEGACY_TYPES = [
  "container",
  "row",
  "column",
  "grid",
  "card",
  "tabs",
  "heading",
  "paragraph",
  "text",
  "callout",
  "badge",
  "divider",
  "list",
  "table",
  "stat",
  "image",
  "video",
  "input",
  "textarea",
  "select",
  "checkbox",
  "icon",
  "dateTimeInput",
  "reveal",
  "stateImage",
  "button",
  "kanbanBoard",
  "dataDashboard",
  "relationshipGraph",
  "audio",
  "custom",
] as const;

/** Comma-joined form for prompt interpolation. */
export const SUPPORTED_LEGACY_TYPE_LIST = SUPPORTED_LEGACY_TYPES.join(", ");

/**
 * True for a `{ path }` / `{ call }` binding object (NOT a plain value). Display
 * fields that accept a live data binding use this to leave the object intact for
 * the renderer's resolver instead of `String()`-ing it to "[object Object]".
 */
export function isBindingObject(value: unknown): boolean {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const v = value as Record<string, unknown>;
  return typeof v.path === "string" || typeof v.call === "string";
}
