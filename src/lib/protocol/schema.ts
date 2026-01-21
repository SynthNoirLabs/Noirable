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
});

export const cardComponentSchema = z.object({
  type: z.literal("card"),
  title: z.string(),
  description: z.string().optional(),
  status: z
    .enum(["active", "archived", "missing", "redacted"])
    .default("active"),
});

const containerSchema = z.object({
  type: z.literal("container"),
  style: styleSchema.optional(),
  children: z.array(z.lazy(() => a2uiSchema)),
});

const rowSchema = z.object({
  type: z.literal("row"),
  style: styleSchema.optional(),
  children: z.array(z.lazy(() => a2uiSchema)),
});

const columnSchema = z.object({
  type: z.literal("column"),
  style: styleSchema.optional(),
  children: z.array(z.lazy(() => a2uiSchema)),
});

const gridSchema = z.object({
  type: z.literal("grid"),
  columns: z.enum(["2", "3", "4"]).optional(),
  style: styleSchema.optional(),
  children: z.array(z.lazy(() => a2uiSchema)),
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

const tabsSchema = z.object({
  type: z.literal("tabs"),
  tabs: z
    .array(
      z.object({
        label: z.string(),
        content: z.lazy(() => a2uiSchema),
      }),
    )
    .min(1),
  activeIndex: z.number().int().min(0).optional(),
  style: styleSchema.optional(),
});

const imageSchema = z.object({
  type: z.literal("image"),
  src: z.string(),
  alt: z.string(),
  style: styleSchema.optional(),
});

const inputSchema = z.object({
  type: z.literal("input"),
  label: z.string(),
  placeholder: z.string(),
  value: z.string().optional(),
  variant: variantToken.optional(),
  style: styleSchema.optional(),
});

const textareaSchema = z.object({
  type: z.literal("textarea"),
  label: z.string(),
  placeholder: z.string(),
  value: z.string().optional(),
  rows: z.number().int().min(2).max(12).optional(),
  variant: variantToken.optional(),
  style: styleSchema.optional(),
});

const selectSchema = z.object({
  type: z.literal("select"),
  label: z.string(),
  options: z.array(z.string()).min(1),
  value: z.string().optional(),
  variant: variantToken.optional(),
  style: styleSchema.optional(),
});

const checkboxSchema = z.object({
  type: z.literal("checkbox"),
  label: z.string(),
  checked: z.boolean().optional(),
  style: styleSchema.optional(),
});

const buttonSchema = z.object({
  type: z.literal("button"),
  label: z.string(),
  variant: variantToken.optional(),
  style: styleSchema.optional(),
});

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
]);

export type TextComponent = z.infer<typeof textComponentSchema>;
export type CardComponent = z.infer<typeof cardComponentSchema>;
export type A2UIComponent = z.infer<typeof a2uiSchema>;

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

export const a2uiInputSchema = z.preprocess(normalizeA2UI, a2uiSchema);
