/**
 * A2UI v0.9 Event Dispatch
 *
 * Handles client-to-server action event dispatch.
 * Includes debouncing, timestamp tracking, and data binding resolution.
 */

import type { ActionMessage } from "../schema/messages";
import { resolvePointer } from "../binding";

// ============================================================================
// Types
// ============================================================================

/** Parameters for dispatching an action event */
export type ActionEventParams = {
  surfaceId: string;
  componentId: string;
  actionName: string;
  formValues?: Record<string, unknown>;
  dataBindings?: Record<string, unknown>;
};

/** Function to send event to server */
export type SendFn = (event: ActionMessage) => void;

/** Parameters for dispatcher dispatch method (surfaceId optional) */
export type DispatchParams = Omit<ActionEventParams, "surfaceId"> & {
  surfaceId?: string;
  /** JSON Pointer paths to resolve from dataModel */
  resolveBindings?: string[];
  /** Data model for binding resolution */
  dataModel?: Record<string, unknown>;
};

/** Event dispatcher configuration */
export type EventDispatcherOptions = {
  surfaceId: string;
  sendFn: SendFn;
  /** Debounce window in milliseconds (default: 300) */
  debounceMs?: number;
};

/** Event dispatcher instance */
export type EventDispatcher = {
  /** Dispatch an action event */
  dispatch: (params: DispatchParams) => ActionMessage | null;
  /** Clean up dispatcher state */
  dispose: () => void;
};

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_DEBOUNCE_MS = 300;

// ============================================================================
// Core Dispatch Function
// ============================================================================

/**
 * Dispatch a single action event.
 *
 * Creates an ActionMessage and sends it via the provided send function.
 * Does not include debouncing - use createEventDispatcher for that.
 *
 * @param params - Action event parameters
 * @param sendFn - Function to send the event
 * @returns The dispatched ActionMessage
 */
export function dispatchAction(params: ActionEventParams, sendFn: SendFn): ActionMessage {
  const { surfaceId, componentId, actionName, formValues, dataBindings } = params;

  // Build context only if we have values
  const hasFormValues = formValues && Object.keys(formValues).length > 0;
  const hasDataBindings = dataBindings && Object.keys(dataBindings).length > 0;

  const context =
    hasFormValues || hasDataBindings
      ? {
          ...(hasFormValues && { formValues }),
          ...(hasDataBindings && { dataBindings }),
        }
      : undefined;

  const event: ActionMessage = {
    type: "action",
    surfaceId,
    sourceComponentId: componentId,
    actionName,
    timestamp: Date.now(),
    ...(context && { context }),
  };

  sendFn(event);

  return event;
}

// ============================================================================
// Event Dispatcher Factory
// ============================================================================

/**
 * Create an event dispatcher bound to a surface.
 *
 * Features:
 * - Pre-configured surfaceId (can be overridden per-dispatch)
 * - Debouncing per component (default: 300ms)
 * - Data binding resolution from data model
 *
 * @param options - Dispatcher configuration
 * @returns EventDispatcher instance
 */
export function createEventDispatcher(options: EventDispatcherOptions): EventDispatcher {
  const { surfaceId: defaultSurfaceId, sendFn, debounceMs = DEFAULT_DEBOUNCE_MS } = options;

  // Track last dispatch time per component for debouncing
  const lastDispatchMap = new Map<string, number>();

  function dispatch(params: DispatchParams): ActionMessage | null {
    const {
      surfaceId = defaultSurfaceId,
      componentId,
      actionName,
      formValues,
      dataBindings,
      resolveBindings,
      dataModel,
    } = params;

    const now = Date.now();
    const lastDispatch = lastDispatchMap.get(componentId);

    // Debounce check
    if (lastDispatch !== undefined && now - lastDispatch < debounceMs) {
      return null;
    }

    // Update last dispatch time
    lastDispatchMap.set(componentId, now);

    // Resolve data bindings if requested
    let resolvedBindings = dataBindings;
    if (resolveBindings && resolveBindings.length > 0) {
      resolvedBindings = resolvedBindings || {};
      const model = dataModel || {};

      for (const path of resolveBindings) {
        resolvedBindings[path] = resolvePointer(model, path);
      }
    }

    return dispatchAction(
      {
        surfaceId,
        componentId,
        actionName,
        formValues,
        dataBindings: resolvedBindings,
      },
      sendFn
    );
  }

  function dispose(): void {
    lastDispatchMap.clear();
  }

  return {
    dispatch,
    dispose,
  };
}
