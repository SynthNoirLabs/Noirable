/**
 * @deprecated Use A2UI v0.9 protocol instead (src/lib/a2ui/)
 * This schema is maintained for backward compatibility only.
 * New features should use the standard A2UI catalog.
 */

import { z } from "zod";
import {
  SUPPORTED_LEGACY_TYPES,
  SUPPORTED_LEGACY_TYPE_LIST,
  isBindingObject,
} from "./legacy-constants";
import { normalizeA2UI } from "./normalize";

// Re-exported for back-compat: existing `@/lib/protocol/schema` imports of these
// keep working after the constants/normalize split.
export { SUPPORTED_LEGACY_TYPES, SUPPORTED_LEGACY_TYPE_LIST, isBindingObject, normalizeA2UI };

const spacingToken = z.enum(["none", "xs", "sm", "md", "lg", "xl"]);
const alignToken = z.enum(["start", "center", "end", "stretch"]);
const widthToken = z.enum(["auto", "full", "1/2", "1/3", "2/3"]);
const variantToken = z.enum(["primary", "secondary", "ghost", "danger"]);
const priorityToken = z.enum(["low", "normal", "high", "critical"]);

export const styleSchema = z.object({
  padding: spacingToken.optional(),
  gap: spacingToken.optional(),
  align: alignToken.optional(),
  width: widthToken.optional(),
  variant: variantToken.optional(),
  className: z.string().optional(),
});

/**
 * A DATA BINDING object: either a `{ path }` JSON-pointer binding or a
 * `{ call, args? }` function-call. Display fields that may be bound to live
 * state (Text content, Stat value) accept these so the renderer's resolver can
 * read the current value — instead of `String()`-ing the object to the literal
 * "[object Object]". Kept permissive (the resolver/guards do the real work).
 */
export const bindingObjectSchema = z.union([
  z.object({ path: z.string() }).loose(),
  z.object({ call: z.string() }).loose(),
]);

/** A display value that is either a plain string or a live data binding. */
const dynamicStringField = z.union([z.string(), bindingObjectSchema]);

export const textComponentSchema = z.object({
  type: z.literal("text"),
  // Accept a plain string OR a `{ path }`/`functionCall` binding, so a Text can
  // show live state (e.g. an airlock's `/status`). The renderer resolves it.
  content: dynamicStringField,
  priority: priorityToken.default("normal"),
  style: styleSchema.optional(),
});

export const cardComponentSchema = z.object({
  type: z.literal("card"),
  // title/description flow through the adapter's emitText → Text, which resolves
  // them — so a `{ path }`/functionCall binding renders live state.
  title: dynamicStringField,
  description: dynamicStringField.optional(),
  status: z.enum(["active", "archived", "missing", "redacted"]).default("active"),
  style: styleSchema.optional(),
});

const headingSchema = z.object({
  type: z.literal("heading"),
  // Resolved downstream (adapter emitText → Text), so a binding shows live state.
  text: dynamicStringField,
  level: z.number().int().min(1).max(4).default(2),
  style: styleSchema.optional(),
});

const paragraphSchema = z.object({
  type: z.literal("paragraph"),
  text: dynamicStringField,
  style: styleSchema.optional(),
});

const calloutSchema = z.object({
  type: z.literal("callout"),
  content: z.string(),
  priority: priorityToken.default("normal"),
  style: styleSchema.optional(),
});

const badgeSchema = z.object({
  type: z.literal("badge"),
  label: z.string(),
  variant: variantToken.optional(),
  style: styleSchema.optional(),
});

const dividerSchema = z.object({
  type: z.literal("divider"),
  label: z.string().optional(),
  style: styleSchema.optional(),
});

const modalSchema = z.object({
  type: z.literal("modal"),
  trigger: z.lazy(() => a2uiSchema),
  content: z.lazy(() => a2uiSchema),
  open: z.boolean().optional(),
  style: styleSchema.optional(),
});

