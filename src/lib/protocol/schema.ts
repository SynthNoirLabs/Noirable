/**
 * @deprecated Use A2UI v0.9 protocol instead (src/lib/a2ui/)
 * This schema is maintained for backward compatibility only.
 * New features should use the standard A2UI catalog.
 */

import { z } from "zod";

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

export const textComponentSchema = z.object({
  type: z.literal("text"),
  content: z.string(),
  priority: priorityToken.default("normal"),
  style: styleSchema.optional(),
});

export const cardComponentSchema = z.object({
  type: z.literal("card"),
  title: z.string(),
  description: z.string().optional(),
  status: z.enum(["active", "archived", "missing", "redacted"]).default("active"),
  style: styleSchema.optional(),
});

const headingSchema = z.object({
  type: z.literal("heading"),
  text: z.string(),
  level: z.number().int().min(1).max(4).default(2),
  style: styleSchema.optional(),
});

const paragraphSchema = z.object({
  type: z.literal("paragraph"),
  text: z.string(),
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
  value: z.string(),
  helper: z.string().optional(),
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
  style: styleSchema.optional(),
});

const videoInputSchema = z
  .object({
    type: z.literal("video"),
    src: z.string().optional(),
    prompt: z.string().optional(),
    alt: z.string().optional(),
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
  value: z.string().optional(),
  variant: variantToken.optional(),
  style: styleSchema.optional(),
});

const textareaSchema = z.object({
  type: z.literal("textarea"),
  name: z.string().optional(),
  label: z.string(),
  placeholder: z.string().optional(),
  value: z.string().optional(),
  rows: z.number().int().min(2).max(12).optional(),
  variant: variantToken.optional(),
  style: styleSchema.optional(),
});

const selectSchema = z.object({
  type: z.literal("select"),
  name: z.string().optional(),
  label: z.string(),
  options: z.array(z.string()).min(1),
  value: z.string().optional(),
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
  value: z.union([z.number(), z.string()]).optional(),
  style: styleSchema.optional(),
});

const checkboxSchema = z.object({
  type: z.literal("checkbox"),
  name: z.string().optional(),
  label: z.string(),
  checked: z.boolean().optional(),
  style: styleSchema.optional(),
});

const buttonActionToken = z.enum(["submit", "reset", "log"]);

const buttonSchema = z.object({
  type: z.literal("button"),
  label: z.string(),
  action: buttonActionToken.optional(),
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
  title: z.string().optional(),
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
  title: z.string().optional(),
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
    description: z.string().optional(),
    /** Speaker name — deterministically varies the voice per character. */
    speaker: z.string().optional(),
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
  title: z.string().optional(),
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

/**
 * The single source of truth for the legacy `type` values the model may emit.
 * The `generate_ui` tool description, the persona Core Directives, and the
 * COMPONENT PLAYBOOK all derive their "supported types" list from this constant
 * so the three can never drift apart again (the KanbanBoard/DataDashboard drift
 * was exactly that failure).
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
  "button",
  "kanbanBoard",
  "dataDashboard",
  "relationshipGraph",
  "audio",
  "custom",
] as const;

/** Comma-joined form for prompt interpolation. */
export const SUPPORTED_LEGACY_TYPE_LIST = SUPPORTED_LEGACY_TYPES.join(", ");

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
  buttonSchema,
  kanbanBoardSchema,
  dataDashboardSchema,
  relationshipGraphSchema,
  audioStatementSchema,
  customComponentSchema,
]) as z.ZodType<A2UIComponent>;

/**
 * Coerce a single table row to a string[]. Models emit rows as a cell array, an
 * object keyed by column name (or any object), or a scalar. An object row is
 * mapped into `columnNames` order when those keys exist; otherwise its values
 * are used in insertion order. This prevents the "[object Object]" cells that
 * appear when an object row is naively String()-ed.
 */
