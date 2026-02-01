import { z } from "zod";

/**
 * A2UI v0.9 Standard Component Catalog
 *
 * Implements all 18 standard components from the A2UI v0.9 specification.
 * Based on: https://github.com/google/A2UI/blob/main/specification/v0_9/json/standard_catalog.json
 *
 * Categories:
 * - Layout (7): Row, Column, List, Card, Tabs, Divider, Modal
 * - Content (5): Text, Image, Icon, Video, AudioPlayer
 * - Input (6): Button, CheckBox, TextField, DateTimeInput, ChoicePicker, Slider
 */

// =============================================================================
// Common Types (imported from common.ts but also defined here for self-containment)
// =============================================================================

/**
 * Component ID - unique identifier for a component within a surface.
 */
const componentIdSchema = z.string().min(1);

/**
 * Data binding - JSON Pointer path to data model.
 */
const dataBindingSchema = z.object({
  path: z.string(),
});

/**
 * Function call - invokes a named function on the client.
 */
const functionCallSchema = z.object({
  call: z.string(),
  args: z.record(z.string(), z.unknown()).optional(),
  returnType: z.enum(["string", "number", "boolean", "array", "object", "any", "void"]).optional(),
});

/**
 * DynamicString: literal string, data binding, or function call returning string.
 */
const dynamicStringSchema = z.union([z.string(), dataBindingSchema, functionCallSchema]);

/**
 * DynamicNumber: literal number, data binding, or function call returning number.
 */
const dynamicNumberSchema = z.union([z.number(), dataBindingSchema, functionCallSchema]);

/**
 * DynamicBoolean: literal boolean, data binding, or logic expression.
 */
const dynamicBooleanSchema = z.union([z.boolean(), dataBindingSchema, functionCallSchema]);

/**
 * DynamicStringList: literal array of strings, data binding, or function call.
 */
const dynamicStringListSchema = z.union([
  z.array(z.string()),
  dataBindingSchema,
  functionCallSchema,
]);

/**
 * ChildList: static array of component IDs or template for dynamic generation.
 */
const childListSchema = z.union([
  z.array(componentIdSchema),
  z.object({
    componentId: componentIdSchema,
    path: z.string(),
  }),
]);

/**
 * Accessibility attributes for assistive technologies.
 */
const accessibilitySchema = z
  .object({
    label: dynamicStringSchema.optional(),
    description: dynamicStringSchema.optional(),
  })
  .optional();

/**
 * Action - either server event or local function call.
 */
const actionSchema = z.union([
  z.object({
    event: z.object({
      name: z.string(),
      context: z.record(z.string(), z.unknown()).optional(),
    }),
  }),
  z.object({
    functionCall: functionCallSchema,
  }),
]);

/**
 * Check rule for validation.
 */
const checkRuleSchema = z.object({
  call: z.string(),
  args: z.record(z.string(), z.unknown()).optional(),
  message: z.string(),
});

/**
 * Common component properties shared by all components.
 */
const componentCommonSchema = z.object({
  id: componentIdSchema,
  accessibility: accessibilitySchema,
  weight: z.number().optional(),
});

// =============================================================================
// Token Enums
// =============================================================================

// Text variant tokens
const textVariantToken = z.enum(["h1", "h2", "h3", "h4", "h5", "caption", "body"]);

// Image fit tokens
const imageFitToken = z.enum(["contain", "cover", "fill", "none", "scale-down"]);

// Image variant tokens
const imageVariantToken = z.enum([
  "icon",
  "avatar",
  "smallFeature",
  "mediumFeature",
  "largeFeature",
  "header",
]);

// Button variant tokens
const buttonVariantToken = z.enum(["primary", "borderless"]);

// TextField variant tokens
const textFieldVariantToken = z.enum(["longText", "number", "shortText", "obscured"]);

// ChoicePicker variant tokens
const choicePickerVariantToken = z.enum(["multipleSelection", "mutuallyExclusive"]);

// Justify tokens (for Row/Column)
const justifyToken = z.enum([
  "start",
  "center",
  "end",
  "spaceBetween",
  "spaceAround",
  "spaceEvenly",
  "stretch",
]);

// Align tokens (for Row/Column/List)
const alignToken = z.enum(["start", "center", "end", "stretch"]);

// Divider axis tokens
const dividerAxisToken = z.enum(["horizontal", "vertical"]);

// List direction tokens
const listDirectionToken = z.enum(["vertical", "horizontal"]);

