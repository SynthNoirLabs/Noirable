/**
 * A2UI v0.9 Form Event Helpers
 *
 * Provides utilities for collecting form values and dispatching form submission events.
 */

import type { ActionMessage } from "../schema/messages";
import { resolvePointer } from "../binding";
import { type SendFn } from "./dispatch";

// ============================================================================
// Types
// ============================================================================

/** Registry interface for form value collection */
export type FormValueRegistry = {
  /** Get a single field value by name */
  get: (name: string) => unknown;
  /** Get all field values at once (optional, preferred when available) */
  getAll?: () => Record<string, unknown>;
  /** List of field names in the form */
  fieldNames: string[];
};

/** Configuration for form submit handler */
export type FormSubmitHandlerOptions = {
  /** Default surface ID for events */
  surfaceId: string;
  /** Function to send events */
  sendFn: SendFn;
};

/** Parameters for submit method */
export type SubmitParams = {
  /** Override surface ID */
  surfaceId?: string;
  /** Component ID of the form */
  componentId: string;
  /** Form value registry to collect values from */
  registry: FormValueRegistry;
  /** Custom action name (default: "submit") */
  actionName?: string;
  /** Pre-resolved data bindings to include */
  dataBindings?: Record<string, unknown>;
  /** JSON Pointer paths to resolve from dataModel */
  resolveBindings?: string[];
  /** Data model for binding resolution */
  dataModel?: Record<string, unknown>;
};

/** Form submit handler instance */
export type FormSubmitHandler = {
  /** Submit the form and dispatch action event */
  submit: (params: SubmitParams) => ActionMessage;
};

// ============================================================================
// Form Value Collection
// ============================================================================

/**
 * Collect all form values from a registry.
 *
 * Uses `getAll()` if available, otherwise falls back to
 * iterating over `fieldNames` and calling `get()` for each.
 *
 * @param registry - Form value registry
 * @returns Record of field names to values
 */
export function collectFormValues(registry: FormValueRegistry): Record<string, unknown> {
  // Prefer getAll for efficiency
  if (registry.getAll) {
    return registry.getAll();
  }

  // Fall back to individual field collection
  const values: Record<string, unknown> = {};
  for (const name of registry.fieldNames) {
    values[name] = registry.get(name);
  }
  return values;
}

// ============================================================================
// Form Submit Handler Factory
// ============================================================================

/**
 * Create a form submit handler bound to a surface.
 *
 * Collects form values, resolves data bindings, and dispatches
 * submit action events.
 *
 * @param options - Handler configuration
 * @returns FormSubmitHandler instance
 */
export function createFormSubmitHandler(options: FormSubmitHandlerOptions): FormSubmitHandler {
  const { surfaceId: defaultSurfaceId, sendFn } = options;

  function submit(params: SubmitParams): ActionMessage {
    const {
      surfaceId = defaultSurfaceId,
      componentId,
      registry,
      actionName = "submit",
      dataBindings,
      resolveBindings,
      dataModel,
    } = params;

    // Collect form values
    const formValues = collectFormValues(registry);

    // Resolve data bindings if requested
    let resolvedBindings = dataBindings ? { ...dataBindings } : undefined;
    if (resolveBindings && resolveBindings.length > 0) {
      resolvedBindings = resolvedBindings || {};
      const model = dataModel || {};

      for (const path of resolveBindings) {
        resolvedBindings[path] = resolvePointer(model, path);
      }
    }

    // Build context
    const hasFormValues = Object.keys(formValues).length > 0;
    const hasDataBindings = resolvedBindings && Object.keys(resolvedBindings).length > 0;

    const context = {
      ...(hasFormValues && { formValues }),
      ...(hasDataBindings && { dataBindings: resolvedBindings }),
    };

    // Build and send event
    const event: ActionMessage = {
      type: "action",
      surfaceId,
      sourceComponentId: componentId,
      actionName,
      context: Object.keys(context).length > 0 ? context : undefined,
      timestamp: Date.now(),
    };

    sendFn(event);

    return event;
  }

  return { submit };
}
