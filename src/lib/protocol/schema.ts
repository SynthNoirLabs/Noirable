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
  columns: z.array(z.string()).min(1),
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

const inputSchema = z.object({
  type: z.literal("input"),
  name: z.string().optional(),
  label: z.string(),
  placeholder: z.string(),
  value: z.string().optional(),
  variant: variantToken.optional(),
  style: styleSchema.optional(),
});

const textareaSchema = z.object({
  type: z.literal("textarea"),
  name: z.string().optional(),
  label: z.string(),
  placeholder: z.string(),
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
type InputComponent = z.infer<typeof inputSchema>;
type TextareaComponent = z.infer<typeof textareaSchema>;
type SelectComponent = z.infer<typeof selectSchema>;
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
  | InputComponent
  | TextareaComponent
  | SelectComponent
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
  inputSchema,
  textareaSchema,
  selectSchema,
  checkboxSchema,
  buttonSchema,
]) as z.ZodType<A2UIComponent>;

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

  if (Array.isArray(normalized.children)) {
    normalized = {
      ...normalized,
      children: normalized.children.map((child) => normalizeA2UI(child)),
    };
  }

  if (type === "tabs" && Array.isArray(normalized.tabs)) {
    normalized = {
      ...normalized,
      tabs: normalized.tabs.map((tab) => {
        if (typeof tab !== "object" || tab === null) return tab;
        const tabObj = tab as Record<string, unknown>;
        let updated = { ...tabObj };

        if (!("content" in tabObj) && Array.isArray(tabObj.children)) {
          updated = {
            ...updated,
            content: { type: "container", children: tabObj.children },
          };
          delete (updated as Record<string, unknown>).children;
        }

        if (updated.content) {
          updated = {
            ...updated,
            content: normalizeA2UI(updated.content),
          };
        }

        return updated;
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
  | InputComponent
  | TextareaComponent
  | SelectComponent
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
    inputSchema,
    textareaSchema,
    selectSchema,
    checkboxSchema,
    buttonSchema,
  ])
) as z.ZodType<A2UIInput>;