// Icon name tokens - subset of Material Icons
const iconNameToken = z.enum([
  "accountCircle",
  "add",
  "arrowBack",
  "arrowForward",
  "attachFile",
  "calendarToday",
  "call",
  "camera",
  "check",
  "close",
  "delete",
  "download",
  "edit",
  "event",
  "error",
  "fastForward",
  "favorite",
  "favoriteOff",
  "folder",
  "help",
  "home",
  "info",
  "locationOn",
  "lock",
  "lockOpen",
  "mail",
  "menu",
  "moreVert",
  "moreHoriz",
  "notificationsOff",
  "notifications",
  "pause",
  "payment",
  "person",
  "phone",
  "photo",
  "play",
  "print",
  "refresh",
  "rewind",
  "search",
  "send",
  "settings",
  "share",
  "shoppingCart",
  "skipNext",
  "skipPrevious",
  "star",
  "starHalf",
  "starOff",
  "stop",
  "upload",
  "visibility",
  "visibilityOff",
  "volumeDown",
  "volumeMute",
  "volumeOff",
  "volumeUp",
  "warning",
]);

// =============================================================================
// Layout Components (7)
// =============================================================================

/**
 * Row - Horizontal layout container.
 * Children are arranged left-to-right.
 */
export const rowSchema = componentCommonSchema.extend({
  component: z.literal("Row"),
  children: childListSchema,
  justify: justifyToken.optional(),
  align: alignToken.optional(),
});
export type Row = z.infer<typeof rowSchema>;

/**
 * Column - Vertical layout container.
 * Children are arranged top-to-bottom.
 */
export const columnSchema = componentCommonSchema.extend({
  component: z.literal("Column"),
  children: childListSchema,
  justify: justifyToken.optional(),
  align: alignToken.optional(),
});
export type Column = z.infer<typeof columnSchema>;

/**
 * List - Scrollable list of items.
 * Supports static or template-based children.
 */
export const listSchema = componentCommonSchema.extend({
  component: z.literal("List"),
  children: childListSchema,
  direction: listDirectionToken.optional(),
  align: alignToken.optional(),
});
export type List = z.infer<typeof listSchema>;

/**
 * Card - Container with elevation/border and padding.
 * Contains a single child component.
 */
export const cardSchema = componentCommonSchema.extend({
  component: z.literal("Card"),
  child: componentIdSchema,
});
export type Card = z.infer<typeof cardSchema>;

/**
 * Tab item for Tabs component.
 */
const tabItemSchema = z.object({
  title: dynamicStringSchema,
  child: componentIdSchema,
});

/**
 * Tabs - Tabbed interface with multiple panels.
 */
export const tabsSchema = componentCommonSchema.extend({
  component: z.literal("Tabs"),
  tabs: z.array(tabItemSchema),
});
export type Tabs = z.infer<typeof tabsSchema>;

/**
 * Divider - Visual separator line.
 */
export const dividerSchema = componentCommonSchema.extend({
  component: z.literal("Divider"),
  axis: dividerAxisToken.optional(),
});
export type Divider = z.infer<typeof dividerSchema>;

/**
 * Modal - Overlay dialog with trigger.
 */
export const modalSchema = componentCommonSchema.extend({
  component: z.literal("Modal"),
  trigger: componentIdSchema,
  content: componentIdSchema,
});
export type Modal = z.infer<typeof modalSchema>;

// =============================================================================
// Content Components (5)
// =============================================================================

/**
 * Text - Display text content with optional styling.
 */
export const textSchema = componentCommonSchema.extend({
  component: z.literal("Text"),
  text: dynamicStringSchema,
  variant: textVariantToken.optional(),
});
export type Text = z.infer<typeof textSchema>;

/**
 * Image - Display images from URLs.
 */
export const imageSchema = componentCommonSchema.extend({
  component: z.literal("Image"),
  url: dynamicStringSchema,
  fit: imageFitToken.optional(),
  variant: imageVariantToken.optional(),
});
export type Image = z.infer<typeof imageSchema>;

/**
 * Icon - Display icons using Material Icons or custom icon sets.
 * Accepts either a known icon name or a data binding.
 */
export const iconSchema = componentCommonSchema.extend({
  component: z.literal("Icon"),
  name: z.union([iconNameToken, dataBindingSchema, z.string()]),
});
export type Icon = z.infer<typeof iconSchema>;

/**
 * Video - Video player.
 */
export const videoSchema = componentCommonSchema.extend({
  component: z.literal("Video"),
  url: dynamicStringSchema,
});
export type Video = z.infer<typeof videoSchema>;

/**
 * AudioPlayer - Audio player with optional description.
 */
