import { z } from "zod";

/**
 * A2UI v0.9 Common Types
 *
 * Shared type definitions used across message and component schemas.
 * Based on: https://a2ui.org/specification/v0.9-a2ui/
 */

// ============================================================================
// Identifiers
// ============================================================================

/**
 * Unique identifier for a component within a surface.
 * Format: alphanumeric string, typically kebab-case or UUID.
 */
export const componentIdSchema = z.string().min(1);
export type ComponentId = z.infer<typeof componentIdSchema>;

/**
 * Unique identifier for a surface (UI container).
 * Format: alphanumeric string, typically kebab-case or UUID.
 */
export const surfaceIdSchema = z.string().min(1);
export type SurfaceId = z.infer<typeof surfaceIdSchema>;

/**
 * Catalog identifier for component definitions.
 * Example: "standard", "custom-v1"
 */
export const catalogIdSchema = z.string().min(1);
export type CatalogId = z.infer<typeof catalogIdSchema>;

// ============================================================================
// Dynamic Values (Data Binding)
// ============================================================================

/**
 * DynamicString: Either a literal string or a JSON Pointer reference.
 * JSON Pointer format: "/path/to/data" (RFC 6901)
 *
 * Examples:
 * - "Hello World" (literal)
 * - "/user/name" (data binding)
 */
export const dynamicStringSchema = z.string();
export type DynamicString = z.infer<typeof dynamicStringSchema>;

/**
 * DynamicNumber: Either a literal number or a JSON Pointer reference.
 *
 * Examples:
 * - 42 (literal)
 * - "/metrics/count" (data binding)
 */
export const dynamicNumberSchema = z.union([z.number(), z.string()]);
export type DynamicNumber = z.infer<typeof dynamicNumberSchema>;

/**
 * DynamicBoolean: Either a literal boolean or a JSON Pointer reference.
 *
 * Examples:
 * - true (literal)
 * - "/flags/isActive" (data binding)
 */
export const dynamicBooleanSchema = z.union([z.boolean(), z.string()]);
export type DynamicBoolean = z.infer<typeof dynamicBooleanSchema>;

// ============================================================================
// Component Structure
// ============================================================================

/**
 * ChildList: Array of component IDs representing child components.
 * Used in container components (container, row, column, grid, etc.)
 */
export const childListSchema = z.array(componentIdSchema);
export type ChildList = z.infer<typeof childListSchema>;

// ============================================================================
// JSON Pointer
// ============================================================================

/**
 * JSON Pointer path (RFC 6901).
 * Format: "/path/to/data" or "" (root)
 *
 * Examples:
 * - "" (root)
 * - "/user"
 * - "/user/profile/name"
 */
export const jsonPointerSchema = z.string();
export type JsonPointer = z.infer<typeof jsonPointerSchema>;