function coerceTableRow(row: unknown, columnNames: string[]): string[] {
  if (Array.isArray(row)) {
    return row.map((c) => (c == null ? "" : String(c)));
  }
  if (row && typeof row === "object") {
    const obj = row as Record<string, unknown>;
    // Prefer column-name lookup so cells land in the right column. Match keys
    // loosely — lowercased with non-alphanumerics stripped — so "Last Seen"
    // (column) lines up with `lastSeen`/`last_seen` (object key).
    const loose = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
    const looseKeys = new Map(Object.keys(obj).map((k) => [loose(k), k]));
    const matched = columnNames.length > 0 && columnNames.some((c) => looseKeys.has(loose(c)));
    if (matched) {
      return columnNames.map((c) => {
        const key = looseKeys.get(loose(c));
        const v = key ? obj[key] : undefined;
        return v == null ? "" : String(v);
      });
    }
    return Object.values(obj).map((v) => (v == null ? "" : String(v)));
  }
  return [row == null ? "" : String(row)];
}

/** Record alias used by the per-type normalizers below. */
type Obj = Record<string, unknown>;

/**
 * Lift the first present string among `title`/`name`/`label` into a title,
 * defaulting to "". Used by the kanban column/card and dashboard widget
 * normalizers, where models scatter the title across these synonyms.
 */
function liftTitle(obj: Obj): string {
  return typeof obj.title === "string"
    ? obj.title
    : typeof obj.name === "string"
      ? obj.name
      : typeof obj.label === "string"
        ? obj.label
        : "";
}

/**
 * Canonicalize the `type` spelling. Models emit the PascalCase names from the
 * prompts ("KanbanBoard"/"DataDashboard"), shorthand ("kanban", "dashboard"),
 * or stray capitalization ("Card"); all collapse to the canonical entry in
 * SUPPORTED_LEGACY_TYPES. Returns the (possibly rewritten) type and node.
 */
function canonicalizeType(type: unknown, node: Obj): { type: unknown; node: Obj } {
  if (typeof type !== "string") return { type, node };
  const flat = type.toLowerCase().replace(/[^a-z]/g, "");
  const TYPE_ALIASES: Record<string, string> = {
    kanban: "kanbanBoard",
    kanbanboard: "kanbanBoard",
    dashboard: "dataDashboard",
    datadashboard: "dataDashboard",
    suspectweb: "relationshipGraph",
    relationshipgraph: "relationshipGraph",
    relationship: "relationshipGraph",
    graph: "relationshipGraph",
  };
  const canonical =
    TYPE_ALIASES[flat] ?? SUPPORTED_LEGACY_TYPES.find((t) => t.toLowerCase() === flat);
  if (canonical && canonical !== type) {
    return { type: canonical, node: { ...node, type: canonical } };
  }
  return { type, node };
}

/** text/callout: lift a `text` field into `content` when content is missing. */
function normalizeTextLike(node: Obj): Obj {
  if (typeof node.content !== "string" && typeof node.text === "string") {
    return { ...node, content: node.text };
  }
  return node;
}

/**
 * Models often emit `card` as a generic container with a `children` array
 * (sometimes alongside a title/description). The legacy `card` has no
 * `children` field and only renders title/description, which would drop the
 * nested content. Reinterpret any card-with-children as a `container`, lifting
 * a title/description into leading heading + text nodes so nothing is lost.
 */
function normalizeCard(node: Obj): Obj {
  if (!Array.isArray(node.children)) return node;
  const lead: Obj[] = [];
  if (typeof node.title === "string") {
    lead.push({ type: "heading", text: node.title, level: 3 });
  }
  if (typeof node.description === "string") {
    lead.push({ type: "paragraph", text: node.description });
  }
  const rest = { ...node };
  delete rest.title;
  delete rest.description;
  delete rest.status;
  return {
    ...rest,
    type: "container",
    children: [...lead, ...(node.children as unknown[])],
  };
}

/**
 * Clamp `variant` to the supported token set. Models invent values like
 * "warning", "success", "info", "error" — map the common ones to the nearest
 * supported token and drop anything else so one stray value doesn't fail the
 * whole tree.
 */
function normalizeVariant(node: Obj): Obj {
  if (typeof node.variant !== "string") return node;
  const VARIANTS = new Set(["primary", "secondary", "ghost", "danger"]);
  if (VARIANTS.has(node.variant)) return node;
  const VARIANT_ALIASES: Record<string, string> = {
    warning: "danger",
    error: "danger",
    destructive: "danger",
    critical: "danger",
    success: "secondary",
    info: "secondary",
    muted: "ghost",
    outline: "ghost",
    default: "primary",
  };
  const mapped = VARIANT_ALIASES[node.variant.toLowerCase()];
  if (mapped) {
    return { ...node, variant: mapped };
  }
  const next = { ...node };
  delete next.variant;
  return next;
}