const listSchema = z.object({
  type: z.literal("list"),
  items: z.array(z.string()).min(1),
  ordered: z.boolean().optional(),
  style: styleSchema.optional(),
});

const tableSchema = z.object({
  type: z.literal("table"),
  // Allow an empty column list — normalizeA2UI maps `headers`→`columns` and the
  // renderer tolerates missing headers; a strict min(1) would reject otherwise
  // valid tables a model produces with a different key.
  columns: z.array(z.string()),
  rows: z.array(z.array(z.string())).default([]),
  style: styleSchema.optional(),
});

const statSchema = z.object({
  type: z.literal("stat"),
  label: z.string(),
  // String or a live binding (so a Stat can read e.g. `/status`); resolved by
  // the renderer rather than stringified to "[object Object]".
  value: dynamicStringField,
  helper: dynamicStringField.optional(),
  style: styleSchema.optional(),
});

const imageSchema = z.object({
  type: z.literal("image"),
  src: z.string(),
  alt: z.string(),
  style: styleSchema.optional(),
});

const imageInputSchema = z
  .object({
    type: z.literal("image"),
    src: z.string().optional(),
    prompt: z.string().optional(),
    alt: z.string().optional(),
    style: styleSchema.optional(),
  })
  .refine((value) => Boolean(value.src || value.prompt), {
    message: "Image requires either src or prompt",
  });

// Video — on-demand motion footage. Unlike images (auto-generated), a video's
// `prompt`/`src` becomes an explicit "Generate footage" placeholder the user
// clicks, since video generation is expensive. `src` is a real URL; `prompt`
// is a shot description the renderer treats as the on-demand seed.
const videoSchema = z.object({
  type: z.literal("video"),
  src: z.string(),
  alt: z.string().optional(),
  // `poster` is a preview-frame URL shown before a real (playable) clip plays —
  // the A2UI v1.0 `Video.posterUrl` prop. Only meaningful for a `src` video; the
  // on-demand "Generate footage" placeholder ignores it.
  poster: z.string().optional(),
  style: styleSchema.optional(),
});

const videoInputSchema = z
  .object({
    type: z.literal("video"),
    src: z.string().optional(),
    prompt: z.string().optional(),
    alt: z.string().optional(),
    poster: z.string().optional(),
    style: styleSchema.optional(),
  })
  .refine((value) => Boolean(value.src || value.prompt), {
    message: "Video requires either src or prompt",
  });

const inputSchema = z.object({
  type: z.literal("input"),
  name: z.string().optional(),
  label: z.string(),
  // `placeholder` is optional: models routinely omit it, and a missing
  // placeholder must not reject the whole form.
  placeholder: z.string().optional(),
  // String OR a live `{ path }` binding (two-way bound input — e.g. a bypass
  // code typed into `/code`). The TextField renderer resolves + writes it.
  value: dynamicStringField.optional(),
  variant: variantToken.optional(),
  style: styleSchema.optional(),
});

const textareaSchema = z.object({
  type: z.literal("textarea"),
  name: z.string().optional(),
  label: z.string(),
  placeholder: z.string().optional(),
  value: dynamicStringField.optional(),
  rows: z.number().int().min(2).max(12).optional(),
  variant: variantToken.optional(),
  style: styleSchema.optional(),
});

const selectSchema = z.object({
  type: z.literal("select"),
  name: z.string().optional(),
  label: z.string(),
  options: z.array(z.string()).min(1),
  value: dynamicStringField.optional(),
  variant: variantToken.optional(),
  style: styleSchema.optional(),
});

