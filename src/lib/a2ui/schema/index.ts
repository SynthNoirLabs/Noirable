/**
 * A2UI v0.9 Schema - Public API
 *
 * Exports all Zod schemas and TypeScript types for A2UI v0.9 protocol.
 */

// ============================================================================
// Common Types
// ============================================================================

export {
  componentIdSchema,
  surfaceIdSchema,
  catalogIdSchema,
  dynamicStringSchema,
  dynamicNumberSchema,
  dynamicBooleanSchema,
  childListSchema,
  jsonPointerSchema,
} from "./common";

export type {
  ComponentId,
  SurfaceId,
  CatalogId,
  DynamicString,
  DynamicNumber,
  DynamicBoolean,
  ChildList,
  JsonPointer,
} from "./common";

// ============================================================================
// Message Schemas
// ============================================================================

export {
  createSurfaceMessageSchema,
  updateComponentsMessageSchema,
  updateDataModelMessageSchema,
  deleteSurfaceMessageSchema,
  serverMessageSchema,
  actionMessageSchema,
  clientMessageSchema,
} from "./messages";

export type {
  CreateSurfaceMessage,
  UpdateComponentsMessage,
  UpdateDataModelMessage,
  DeleteSurfaceMessage,
  ServerMessage,
  ActionMessage,
  ClientMessage,
} from "./messages";
