/**
 * Form Event Tests
 *
 * TDD tests for form submission event helpers.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import {
  collectFormValues,
  createFormSubmitHandler,
  type FormValueRegistry,
  type FormSubmitHandler,
} from "./form";
import type { SendFn } from "./dispatch";

describe("collectFormValues", () => {
  it("collects values from registry", () => {
    const registry: FormValueRegistry = {
      get: vi.fn((name: string) => {
        const values: Record<string, unknown> = {
          username: "john",
          email: "john@example.com",
          age: 25,
        };
        return values[name];
      }),
      getAll: vi.fn(() => ({
        username: "john",
        email: "john@example.com",
        age: 25,
      })),
      fieldNames: ["username", "email", "age"],
    };

    const values = collectFormValues(registry);

    expect(values).toEqual({
      username: "john",
      email: "john@example.com",
      age: 25,
    });
  });

  it("uses getAll when available", () => {
    const getAllMock = vi.fn(() => ({
      name: "Alice",
      active: true,
    }));

    const registry: FormValueRegistry = {
      get: vi.fn(),
      getAll: getAllMock,
      fieldNames: ["name", "active"],
    };

    const values = collectFormValues(registry);

    expect(getAllMock).toHaveBeenCalledTimes(1);
    expect(values).toEqual({
      name: "Alice",
      active: true,
    });
  });

  it("falls back to get() when getAll not available", () => {
    const getMock = vi.fn((name: string) => {
      const values: Record<string, unknown> = {
        title: "Test",
        count: 42,
      };
      return values[name];
    });

    const registry: FormValueRegistry = {
      get: getMock,
      fieldNames: ["title", "count"],
    };

    const values = collectFormValues(registry);

    expect(getMock).toHaveBeenCalledWith("title");
    expect(getMock).toHaveBeenCalledWith("count");
    expect(values).toEqual({
      title: "Test",
      count: 42,
    });
  });

  it("handles empty registry", () => {
    const registry: FormValueRegistry = {
      get: vi.fn(),
      getAll: vi.fn(() => ({})),
      fieldNames: [],
    };

    const values = collectFormValues(registry);

    expect(values).toEqual({});
  });

  it("handles undefined values", () => {
    const registry: FormValueRegistry = {
      get: vi.fn(() => undefined),
      fieldNames: ["missing"],
    };

    const values = collectFormValues(registry);

    expect(values).toEqual({
      missing: undefined,
    });
  });
});

describe("createFormSubmitHandler", () => {
  let mockSendFn: ReturnType<typeof vi.fn>;
  let handler: FormSubmitHandler;

  beforeEach(() => {
    mockSendFn = vi.fn();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-01T12:00:00Z"));
    handler = createFormSubmitHandler({
      surfaceId: "form-surface",
      sendFn: mockSendFn,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("dispatches submit action with collected form values", () => {
    const registry: FormValueRegistry = {
      get: vi.fn(),
      getAll: vi.fn(() => ({
        firstName: "John",
        lastName: "Doe",
      })),
      fieldNames: ["firstName", "lastName"],
    };

    handler.submit({
      componentId: "contact-form",
      registry,
    });

    expect(mockSendFn).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "action",
        surfaceId: "form-surface",
        sourceComponentId: "contact-form",
        actionName: "submit",
        context: {
          formValues: {
            firstName: "John",
            lastName: "Doe",
          },
        },
      })
    );
  });

  it("uses custom actionName when provided", () => {
    const registry: FormValueRegistry = {
      get: vi.fn(),
      getAll: vi.fn(() => ({ data: "test" })),
      fieldNames: ["data"],
    };

    handler.submit({
      componentId: "search-form",
      registry,
      actionName: "search",
    });

    expect(mockSendFn).toHaveBeenCalledWith(
      expect.objectContaining({
        actionName: "search",
      })
    );
  });

  it("includes dataBindings when provided", () => {
    const registry: FormValueRegistry = {
      get: vi.fn(),
      getAll: vi.fn(() => ({ query: "test" })),
      fieldNames: ["query"],
    };

    handler.submit({
      componentId: "edit-form",
      registry,
      dataBindings: {
        "/item/id": "item-123",
      },
    });

    expect(mockSendFn).toHaveBeenCalledWith(
      expect.objectContaining({
        context: {
          formValues: { query: "test" },
          dataBindings: { "/item/id": "item-123" },
        },
      })
    );
  });

  it("resolves bindings from dataModel", () => {
    const registry: FormValueRegistry = {
      get: vi.fn(),
      getAll: vi.fn(() => ({ value: "new" })),
      fieldNames: ["value"],
    };

    handler.submit({
      componentId: "update-form",
      registry,
      resolveBindings: ["/record/id", "/record/version"],
      dataModel: {
        record: { id: "rec-456", version: 3 },
      },
    });

    expect(mockSendFn).toHaveBeenCalledWith(
      expect.objectContaining({
        context: expect.objectContaining({
          dataBindings: {
            "/record/id": "rec-456",
            "/record/version": 3,
          },
        }),
      })
    );
  });

  it("merges resolved bindings with provided dataBindings", () => {
    const registry: FormValueRegistry = {
      get: vi.fn(),
      getAll: vi.fn(() => ({})),
      fieldNames: [],
    };

    handler.submit({
      componentId: "merge-form",
      registry,
      dataBindings: { "/static": "value" },
      resolveBindings: ["/dynamic"],
      dataModel: { dynamic: "resolved" },
    });

    expect(mockSendFn).toHaveBeenCalledWith(
      expect.objectContaining({
        context: expect.objectContaining({
          dataBindings: {
            "/static": "value",
            "/dynamic": "resolved",
          },
        }),
      })
    );
  });

  it("allows overriding surfaceId", () => {
    const registry: FormValueRegistry = {
      get: vi.fn(),
      getAll: vi.fn(() => ({})),
      fieldNames: [],
    };

    handler.submit({
      surfaceId: "modal-surface",
      componentId: "modal-form",
      registry,
    });

    expect(mockSendFn).toHaveBeenCalledWith(
      expect.objectContaining({
        surfaceId: "modal-surface",
      })
    );
  });

  it("includes timestamp in event", () => {
    const registry: FormValueRegistry = {
      get: vi.fn(),
      getAll: vi.fn(() => ({})),
      fieldNames: [],
    };

    handler.submit({
      componentId: "timestamp-form",
      registry,
    });

    expect(mockSendFn).toHaveBeenCalledWith(
      expect.objectContaining({
        timestamp: expect.any(Number),
      })
    );
  });

  it("returns the dispatched action message", () => {
    const registry: FormValueRegistry = {
      get: vi.fn(),
      getAll: vi.fn(() => ({ field: "value" })),
      fieldNames: ["field"],
    };

    const result = handler.submit({
      componentId: "return-form",
      registry,
    });

    expect(result).toEqual({
      type: "action",
      surfaceId: "form-surface",
      sourceComponentId: "return-form",
      actionName: "submit",
      context: {
        formValues: { field: "value" },
      },
      timestamp: expect.any(Number),
    });
  });
});
