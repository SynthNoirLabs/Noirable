/**
 * Event Dispatch Tests
 *
 * TDD tests for client-to-server event dispatch.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import {
  dispatchAction,
  createEventDispatcher,
  type EventDispatcher,
  type ActionEventParams,
} from "./dispatch";

describe("dispatchAction", () => {
  let mockSendFn: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockSendFn = vi.fn();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-01T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("dispatches action event with correct structure", () => {
    const params: ActionEventParams = {
      surfaceId: "surface-1",
      componentId: "btn-submit",
      actionName: "click",
    };

    const event = dispatchAction(params, mockSendFn);

    expect(mockSendFn).toHaveBeenCalledTimes(1);
    expect(event).toEqual({
      type: "action",
      surfaceId: "surface-1",
      sourceComponentId: "btn-submit",
      actionName: "click",
      timestamp: expect.any(Number),
    });
    expect(event.timestamp).toBe(Date.now());
  });

  it("includes formValues in context when provided", () => {
    const params: ActionEventParams = {
      surfaceId: "surface-1",
      componentId: "form-contact",
      actionName: "submit",
      formValues: {
        name: "John Doe",
        email: "john@example.com",
      },
    };

    const event = dispatchAction(params, mockSendFn);

    expect(event.context).toEqual({
      formValues: {
        name: "John Doe",
        email: "john@example.com",
      },
    });
  });

  it("includes dataBindings in context when provided", () => {
    const params: ActionEventParams = {
      surfaceId: "surface-1",
      componentId: "btn-save",
      actionName: "click",
      dataBindings: {
        "/user/id": "user-123",
        "/user/role": "admin",
      },
    };

    const event = dispatchAction(params, mockSendFn);

    expect(event.context).toEqual({
      dataBindings: {
        "/user/id": "user-123",
        "/user/role": "admin",
      },
    });
  });

  it("includes both formValues and dataBindings when provided", () => {
    const params: ActionEventParams = {
      surfaceId: "surface-1",
      componentId: "form-edit",
      actionName: "submit",
      formValues: { title: "Test" },
      dataBindings: { "/item/id": "item-1" },
    };

    const event = dispatchAction(params, mockSendFn);

    expect(event.context).toEqual({
      formValues: { title: "Test" },
      dataBindings: { "/item/id": "item-1" },
    });
  });

  it("omits context when neither formValues nor dataBindings provided", () => {
    const params: ActionEventParams = {
      surfaceId: "surface-1",
      componentId: "btn-cancel",
      actionName: "click",
    };

    const event = dispatchAction(params, mockSendFn);

    expect(event.context).toBeUndefined();
  });

  it("uses current timestamp for each dispatch", () => {
    const params: ActionEventParams = {
      surfaceId: "s1",
      componentId: "c1",
      actionName: "click",
    };

    const event1 = dispatchAction(params, mockSendFn);
    const timestamp1 = event1.timestamp;

    vi.advanceTimersByTime(1000);
    const event2 = dispatchAction(params, mockSendFn);

    // Second dispatch should be 1000ms later
    expect(event2.timestamp - timestamp1).toBe(1000);
  });
});

describe("createEventDispatcher", () => {
  let mockSendFn: ReturnType<typeof vi.fn>;
  let dispatcher: EventDispatcher;

  beforeEach(() => {
    mockSendFn = vi.fn();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-01T12:00:00Z"));
    dispatcher = createEventDispatcher({
      surfaceId: "main-surface",
      sendFn: mockSendFn,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("creates dispatcher bound to surfaceId", () => {
    dispatcher.dispatch({
      componentId: "btn-1",
      actionName: "click",
    });

    expect(mockSendFn).toHaveBeenCalledWith({
      type: "action",
      surfaceId: "main-surface",
      sourceComponentId: "btn-1",
      actionName: "click",
      timestamp: expect.any(Number),
    });
  });

  it("allows overriding surfaceId per dispatch", () => {
    dispatcher.dispatch({
      surfaceId: "modal-surface",
      componentId: "btn-close",
      actionName: "click",
    });

    expect(mockSendFn).toHaveBeenCalledWith(
      expect.objectContaining({
        surfaceId: "modal-surface",
      })
    );
  });

  it("debounces rapid clicks by default (300ms)", async () => {
    dispatcher.dispatch({ componentId: "btn-spam", actionName: "click" });
    dispatcher.dispatch({ componentId: "btn-spam", actionName: "click" });
    dispatcher.dispatch({ componentId: "btn-spam", actionName: "click" });

    // Should only send once immediately
    expect(mockSendFn).toHaveBeenCalledTimes(1);

    // After debounce window, should accept new clicks
    vi.advanceTimersByTime(300);
    dispatcher.dispatch({ componentId: "btn-spam", actionName: "click" });
    expect(mockSendFn).toHaveBeenCalledTimes(2);
  });

  it("tracks last dispatch per component", () => {
    dispatcher.dispatch({ componentId: "btn-a", actionName: "click" });
    dispatcher.dispatch({ componentId: "btn-b", actionName: "click" });

    // Different components should not debounce each other
    expect(mockSendFn).toHaveBeenCalledTimes(2);
  });

  it("clears debounce state on dispose", () => {
    dispatcher.dispatch({ componentId: "btn-spam", actionName: "click" });
    dispatcher.dispose();

    // After dispose, debounce state cleared - new dispatcher works fresh
    const newDispatcher = createEventDispatcher({
      surfaceId: "main-surface",
      sendFn: mockSendFn,
    });
    newDispatcher.dispatch({ componentId: "btn-spam", actionName: "click" });
    expect(mockSendFn).toHaveBeenCalledTimes(2);
  });

  it("resolves data bindings from dataModel", () => {
    const dataModel = {
      user: { id: "u-123", name: "Alice" },
      cart: { total: 99.99 },
    };

    dispatcher.dispatch({
      componentId: "btn-checkout",
      actionName: "submit",
      resolveBindings: ["/user/id", "/cart/total"],
      dataModel,
    });

    expect(mockSendFn).toHaveBeenCalledWith(
      expect.objectContaining({
        context: expect.objectContaining({
          dataBindings: {
            "/user/id": "u-123",
            "/cart/total": 99.99,
          },
        }),
      })
    );
  });

  it("handles missing binding paths gracefully", () => {
    dispatcher.dispatch({
      componentId: "btn-save",
      actionName: "click",
      resolveBindings: ["/missing/path"],
      dataModel: {},
    });

    expect(mockSendFn).toHaveBeenCalledWith(
      expect.objectContaining({
        context: {
          dataBindings: {
            "/missing/path": undefined,
          },
        },
      })
    );
  });
});