/**
 * Grid: models use `cols` instead of `columns`, and/or a number instead of the
 * "2"|"3"|"4" string enum. Coerce both, clamp to range, and ensure children.
 */
function normalizeGrid(node: Obj): Obj {
  const rawCols = node.columns ?? node.cols;
  const next = { ...node };
  delete next.cols;
  if (rawCols !== undefined) {
    const n = Math.min(4, Math.max(2, Number(rawCols) || 2));
    next.columns = String(n);
  }
  if (!Array.isArray(next.children)) {
    next.children = [];
  }
  return next;
}

/**
 * Layout/container types require a `children` array; default to empty if the
 * model omitted it so a childless container doesn't fail the whole tree.
 */
function normalizeLayout(node: Obj): Obj {
  if (!Array.isArray(node.children)) {
    return { ...node, children: [] };
  }
  return node;
}

/**
 * Table: models frequently name the columns `headers` (or `header`) instead of
 * `columns`, and may omit `rows`. Coerce to the required shape so one synonym
 * doesn't reject the whole tree.
 */
function normalizeTable(node: Obj): Obj {
  const cols = node.columns ?? node.headers ?? node.header;
  const next = { ...node };
  delete next.headers;
  delete next.header;
  const columnNames = Array.isArray(cols) ? cols.map(String) : [];
  next.columns = columnNames;
  // Rows come in three shapes from models: an array of cell arrays, an array
  // of objects keyed by column name (→ map into column order so they don't
  // stringify to "[object Object]"), or a scalar. Coerce all to string[].
  next.rows = Array.isArray(node.rows)
    ? (node.rows as unknown[]).map((r) => coerceTableRow(r, columnNames))
    : [];
  return next;
}

/**
 * kanbanBoard: tolerate `name`/`label` column titles, `items` for cards,
 * string cards, and missing arrays — one loose column must not reject the
 * whole board.
 */
function normalizeKanban(node: Obj): Obj {
  const cols = Array.isArray(node.columns) ? node.columns : [];
  return {
    ...node,
    columns: cols.map((col) => {
      if (typeof col === "string") return { title: col, cards: [] };
      if (!col || typeof col !== "object") return { title: "", cards: [] };
      const c = col as Obj;
      const title = liftTitle(c);
      const rawCards = Array.isArray(c.cards) ? c.cards : Array.isArray(c.items) ? c.items : [];
      const cards = rawCards.map((card) => {
        if (typeof card === "string") return { title: card };
        if (!card || typeof card !== "object") return { title: "" };
        const k = card as Obj;
        const cardTitle =
          typeof k.title === "string"
            ? k.title
            : typeof k.label === "string"
              ? k.label
              : typeof k.name === "string"
                ? k.name
                : "";
        return { ...k, title: cardTitle };
      });
      const rest = { ...c };
      delete rest.items;
      return { ...rest, title, cards };
    }),
  };
}

/**
 * dataDashboard: tolerate `metrics`/`items` as the widget list, lifted
 * label/name titles, and a missing widget `type` (inferred from the fields
 * present: data → chart, progress → progress, else metric).
 */
function normalizeDashboard(node: Obj): Obj {
  const rawWidgets = Array.isArray(node.widgets)
    ? node.widgets
    : Array.isArray(node.metrics)
      ? node.metrics
      : Array.isArray(node.items)
        ? node.items
        : [];
  const next = { ...node };
  delete next.metrics;
  delete next.items;
  next.widgets = rawWidgets.map((w) => {
    if (!w || typeof w !== "object") {
      return { title: w == null ? "" : String(w), type: "metric", value: "" };
    }
    const o = w as Obj;
    const title = liftTitle(o);
    let widgetType = o.type;
    if (widgetType !== "metric" && widgetType !== "progress" && widgetType !== "chart") {
      widgetType = Array.isArray(o.data)
        ? "chart"
        : typeof o.progress === "number"
          ? "progress"
          : "metric";
    }
    return { ...o, title, type: widgetType };
  });
  return next;
}

