/**
 * A2UI v0.9 Event System
 *
 * Client-to-server event dispatch for user interactions.
 *
 * @example
 * ```typescript
 * import {
 *   createEventDispatcher,
 *   createFormSubmitHandler,
 *   collectFormValues,
 * } from '@/lib/a2ui/events';
 *
 * // Create dispatcher bound to a surface
 * const dispatcher = createEventDispatcher({
 *   surfaceId: 'main',
 *   sendFn: (event) => websocket.send(JSON.stringify(event)),
 * });
 *
 * // Dispatch button click
 * dispatcher.dispatch({
 *   componentId: 'btn-save',
 *   actionName: 'click',
 * });
 *
 * // Dispatch with data binding resolution
 * dispatcher.dispatch({
 *   componentId: 'btn-delete',
 *   actionName: 'delete',
 *   resolveBindings: ['/item/id'],
 *   dataModel: { item: { id: 'item-123' } },
 * });
 *
 * // Form submission
 * const formHandler = createFormSubmitHandler({
 *   surfaceId: 'main',
 *   sendFn: (event) => websocket.send(JSON.stringify(event)),
 * });
 *
 * formHandler.submit({
 *   componentId: 'contact-form',
 *   registry: formValueRegistry,
 * });
 * ```
 */

// Dispatch
export {
  dispatchAction,
  createEventDispatcher,
  type ActionEventParams,
  type SendFn,
  type DispatchParams,
  type EventDispatcherOptions,
  type EventDispatcher,
} from "./dispatch";

// Form
export {
  collectFormValues,
  createFormSubmitHandler,
  type FormValueRegistry,
  type FormSubmitHandlerOptions,
  type SubmitParams,
  type FormSubmitHandler,
} from "./form";
