import { describe, it, expect } from "vitest";
import {
  createSurfaceMessageSchema,
  updateComponentsMessageSchema,
  updateDataModelMessageSchema,
  deleteSurfaceMessageSchema,
  actionMessageSchema,
  serverMessageSchema,
  clientMessageSchema,
} from "./messages";

describe("A2UI Message Schemas", () => {
  describe("Server-to-Client Messages", () => {
    describe("createSurfaceMessageSchema", () => {
      it("validates minimal createSurface message", () => {
        const data = {
          type: "createSurface",
          surfaceId: "main-surface",
          catalogId: "standard",
        };
        const result = createSurfaceMessageSchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.type).toBe("createSurface");
          expect(result.data.surfaceId).toBe("main-surface");
          expect(result.data.catalogId).toBe("standard");
        }
      });

      it("validates createSurface with optional fields", () => {
        const data = {
          type: "createSurface",
          surfaceId: "themed-surface",
          catalogId: "custom-v1",
          theme: "dark",
          sendDataModel: true,
        };
        const result = createSurfaceMessageSchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.theme).toBe("dark");
          expect(result.data.sendDataModel).toBe(true);
        }
      });

      it("rejects createSurface without required fields", () => {
        const data = {
          type: "createSurface",
          surfaceId: "main-surface",
          // Missing catalogId
        };
        const result = createSurfaceMessageSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it("rejects createSurface with wrong type", () => {
        const data = {
          type: "updateComponents",
          surfaceId: "main-surface",
          catalogId: "standard",
        };
        const result = createSurfaceMessageSchema.safeParse(data);
        expect(result.success).toBe(false);
      });
    });

    describe("updateComponentsMessageSchema", () => {
      it("validates updateComponents message", () => {
        const data = {
          type: "updateComponents",
          surfaceId: "main-surface",
          components: [
            {
              id: "btn-1",
              type: "button",
              label: "Submit",
            },
            {
              id: "card-1",
              type: "card",
              title: "Evidence",
            },
          ],
        };
        const result = updateComponentsMessageSchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.type).toBe("updateComponents");
          expect(result.data.components).toHaveLength(2);
          expect(result.data.components[0].id).toBe("btn-1");
        }
      });

      it("validates updateComponents with empty components array", () => {
        const data = {
          type: "updateComponents",
          surfaceId: "main-surface",
          components: [],
        };
        const result = updateComponentsMessageSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it("rejects updateComponents without components field", () => {
        const data = {
          type: "updateComponents",
          surfaceId: "main-surface",
        };
        const result = updateComponentsMessageSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it("rejects updateComponents with invalid component structure", () => {
        const data = {
          type: "updateComponents",
          surfaceId: "main-surface",
          components: [
            {
              // Missing id
              type: "button",
              label: "Submit",
            },
          ],
        };
        const result = updateComponentsMessageSchema.safeParse(data);
        expect(result.success).toBe(false);
      });
    });

    describe("updateDataModelMessageSchema", () => {
      it("validates updateDataModel with root path", () => {
        const data = {
          type: "updateDataModel",
          surfaceId: "main-surface",
          path: "",
          value: { user: { name: "John Doe" } },
        };
        const result = updateDataModelMessageSchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.type).toBe("updateDataModel");
          expect(result.data.path).toBe("");
          expect(result.data.value).toEqual({ user: { name: "John Doe" } });
        }
      });

      it("validates updateDataModel with nested path", () => {
        const data = {
          type: "updateDataModel",
          surfaceId: "main-surface",
          path: "/user/name",
          value: "Jane Doe",
        };
        const result = updateDataModelMessageSchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.path).toBe("/user/name");
          expect(result.data.value).toBe("Jane Doe");
        }
      });

      it("validates updateDataModel with null value", () => {
        const data = {
          type: "updateDataModel",
          surfaceId: "main-surface",
          path: "/user/deleted",
          value: null,
        };
        const result = updateDataModelMessageSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it("rejects updateDataModel without path", () => {
        const data = {
          type: "updateDataModel",
          surfaceId: "main-surface",
          value: "test",
        };
        const result = updateDataModelMessageSchema.safeParse(data);
        expect(result.success).toBe(false);
      });
    });

    describe("deleteSurfaceMessageSchema", () => {
      it("validates deleteSurface message", () => {
        const data = {
          type: "deleteSurface",
          surfaceId: "old-surface",
        };
        const result = deleteSurfaceMessageSchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.type).toBe("deleteSurface");
          expect(result.data.surfaceId).toBe("old-surface");
        }
      });

      it("rejects deleteSurface without surfaceId", () => {
        const data = {
          type: "deleteSurface",
        };
        const result = deleteSurfaceMessageSchema.safeParse(data);
        expect(result.success).toBe(false);
      });
    });

    describe("serverMessageSchema (discriminated union)", () => {
      it("discriminates createSurface messages", () => {
        const data = {
          type: "createSurface",
          surfaceId: "main",
          catalogId: "standard",
        };
        const result = serverMessageSchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.type).toBe("createSurface");
        }
      });

      it("discriminates updateComponents messages", () => {
        const data = {
          type: "updateComponents",
          surfaceId: "main",
          components: [],
        };
        const result = serverMessageSchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.type).toBe("updateComponents");
        }
      });

      it("discriminates updateDataModel messages", () => {
        const data = {
          type: "updateDataModel",
          surfaceId: "main",
          path: "/data",
          value: 123,
        };
        const result = serverMessageSchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.type).toBe("updateDataModel");
        }
      });

      it("discriminates deleteSurface messages", () => {
        const data = {
          type: "deleteSurface",
          surfaceId: "main",
        };
        const result = serverMessageSchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.type).toBe("deleteSurface");
        }
      });

      it("rejects unknown message types", () => {
        const data = {
          type: "unknownMessage",
          surfaceId: "main",
        };
        const result = serverMessageSchema.safeParse(data);
        expect(result.success).toBe(false);
      });
    });
  });

  describe("Client-to-Server Messages", () => {
    describe("actionMessageSchema", () => {
      it("validates minimal action message", () => {
        const data = {
          type: "action",
          surfaceId: "main-surface",
          sourceComponentId: "btn-submit",
          actionName: "click",
          timestamp: 1738411200000,
        };
        const result = actionMessageSchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.type).toBe("action");
          expect(result.data.surfaceId).toBe("main-surface");
          expect(result.data.sourceComponentId).toBe("btn-submit");
          expect(result.data.actionName).toBe("click");
          expect(result.data.timestamp).toBe(1738411200000);
        }
      });

      it("validates action with context", () => {
        const data = {
          type: "action",
          surfaceId: "main-surface",
          sourceComponentId: "form-1",
          actionName: "submit",
          timestamp: Date.now(),
          context: {
            formValues: {
              name: "John Doe",
              email: "john@example.com",
            },
            dataBindings: {
              "/user/name": "John Doe",
            },
          },
        };
        const result = actionMessageSchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.context).toBeDefined();
          expect(result.data.context?.formValues).toEqual({
            name: "John Doe",
            email: "john@example.com",
          });
        }
      });

      it("rejects action without required fields", () => {
        const data = {
          type: "action",
          surfaceId: "main-surface",
          // Missing sourceComponentId and actionName
        };
        const result = actionMessageSchema.safeParse(data);
        expect(result.success).toBe(false);
      });
    });

    describe("clientMessageSchema (discriminated union)", () => {
      it("discriminates action messages", () => {
        const data = {
          type: "action",
          surfaceId: "main",
          sourceComponentId: "btn-1",
          actionName: "click",
          timestamp: Date.now(),
        };
        const result = clientMessageSchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.type).toBe("action");
        }
      });

      it("rejects unknown client message types", () => {
        const data = {
          type: "unknownClientMessage",
          surfaceId: "main",
        };
        const result = clientMessageSchema.safeParse(data);
        expect(result.success).toBe(false);
      });
    });
  });
});