// Slider: a real catalog component (range input). Models ask for it directly
// ("a threat-level slider from 0 to 10"); without a schema entry the invented
// `type: "slider"` node fails validation and previously blanked the whole tree.
const sliderSchema = z.object({
  type: z.literal("slider"),
  label: z.string().optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  // `step` snaps the slider to discrete intervals (the A2UI v1.0 `Slider.steps`
  // prop). Omitted → the HTML range default of 1. Must be positive to be useful;
  // the renderer ignores a non-positive value.
  step: z.number().optional(),
  // number/string OR a live binding (the renderer two-way-binds + setData). A
  // bound slider tracks state instead of being dropped at validation.
  value: z.union([z.number(), z.string(), bindingObjectSchema]).optional(),
  style: styleSchema.optional(),
});

const checkboxSchema = z.object({
  type: z.literal("checkbox"),
  name: z.string().optional(),
  label: z.string(),
  // Boolean OR a live `{ path }`/`functionCall` binding (a bound toggle). The
  // CheckBox renderer resolves it; a literal boolean still works.
  checked: z.union([z.boolean(), bindingObjectSchema]).optional(),
  style: styleSchema.optional(),
});

// Icon: a single semantic glyph (search, fingerprint→skull, lock, clock…). The
// renderer maps a curated name set to lucide glyphs and falls back to a "help"
// glyph for anything unknown, so a bad `name` degrades gracefully rather than
// rejecting the tree. Use for affordances/evidence markers, not decoration.
const iconComponentSchema = z.object({
  type: z.literal("icon"),
  // String or a live binding; the renderer does `String(resolve(name))` and
  // falls back to a neutral glyph, so a binding is safe.
  name: dynamicStringField,
  size: z.enum(["small", "medium", "large"]).optional(),
  style: styleSchema.optional(),
});

// DateTimeInput: a date and/or time picker (alibis, timelines, "when did you
// last see them?"). `value`/`min`/`max` are ISO 8601 strings. Defaults to a
// date-only picker when neither flag is set (the renderer's own fallback).
const dateTimeInputSchema = z.object({
  type: z.literal("dateTimeInput"),
  label: z.string().optional(),
  // ISO string OR a live binding (two-way bound date/time field) — resolved by
  // the renderer, not dropped at validation.
  value: dynamicStringField.optional(),
  enableDate: z.boolean().optional(),
  enableTime: z.boolean().optional(),
  min: dynamicStringField.optional(),
  max: dynamicStringField.optional(),
  style: styleSchema.optional(),
});

// Reveal: a conditional wrapper (see RevealComponent). `when` is a free-form
// Dynamic value (a `{ path }` binding or a `functionCall` predicate), so it's
// typed loosely here and interpreted by the renderer's resolver. `children` use
// the recursive output schema in `a2uiSchema`; the input variant re-binds them.
const revealSchema = z.object({
  type: z.literal("reveal"),
  when: z.unknown(),
  style: styleSchema.optional(),
  children: z.array(z.lazy(() => a2uiSchema)),
}) satisfies z.ZodType<RevealComponent>;

// StateImage: a picture that swaps with a data value (see StateImageComponent).
const stateImageStateSchema = z.object({
  state: z.string(),
  instruction: z.string(),
});
const stateImageSchema = z.object({
  type: z.literal("stateImage"),
  base: z.string(),
  value: z.unknown(),
  states: z.array(stateImageStateSchema),
  alt: z.string().optional(),
  style: styleSchema.optional(),
}) satisfies z.ZodType<StateImageComponent>;

const buttonActionToken = z.enum(["submit", "reset", "log"]);

// A button's `action` can be:
//   - a legacy form verb string ("submit" | "reset" | "log"), OR
//   - a `{ functionCall }` (setValue/toggle/matchSet/openUrl) or `{ event }`
//     object the renderer's runAction dispatches, OR
//   - an ARRAY of those objects, run in sequence (validate THEN react).
// The schema is permissive (`.loose()`) on the object form — runAction does the
// real interpretation — so the model's reactive buttons aren't salvaged out.
const buttonActionObject = z.union([
  z.object({ functionCall: z.unknown() }).loose(),
  z.object({ event: z.unknown() }).loose(),
]);
const buttonActionSchema = z.union([
  buttonActionToken,
  buttonActionObject,
  z.array(buttonActionObject),
]);