export const audioPlayerSchema = componentCommonSchema.extend({
  component: z.literal("AudioPlayer"),
  url: dynamicStringSchema,
  description: dynamicStringSchema.optional(),
});
export type AudioPlayer = z.infer<typeof audioPlayerSchema>;

// =============================================================================
// Input Components (6)
// =============================================================================

/**
 * Button - Clickable button with action support.
 */
export const buttonSchema = componentCommonSchema.extend({
  component: z.literal("Button"),
  child: componentIdSchema,
  variant: buttonVariantToken.optional(),
  action: actionSchema,
  checks: z.array(checkRuleSchema).optional(),
});
export type Button = z.infer<typeof buttonSchema>;

/**
 * CheckBox - Boolean toggle.
 */
export const checkBoxSchema = componentCommonSchema.extend({
  component: z.literal("CheckBox"),
  label: dynamicStringSchema,
  value: dynamicBooleanSchema,
  checks: z.array(checkRuleSchema).optional(),
});
export type CheckBox = z.infer<typeof checkBoxSchema>;

/**
 * TextField - Text input field.
 */
export const textFieldSchema = componentCommonSchema.extend({
  component: z.literal("TextField"),
  label: dynamicStringSchema,
  value: dynamicStringSchema.optional(),
  variant: textFieldVariantToken.optional(),
  checks: z.array(checkRuleSchema).optional(),
});
export type TextField = z.infer<typeof textFieldSchema>;

/**
 * DateTimeInput - Date and/or time picker.
 */
export const dateTimeInputSchema = componentCommonSchema.extend({
  component: z.literal("DateTimeInput"),
  value: dynamicStringSchema,
  enableDate: z.boolean().optional(),
  enableTime: z.boolean().optional(),
  min: dynamicStringSchema.optional(),
  max: dynamicStringSchema.optional(),
  checks: z.array(checkRuleSchema).optional(),
});
export type DateTimeInput = z.infer<typeof dateTimeInputSchema>;

/**
 * Option item for ChoicePicker.
 */
const choiceOptionSchema = z.object({
  label: dynamicStringSchema,
  value: z.string(),
});

/**
 * ChoicePicker - Select one or more options from a list.
 */
export const choicePickerSchema = componentCommonSchema.extend({
  component: z.literal("ChoicePicker"),
  label: dynamicStringSchema.optional(),
  variant: choicePickerVariantToken.optional(),
  options: z.array(choiceOptionSchema),
  value: dynamicStringListSchema,
  checks: z.array(checkRuleSchema).optional(),
});
export type ChoicePicker = z.infer<typeof choicePickerSchema>;

/**
 * Slider - Range slider for numeric input.
 */
export const sliderSchema = componentCommonSchema.extend({
  component: z.literal("Slider"),
  label: dynamicStringSchema.optional(),
  min: z.number(),
  max: z.number(),
  value: dynamicNumberSchema,
  checks: z.array(checkRuleSchema).optional(),
});
export type Slider = z.infer<typeof sliderSchema>;

// =============================================================================
// Discriminated Union
// =============================================================================

/**
 * Component schema - discriminated union of all 18 component types.
 * Uses `component` field as the discriminator.
 */
export const componentSchema = z.discriminatedUnion("component", [
  // Layout (7)
  rowSchema,
  columnSchema,
  listSchema,
  cardSchema,
  tabsSchema,
  dividerSchema,
  modalSchema,
  // Content (5)
  textSchema,
  imageSchema,
  iconSchema,
  videoSchema,
  audioPlayerSchema,
  // Input (6)
  buttonSchema,
  checkBoxSchema,
  textFieldSchema,
  dateTimeInputSchema,
  choicePickerSchema,
  sliderSchema,
]);

/**
 * A2UIComponent - TypeScript type for any valid component.
 */
export type A2UIComponent = z.infer<typeof componentSchema>;

// =============================================================================
// Exports
// =============================================================================

export {
  // Common types
  componentIdSchema,
  dataBindingSchema,
  dynamicStringSchema,
  dynamicNumberSchema,
  dynamicBooleanSchema,
  dynamicStringListSchema,
  childListSchema,
  actionSchema,
  checkRuleSchema,
  accessibilitySchema,
  functionCallSchema,
  // Tokens
  textVariantToken,
  imageFitToken,
  imageVariantToken,
  buttonVariantToken,
  textFieldVariantToken,
  choicePickerVariantToken,
  justifyToken,
  alignToken,
  dividerAxisToken,
  listDirectionToken,
  iconNameToken,
  // Option/Tab schemas
  choiceOptionSchema,
  tabItemSchema,
};
