/**
 * A2UI v0.9 Standard Component Catalog
 *
 * Public exports for the standard catalog implementation.
 * Based on: https://github.com/google/A2UI/blob/main/specification/v0_9/json/standard_catalog.json
 */

// Layout Components (7)
export {
  rowSchema,
  columnSchema,
  listSchema,
  cardSchema,
  tabsSchema,
  dividerSchema,
  modalSchema,
  type Row,
  type Column,
  type List,
  type Card,
  type Tabs,
  type Divider,
  type Modal,
} from "./components";

// Content Components (5)
export {
  textSchema,
  imageSchema,
  iconSchema,
  videoSchema,
  audioPlayerSchema,
  type Text,
  type Image,
  type Icon,
  type Video,
  type AudioPlayer,
} from "./components";

// Input Components (6)
export {
  buttonSchema,
  checkBoxSchema,
  textFieldSchema,
  dateTimeInputSchema,
  choicePickerSchema,
  sliderSchema,
  type Button,
  type CheckBox,
  type TextField,
  type DateTimeInput,
  type ChoicePicker,
  type Slider,
} from "./components";

// Discriminated Union
export { componentSchema, type A2UIComponent } from "./components";

// Common Types
export {
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
} from "./components";

// Tokens
export {
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
} from "./components";

// Sub-schemas
export { choiceOptionSchema, tabItemSchema } from "./components";