/**
 * relationshipGraph: tolerate the shapes models reach for — edges under
 * `links`/`relationships`, edge endpoints as `source`/`target`, and node labels
 * scattered across `label`/`name`/`title`. Coerce to the strict node/edge
 * shape, dropping endpoints that aren't strings, so one loose entry doesn't
 * reject the whole graph.
 */
function normalizeRelationshipGraph(node: Obj): Obj {
  const rawNodes = Array.isArray(node.nodes) ? node.nodes : [];
  const rawEdges = Array.isArray(node.edges)
    ? node.edges
    : Array.isArray(node.links)
      ? node.links
      : Array.isArray(node.relationships)
        ? node.relationships
        : [];
  const next = { ...node };
  delete next.links;
  delete next.relationships;
  next.nodes = rawNodes.map((entry, index) => {
    if (typeof entry === "string") return { id: entry, label: entry };
    if (!entry || typeof entry !== "object") return { id: String(index), label: "" };
    const n = entry as Obj;
    const id = typeof n.id === "string" ? n.id : liftTitle(n) || String(index);
    const label = liftTitle(n) || id;
    return { ...n, id, label };
  });
  next.edges = rawEdges
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const e = entry as Obj;
      const from =
        typeof e.from === "string" ? e.from : typeof e.source === "string" ? e.source : "";
      const to = typeof e.to === "string" ? e.to : typeof e.target === "string" ? e.target : "";
      if (!from || !to) return null;
      const rest = { ...e };
      delete rest.source;
      delete rest.target;
      return { ...rest, from, to };
    })
    .filter((edge): edge is NonNullable<typeof edge> => edge !== null);
  return next;
}

/**
 * Audio statement: lift `text`/`content`/`statement` into `script` so loose
 * model shapes still validate.
 */
function normalizeAudio(node: Obj): Obj {
  if (typeof node.script === "string") return node;
  const lifted =
    typeof node.text === "string"
      ? node.text
      : typeof node.content === "string"
        ? node.content
        : typeof node.statement === "string"
          ? node.statement
          : undefined;
  if (!lifted) return node;
  const next: Obj = { ...node, script: lifted };
  delete next.text;
  delete next.content;
  delete next.statement;
  return next;
}

/** Types that require a string `label`. */
const LABEL_REQUIRED = new Set([
  "badge",
  "stat",
  "input",
  "textarea",
  "select",
  "checkbox",
  "button",
]);

/**
 * Default a missing `label` to "" (or lift `text`/`content`) for the
 * label-requiring types, so one bare node doesn't fail the whole tree.
 */
function normalizeLabels(node: Obj): Obj {
  const lifted =
    typeof node.text === "string"
      ? node.text
      : typeof node.content === "string"
        ? node.content
        : "";
  return { ...node, label: lifted };
}

/** `select` requires a non-empty `options` string array. */
function normalizeSelect(node: Obj): Obj {
  if (!Array.isArray(node.options)) {
    return { ...node, options: [] };
  }
  if (node.options.length === 0) {
    return { ...node, options: ["Option"] };
  }
  return node;
}

/** `stat` requires a string `value`. */
function normalizeStat(node: Obj): Obj {
  if (typeof node.value === "string") return node;
  return {
    ...node,
    value: node.value === undefined || node.value === null ? "" : String(node.value),
  };
}

/** `badge` requires a string `label`; lift `text`/`content` when missing. */
function normalizeBadge(node: Obj): Obj {
  if (typeof node.label === "string") return node;
  const badgeLabel =
    typeof node.text === "string"
      ? node.text
      : typeof node.content === "string"
        ? node.content
        : undefined;
  if (!badgeLabel) return node;
  const next: Obj = { ...node, label: badgeLabel };
  delete next.text;
  delete next.content;
  return next;
}

/** `image` requires an `alt`; fall back to the prompt or a generic label. */
function normalizeImage(node: Obj): Obj {
  const altFallback =
    typeof node.alt === "string"
      ? node.alt
      : typeof node.prompt === "string"
        ? node.prompt
        : "Generated image";
  return { ...node, alt: altFallback };
}