const buttonSchema = z.object({
  type: z.literal("button"),
  label: z.string(),
  action: buttonActionSchema.optional(),
  variant: variantToken.optional(),
  style: styleSchema.optional(),
});

// KanbanBoard / DataDashboard — the two template components the personas and
// the COMPONENT PLAYBOOK steer the model toward. Previously they had no legacy
// schema arm, so a model that obeyed its own prompt emitted a node the
// discriminated union rejected and the board/dashboard silently vanished
// (salvageChildren can't recurse into `columns`/`widgets`). These arms accept
// the legacy-shaped node; the adapter passes the payload through to the
// catalog renderers (KanbanBoardRenderer / DataDashboardRenderer).

const kanbanCardSchema = z.object({
  id: z.string().optional(),
  title: z.string(),
  description: z.string().optional(),
  assignee: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

const kanbanColumnSchema = z.object({
  id: z.string().optional(),
  title: z.string(),
  cards: z.array(kanbanCardSchema).default([]),
});

const kanbanBoardSchema = z.object({
  type: z.literal("kanbanBoard"),
  title: dynamicStringField.optional(),
  columns: z.array(kanbanColumnSchema).default([]),
  style: styleSchema.optional(),
});

const dashboardWidgetSchema = z.object({
  id: z.string().optional(),
  title: z.string(),
  type: z.enum(["metric", "progress", "chart"]),
  value: z.union([z.string(), z.number()]).optional(),
  unit: z.string().optional(),
  progress: z.number().optional(),
  chartType: z.enum(["line", "bar", "pie"]).optional(),
  data: z.array(z.object({ label: z.string(), value: z.number() })).optional(),
  trend: z.object({ value: z.number(), direction: z.enum(["up", "down", "neutral"]) }).optional(),
});

const dataDashboardSchema = z.object({
  type: z.literal("dataDashboard"),
  title: dynamicStringField.optional(),
  widgets: z.array(dashboardWidgetSchema).default([]),
  style: styleSchema.optional(),
});

// Audio statement — a witness statement / voice log carried as a SCRIPT. The
// renderer offers a "play statement" affordance that reads the script through
// the TTS pipeline in a per-speaker voice variation (witness statements). A
// real `src` url plays directly instead.
const audioStatementSchema = z
  .object({
    type: z.literal("audio"),
    /** The spoken script (free text); rendered on demand through TTS. */
    script: z.string().optional(),
    /** A real audio url — plays directly when present. */
    src: z.string().optional(),
    /** Label above the player, e.g. "Witness statement — M. Doyle". */
    description: dynamicStringField.optional(),
    /** Speaker name — deterministically varies the voice per character. */
    speaker: dynamicStringField.optional(),
    style: styleSchema.optional(),
  })
  .refine((value) => Boolean(value.script || value.src), {
    message: "Audio requires either script or src",
  });

// RelationshipGraph — the "suspect web" / conspiracy-board: people, places, and
// clues (nodes) wired together by typed red-string edges (alibi/motive/etc).
// The signature noir investigation visual. The renderer lays the nodes out
// deterministically and draws sagging red-string edges (CaseYarn aesthetic).

const graphNodeSchema = z.object({
  id: z.string(),
  label: z.string(),
  kind: z.enum(["suspect", "victim", "location", "clue", "witness"]).optional(),
  detail: z.string().optional(),
});

const graphEdgeSchema = z.object({
  from: z.string(),
  to: z.string(),
  label: z.string().optional(),
  kind: z.enum(["alibi", "motive", "connection", "witnessed"]).optional(),
});

const relationshipGraphSchema = z.object({
  type: z.literal("relationshipGraph"),
  title: dynamicStringField.optional(),
  nodes: z.array(graphNodeSchema).default([]),
  edges: z.array(graphEdgeSchema).default([]),
  style: styleSchema.optional(),
});

// Custom component — the catalog ESCAPE HATCH: a complete, self-contained
// React component (default export, Tailwind classes) rendered inside the
// eject pipeline's Sandpack sandbox (a real iframe boundary). For requests the
// catalog genuinely can't express: canvas animations, custom visualizations,
// tiny games. The playbook tells the model to use it sparingly.
const customComponentSchema = z.object({
  type: z.literal("custom"),
  /** Complete React component module source; must default-export a component. */
  code: z.string().min(20).max(8000),
  title: z.string().optional(),
  /** Sandbox height in px (defaults to 360 in the renderer). */
  height: z.number().int().min(120).max(900).optional(),
  style: styleSchema.optional(),
});

type Style = z.infer<typeof styleSchema>;

export type TextComponent = z.infer<typeof textComponentSchema>;
export type CardComponent = z.infer<typeof cardComponentSchema>;
type HeadingComponent = z.infer<typeof headingSchema>;
type ParagraphComponent = z.infer<typeof paragraphSchema>;
type CalloutComponent = z.infer<typeof calloutSchema>;
type BadgeComponent = z.infer<typeof badgeSchema>;
type DividerComponent = z.infer<typeof dividerSchema>;
export type ModalComponent = z.infer<typeof modalSchema>;
type ListComponent = z.infer<typeof listSchema>;
type TableComponent = z.infer<typeof tableSchema>;
type StatComponent = z.infer<typeof statSchema>;
type ImageComponent = z.infer<typeof imageSchema>;
type ImageInputComponent = z.infer<typeof imageInputSchema>;
type VideoComponent = z.infer<typeof videoSchema>;
type VideoInputComponent = z.infer<typeof videoInputSchema>;
type InputComponent = z.infer<typeof inputSchema>;
type TextareaComponent = z.infer<typeof textareaSchema>;
type SelectComponent = z.infer<typeof selectSchema>;
type SliderComponent = z.infer<typeof sliderSchema>;
type CheckboxComponent = z.infer<typeof checkboxSchema>;
type IconComponent = z.infer<typeof iconComponentSchema>;
type DateTimeInputComponent = z.infer<typeof dateTimeInputSchema>;
// RevealComponent / StateImageComponent are declared as TS types above (the zod
// schemas `satisfies` them); they need no `z.infer` alias.
type ButtonComponent = z.infer<typeof buttonSchema>;
type KanbanBoardComponent = z.infer<typeof kanbanBoardSchema>;
type DataDashboardComponent = z.infer<typeof dataDashboardSchema>;
type RelationshipGraphComponent = z.infer<typeof relationshipGraphSchema>;
type AudioStatementComponent = z.infer<typeof audioStatementSchema>;
type CustomComponent = z.infer<typeof customComponentSchema>;

type ContainerComponent = {
  type: "container";
  style?: Style;
  children: A2UIComponent[];
};

type RowComponent = {
  type: "row";
  style?: Style;
  children: A2UIComponent[];
};

type ColumnComponent = {
  type: "column";
  style?: Style;
  children: A2UIComponent[];
};

type GridComponent = {
  type: "grid";
  columns?: "2" | "3" | "4";
  style?: Style;
  children: A2UIComponent[];
};

// Reveal: a conditional wrapper. Its children render only when `when` is truthy
// against the live data model. `when` is a Dynamic value — a `{ path }` binding
// (shows when that path is truthy) or a `functionCall` predicate
// (`{ call: "eq", args: { a: { path: "/code" }, b: "937-ALPHA" } }`). This is the
// generic gate/branch/"reveal-on-state" primitive for interactive surfaces.
type RevealComponent = {
  type: "reveal";
  when: unknown;
  style?: Style;
  children: A2UIComponent[];
};

// StateImage: an image whose picture changes with a data-model value. `base` is
// the initial scene's prompt/url; `states` map a string state value (read from
// `value`'s path) to an EDIT instruction applied to the base ("the blast door is
// now open"). The renderer caches each state's generated url, so flipping back
// to a seen state is instant (no re-generation).
type StateImageComponent = {
  type: "stateImage";
  base: string;
  value: unknown;
  states: { state: string; instruction: string }[];
  alt?: string;
  style?: Style;
};

type TabsComponent = {
  type: "tabs";
  tabs: { label: string; content: A2UIComponent }[];
  activeIndex?: number;
  style?: Style;
};

export type A2UIComponent =
  | TextComponent
  | CardComponent
  | ContainerComponent
  | RowComponent
  | ColumnComponent
  | GridComponent
  | HeadingComponent
  | ParagraphComponent
  | CalloutComponent
  | BadgeComponent
  | DividerComponent
  | ListComponent
  | TableComponent
  | StatComponent
  | TabsComponent
  | ImageComponent
  | VideoComponent
  | InputComponent
  | TextareaComponent
  | SelectComponent
  | SliderComponent
  | CheckboxComponent
  | IconComponent
  | DateTimeInputComponent
  | RevealComponent
  | StateImageComponent
  | ButtonComponent
  | KanbanBoardComponent
  | DataDashboardComponent
  | RelationshipGraphComponent
  | AudioStatementComponent
  | CustomComponent;

const containerSchema = z.object({
  type: z.literal("container"),
  style: styleSchema.optional(),
  children: z.array(z.lazy(() => a2uiSchema)),
}) satisfies z.ZodType<ContainerComponent>;

const rowSchema = z.object({
  type: z.literal("row"),
  style: styleSchema.optional(),
  children: z.array(z.lazy(() => a2uiSchema)),
}) satisfies z.ZodType<RowComponent>;

const columnSchema = z.object({
  type: z.literal("column"),
  style: styleSchema.optional(),
  children: z.array(z.lazy(() => a2uiSchema)),
}) satisfies z.ZodType<ColumnComponent>;

const gridSchema = z.object({
  type: z.literal("grid"),
  columns: z.enum(["2", "3", "4"]).optional(),
  style: styleSchema.optional(),
  children: z.array(z.lazy(() => a2uiSchema)),
}) satisfies z.ZodType<GridComponent>;

const tabsSchema = z.object({
  type: z.literal("tabs"),
  tabs: z
    .array(
      z.object({
        label: z.string(),
        content: z.lazy(() => a2uiSchema),
      })
    )
    .min(1),
  activeIndex: z.number().int().min(0).optional(),
  style: styleSchema.optional(),
}) satisfies z.ZodType<TabsComponent>;

export const a2uiSchema = z.discriminatedUnion("type", [
  textComponentSchema,
  cardComponentSchema,
  containerSchema,
  rowSchema,
  columnSchema,
  gridSchema,
  headingSchema,
  paragraphSchema,
  calloutSchema,
  badgeSchema,
  dividerSchema,
  modalSchema,
  listSchema,
  tableSchema,
  statSchema,
  tabsSchema,
  imageSchema,
  videoSchema,
  inputSchema,
  textareaSchema,
  selectSchema,
  sliderSchema,
  checkboxSchema,
  iconComponentSchema,
  dateTimeInputSchema,
  revealSchema,
  stateImageSchema,
  buttonSchema,
  kanbanBoardSchema,
  dataDashboardSchema,
  relationshipGraphSchema,
  audioStatementSchema,
  customComponentSchema,
]) as z.ZodType<A2UIComponent>;

type ContainerInputComponent = Omit<ContainerComponent, "children"> & {
  children: A2UIInput[];
};

type RowInputComponent = Omit<RowComponent, "children"> & {
  children: A2UIInput[];
};

type ColumnInputComponent = Omit<ColumnComponent, "children"> & {
  children: A2UIInput[];
};

type GridInputComponent = Omit<GridComponent, "children"> & {
  children: A2UIInput[];
};

type TabsInputComponent = Omit<TabsComponent, "tabs"> & {
  tabs: { label: string; content: A2UIInput }[];
};

type ModalInputComponent = {
  type: "modal";
  trigger: A2UIInput;
  content: A2UIInput;
  open?: boolean;
  style?: Style;
};

type RevealInputComponent = Omit<RevealComponent, "children"> & {
  children: A2UIInput[];
};

export type A2UIInput =
  | TextComponent
  | CardComponent
  | ContainerInputComponent
  | RowInputComponent
  | ColumnInputComponent
  | GridInputComponent
  | HeadingComponent
  | ParagraphComponent
  | CalloutComponent
  | BadgeComponent
  | DividerComponent
  | ModalInputComponent
  | ListComponent
  | TableComponent
  | StatComponent
  | TabsInputComponent
  | ImageInputComponent
  | VideoInputComponent
  | InputComponent
  | TextareaComponent
  | SelectComponent
  | SliderComponent
  | CheckboxComponent
  | IconComponent
  | DateTimeInputComponent
  | RevealInputComponent
  | StateImageComponent
  | ButtonComponent
  | KanbanBoardComponent
  | DataDashboardComponent
  | RelationshipGraphComponent
  | AudioStatementComponent
  | CustomComponent;

const containerInputSchema = containerSchema.extend({
  children: z.array(z.lazy(() => a2uiInputSchema)),
}) satisfies z.ZodType<ContainerInputComponent>;

const rowInputSchema = rowSchema.extend({
  children: z.array(z.lazy(() => a2uiInputSchema)),
}) satisfies z.ZodType<RowInputComponent>;

const columnInputSchema = columnSchema.extend({
  children: z.array(z.lazy(() => a2uiInputSchema)),
}) satisfies z.ZodType<ColumnInputComponent>;

const gridInputSchema = gridSchema.extend({
  children: z.array(z.lazy(() => a2uiInputSchema)),
}) satisfies z.ZodType<GridInputComponent>;

const tabsInputSchema = tabsSchema.extend({
  tabs: z
    .array(
      z.object({
        label: z.string(),
        content: z.lazy(() => a2uiInputSchema),
      })
    )
    .min(1),
}) satisfies z.ZodType<TabsInputComponent>;

const modalInputSchema = modalSchema.extend({
  trigger: z.lazy(() => a2uiInputSchema),
  content: z.lazy(() => a2uiInputSchema),
}) satisfies z.ZodType<ModalInputComponent>;

// Reveal's children resolve against the INPUT schema (so nested image prompts,
// tabs, etc. are normalized the same as anywhere else).
const revealInputSchema = revealSchema.extend({
  children: z.array(z.lazy(() => a2uiInputSchema)),
}) satisfies z.ZodType<RevealInputComponent>;

export const a2uiInputSchema = z.preprocess(
  normalizeA2UI,
  z.discriminatedUnion("type", [
    textComponentSchema,
    cardComponentSchema,
    containerInputSchema,
    rowInputSchema,
    columnInputSchema,
    gridInputSchema,
    headingSchema,
    paragraphSchema,
    calloutSchema,
    badgeSchema,
    dividerSchema,
    modalInputSchema,
    listSchema,
    tableSchema,
    statSchema,
    tabsInputSchema,
    imageInputSchema,
    videoInputSchema,
    inputSchema,
    textareaSchema,
    selectSchema,
    sliderSchema,
    checkboxSchema,
    iconComponentSchema,
    dateTimeInputSchema,
    revealInputSchema,
    stateImageSchema,
    buttonSchema,
    kanbanBoardSchema,
    dataDashboardSchema,
    relationshipGraphSchema,
    audioStatementSchema,
    customComponentSchema,
  ])
) as z.ZodType<A2UIInput>;
