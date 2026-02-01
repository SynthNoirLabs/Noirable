import { z } from "zod";
import { surfaceIdSchema, componentIdSchema, catalogIdSchema, jsonPointerSchema } from "./common";

/**
 * A2UI v0.9 Message Schemas
 *
 * Defines the structure of messages exchanged between server and client.
 * Based on: https://a2ui.org/specification/v0.9-a2ui/#envelope-message-structure
 */

// ============================================================================
// Server-to-Client Messages
// ============================================================================

/**
 * createSurface: Initialize a new surface
 *
 * Creates a new UI surface with the specified catalog and optional theme.
 */
export const createSurfaceMessageSchema = z.object({
  type: z.literal("createSurface"),
  surfaceId: surfaceIdSchema,
  catalogId: catalogIdSchema,
  theme: z.string().optional(),
  sendDataModel: z.boolean().optional(),
});
export type CreateSurfaceMessage = z.infer<typeof createSurfaceMessageSchema>;

/**
 * updateComponents: Update component tree
 *
 * Updates the component tree for a surface. Components are identified by their
 * `id` field and must have a `type` field for discrimination.
 *
 * Note: Component structure validation is minimal here - full component
 * validation happens in the component catalog (Task 4).
 */
export const updateComponentsMessageSchema = z.object({
  type: z.literal("updateComponents"),
  surfaceId: surfaceIdSchema,
  components: z.array(
    z
      .object({
        id: componentIdSchema,
        type: z.string(),
        // Additional fields are component-specific and validated by catalog
      })
      .passthrough()
  ),
});
export type UpdateComponentsMessage = z.infer<typeof updateComponentsMessageSchema>;

/**
 * updateDataModel: Update data at JSON Pointer path
 *
 * Updates the data model at the specified JSON Pointer path.
 * Value can be any JSON-serializable type.
 */
export const updateDataModelMessageSchema = z.object({
  type: z.literal("updateDataModel"),
  surfaceId: surfaceIdSchema,
  path: jsonPointerSchema,
  value: z.unknown(),
});
export type UpdateDataModelMessage = z.infer<typeof updateDataModelMessageSchema>;

/**
 * deleteSurface: Remove a surface
 *
 * Removes a surface and all its associated components and data.
 */
export const deleteSurfaceMessageSchema = z.object({
  type: z.literal("deleteSurface"),
  surfaceId: surfaceIdSchema,
});
export type DeleteSurfaceMessage = z.infer<typeof deleteSurfaceMessageSchema>;

/**
 * Server Message Union
 *
 * Discriminated union of all server-to-client messages.
 * Uses the `type` field for discrimination.
 */
export const serverMessageSchema = z.discriminatedUnion("type", [
  createSurfaceMessageSchema,
  updateComponentsMessageSchema,
  updateDataModelMessageSchema,
  deleteSurfaceMessageSchema,
]);
export type ServerMessage = z.infer<typeof serverMessageSchema>;

// ============================================================================
// Client-to-Server Messages
// ============================================================================

/**
 * action: User interaction event
 *
 * Sent when a user interacts with a component (click, submit, change, etc.).
 * Optional context includes form values and data binding snapshots.
 */
export const actionMessageSchema = z.object({
  type: z.literal("action"),
  surfaceId: surfaceIdSchema,
  sourceComponentId: componentIdSchema,
  actionName: z.string(),
  context: z
    .object({
      formValues: z.record(z.string(), z.unknown()).optional(),
      dataBindings: z.record(z.string(), z.unknown()).optional(),
    })
    .optional(),
});
export type ActionMessage = z.infer<typeof actionMessageSchema>;

/**
 * Client Message Union
 *
 * Discriminated union of all client-to-server messages.
 * Currently only contains `action`, but structured for future expansion.
 */
export const clientMessageSchema = z.discriminatedUnion("type", [actionMessageSchema]);
export type ClientMessage = z.infer<typeof clientMessageSchema>;