/**
 * Video: unlike images (whose prompt is resolved into a real src), a video's
 * prompt is kept as the `src` text on purpose — the renderer treats a non-URL
 * src as the on-demand "Generate footage" seed. So coalesce prompt → src when
 * only a prompt was given, and supply an alt fallback for accessibility.
 */
function normalizeVideo(node: Obj): Obj {
  const src =
    typeof node.src === "string" && node.src
      ? node.src
      : typeof node.prompt === "string"
        ? node.prompt
        : "";
  const altFallback =
    typeof node.alt === "string"
      ? node.alt
      : typeof node.prompt === "string"
        ? node.prompt
        : "Generated footage";
  return { ...node, src, alt: altFallback };
}

/**
 * tabs: each tab must be { label: string, content: A2UIComponent }. Models use
 * many shapes: a `children` array, a `panel`/`body` alias, or just a label with
 * the content omitted entirely. Coerce all of them, and drop stray fields like
 * `id` that the tab schema doesn't allow.
 */
function normalizeTabs(node: Obj): Obj {
  if (!Array.isArray(node.tabs)) return node;
  return {
    ...node,
    tabs: node.tabs.map((tab, i) => {
      if (typeof tab !== "object" || tab === null) return tab;
      const tabObj = tab as Obj;

      const label =
        typeof tabObj.label === "string"
          ? tabObj.label
          : typeof tabObj.title === "string"
            ? tabObj.title
            : `Tab ${i + 1}`;

      let content = tabObj.content ?? tabObj.panel ?? tabObj.body;
      if (content === undefined && Array.isArray(tabObj.children)) {
        content = { type: "container", children: tabObj.children };
      }
      if (content === undefined || content === null) {
        content = { type: "container", children: [] };
      }

      return { label, content: normalizeA2UI(content) };
    }),
  };
}

export function normalizeA2UI(input: unknown): unknown {
  if (Array.isArray(input)) {
    return input.map((entry) => normalizeA2UI(entry));
  }

  if (typeof input !== "object" || input === null) {
    return input;
  }

  // Canonicalize the `type` spelling FIRST so every later type-keyed branch and
  // the discriminated union see one spelling.
  const canon = canonicalizeType((input as Obj).type, { ...(input as Obj) });
  const type = canon.type;
  let normalized: Obj = canon.node;

  if (type === "text" || type === "callout") {
    normalized = normalizeTextLike(normalized);
  }

  if (type === "card") {
    normalized = normalizeCard(normalized);
  }

  normalized = normalizeVariant(normalized);

  if (type === "grid") {
    normalized = normalizeGrid(normalized);
  }

  if (type === "container" || type === "row" || type === "column") {
    normalized = normalizeLayout(normalized);
  }

  if (type === "table") {
    normalized = normalizeTable(normalized);
  }

  if (type === "kanbanBoard") {
    normalized = normalizeKanban(normalized);
  }

  if (type === "dataDashboard") {
    normalized = normalizeDashboard(normalized);
  }

  if (type === "relationshipGraph") {
    normalized = normalizeRelationshipGraph(normalized);
  }

  if (type === "audio") {
    normalized = normalizeAudio(normalized);
  }

  if (
    typeof type === "string" &&
    LABEL_REQUIRED.has(type) &&
    typeof normalized.label !== "string"
  ) {
    normalized = normalizeLabels(normalized);
  }

  if (type === "select") {
    normalized = normalizeSelect(normalized);
  }

  if (type === "stat") {
    normalized = normalizeStat(normalized);
  }

  if (type === "badge") {
    normalized = normalizeBadge(normalized);
  }

  if (type === "image") {
    normalized = normalizeImage(normalized);
  }

  if (type === "video") {
    normalized = normalizeVideo(normalized);
  }

  if (Array.isArray(normalized.children)) {
    normalized = {
      ...normalized,
      children: normalized.children.map((child) => normalizeA2UI(child)),
    };
  }

  if (type === "tabs") {
    normalized = normalizeTabs(normalized);
  }

  return normalized;
}

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
    buttonSchema,
    kanbanBoardSchema,
    dataDashboardSchema,
    relationshipGraphSchema,
    audioStatementSchema,
    customComponentSchema,
  ])
) as z.ZodType<A2UIInput>;
