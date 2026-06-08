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
  | ButtonComponent;

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

export function normalizeA2UI(input: unknown): unknown {
  if (Array.isArray(input)) {
    return input.map((entry) => normalizeA2UI(entry));
  }

  if (typeof input !== "object" || input === null) {
    return input;
  }

  const node = input as Record<string, unknown>;
  const type = node.type;
  let normalized = { ...node };

  if (
    (type === "text" || type === "callout") &&
    typeof normalized.content !== "string" &&
    typeof normalized.text === "string"
  ) {
    normalized = { ...normalized, content: normalized.text };
  }

  // Models often emit `card` as a generic container with a `children` array
  // (sometimes alongside a title/description). The legacy `card` has no
  // `children` field and only renders title/description, which would drop the
  // nested content. Reinterpret any card-with-children as a `container`, lifting
  // a title/description into leading heading + text nodes so nothing is lost.
  if (type === "card" && Array.isArray(normalized.children)) {
    const lead: Record<string, unknown>[] = [];
    if (typeof normalized.title === "string") {
      lead.push({ type: "heading", text: normalized.title, level: 3 });
    }
    if (typeof normalized.description === "string") {
      lead.push({ type: "paragraph", text: normalized.description });
    }
    const rest = { ...normalized };
    delete (rest as Record<string, unknown>).title;
    delete (rest as Record<string, unknown>).description;
    delete (rest as Record<string, unknown>).status;
    normalized = {
      ...rest,
      type: "container",
      children: [...lead, ...(normalized.children as unknown[])],
    };
  }

  // Clamp `variant` to the supported token set. Models invent values like
  // "warning", "success", "info", "error" — map the common ones to the nearest
  // supported token and drop anything else so one stray value doesn't fail the
  // whole tree.
  if (typeof normalized.variant === "string") {
    const VARIANTS = new Set(["primary", "secondary", "ghost", "danger"]);
    if (!VARIANTS.has(normalized.variant)) {
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
      const mapped = VARIANT_ALIASES[normalized.variant.toLowerCase()];
      if (mapped) {
        normalized = { ...normalized, variant: mapped };
      } else {
        const next = { ...normalized };
        delete (next as Record<string, unknown>).variant;
        normalized = next;
      }
    }
  }

  // Grid: models use `cols` instead of `columns`, and/or a number instead of the
  // "2"|"3"|"4" string enum. Coerce both, clamp to range, and ensure children.
  if (type === "grid") {
    const rawCols = normalized.columns ?? normalized.cols;
    const next = { ...normalized };
    delete (next as Record<string, unknown>).cols;
    if (rawCols !== undefined) {
      const n = Math.min(4, Math.max(2, Number(rawCols) || 2));
      next.columns = String(n);
    }
    if (!Array.isArray(next.children)) {
      next.children = [];
    }
    normalized = next;
  }

  // Layout/container types require a `children` array; default to empty if the
  // model omitted it so a childless container doesn't fail the whole tree.
  if (
    (type === "container" || type === "row" || type === "column") &&
    !Array.isArray(normalized.children)
  ) {
    normalized = { ...normalized, children: [] };
  }

  // Table: models frequently name the columns `headers` (or `header`) instead of
  // `columns`, and may omit `rows`. Coerce to the required shape so one synonym
  // doesn't reject the whole tree.
  if (type === "table") {
    const cols = normalized.columns ?? normalized.headers ?? normalized.header;
    const next = { ...normalized };
    delete (next as Record<string, unknown>).headers;
    delete (next as Record<string, unknown>).header;
    const columnNames = Array.isArray(cols) ? cols.map(String) : [];
    next.columns = columnNames;
    // Rows come in three shapes from models: an array of cell arrays, an array
    // of objects keyed by column name (→ map into column order so they don't
    // stringify to "[object Object]"), or a scalar. Coerce all to string[].
    next.rows = Array.isArray(normalized.rows)
      ? (normalized.rows as unknown[]).map((r) => coerceTableRow(r, columnNames))
      : [];
    normalized = next;
  }

  // Types that require a string `label` — default to "" (or lift `text`/`content`)
  // when the model omits it, so one bare node doesn't fail the whole tree.
  const LABEL_REQUIRED = new Set([
    "badge",
    "stat",
    "input",
    "textarea",
    "select",
    "checkbox",
    "button",
  ]);
  if (
    typeof type === "string" &&
    LABEL_REQUIRED.has(type) &&
    typeof normalized.label !== "string"
  ) {
    const lifted =
      typeof normalized.text === "string"
        ? normalized.text
        : typeof normalized.content === "string"
          ? normalized.content
          : "";
    normalized = { ...normalized, label: lifted };
  }

  // `select` requires a non-empty `options` string array.
  if (type === "select" && !Array.isArray(normalized.options)) {
    normalized = { ...normalized, options: [] };
  }
  if (type === "select" && Array.isArray(normalized.options) && normalized.options.length === 0) {
    normalized = { ...normalized, options: ["Option"] };
  }

  // `stat` also requires a string `value`.
  if (type === "stat" && typeof normalized.value !== "string") {
    normalized = {
      ...normalized,
      value:
        normalized.value === undefined || normalized.value === null ? "" : String(normalized.value),
    };
  }

  if (type === "badge" && typeof normalized.label !== "string") {
    const badgeLabel =
      typeof normalized.text === "string"
        ? normalized.text
        : typeof normalized.content === "string"
          ? normalized.content
          : undefined;
    if (badgeLabel) {
      normalized = { ...normalized, label: badgeLabel };
      delete (normalized as Record<string, unknown>).text;
      delete (normalized as Record<string, unknown>).content;
    }
  }

  if (type === "image") {
    const altFallback =
      typeof normalized.alt === "string"
        ? normalized.alt
        : typeof normalized.prompt === "string"
          ? normalized.prompt
          : "Generated image";
    normalized = { ...normalized, alt: altFallback };
  }

  // Video: unlike images (whose prompt is resolved into a real src), a video's
  // prompt is kept as the `src` text on purpose — the renderer treats a non-URL
  // src as the on-demand "Generate footage" seed. So coalesce prompt → src when
  // only a prompt was given, and supply an alt fallback for accessibility.
  if (type === "video") {
    const src =
      typeof normalized.src === "string" && normalized.src
        ? normalized.src
        : typeof normalized.prompt === "string"
          ? normalized.prompt
          : "";
    const altFallback =
      typeof normalized.alt === "string"
        ? normalized.alt
        : typeof normalized.prompt === "string"
          ? normalized.prompt
          : "Generated footage";
    normalized = { ...normalized, src, alt: altFallback };
  }

  if (Array.isArray(normalized.children)) {
    normalized = {
      ...normalized,
      children: normalized.children.map((child) => normalizeA2UI(child)),
    };
  }

  if (type === "tabs" && Array.isArray(normalized.tabs)) {
    normalized = {
      ...normalized,
      tabs: normalized.tabs.map((tab, i) => {
        if (typeof tab !== "object" || tab === null) return tab;
        const tabObj = tab as Record<string, unknown>;

        // Each tab must be { label: string, content: A2UIComponent }. Models use
        // many shapes: a `children` array, a `panel`/`body` alias, or just a
        // label with the content omitted entirely. Coerce all of them, and drop
        // stray fields like `id` that the tab schema doesn't allow.
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
  | ButtonComponent;

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
  ])
) as z.ZodType<A2UIInput>;
