import { describe, it, expect } from "vitest";
import {
  componentIdSchema,
  surfaceIdSchema,
  catalogIdSchema,
  dynamicStringSchema,
  dynamicNumberSchema,
  dynamicBooleanSchema,
  childListSchema,
  jsonPointerSchema,
} from "./common";

describe("A2UI Common Types", () => {
  describe("componentIdSchema", () => {
    it("accepts valid component IDs", () => {
      const validIds = ["btn-submit", "card-1", "abc123", "user-profile-card"];

      validIds.forEach((id) => {
        const result = componentIdSchema.safeParse(id);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toBe(id);
        }
      });
    });

    it("rejects empty strings", () => {
      const result = componentIdSchema.safeParse("");
      expect(result.success).toBe(false);
    });

    it("rejects non-strings", () => {
      const result = componentIdSchema.safeParse(123);
      expect(result.success).toBe(false);
    });
  });

  describe("surfaceIdSchema", () => {
    it("accepts valid surface IDs", () => {
      const validIds = ["main-surface", "surface-1", "dashboard"];

      validIds.forEach((id) => {
        const result = surfaceIdSchema.safeParse(id);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toBe(id);
        }
      });
    });

    it("rejects empty strings", () => {
      const result = surfaceIdSchema.safeParse("");
      expect(result.success).toBe(false);
    });
  });

  describe("catalogIdSchema", () => {
    it("accepts valid catalog IDs", () => {
      const validIds = ["standard", "custom-v1", "experimental"];

      validIds.forEach((id) => {
        const result = catalogIdSchema.safeParse(id);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toBe(id);
        }
      });
    });

    it("rejects empty strings", () => {
      const result = catalogIdSchema.safeParse("");
      expect(result.success).toBe(false);
    });
  });

  describe("dynamicStringSchema", () => {
    it("accepts literal strings", () => {
      const result = dynamicStringSchema.safeParse("Hello World");
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe("Hello World");
      }
    });

    it("accepts JSON Pointer references", () => {
      const result = dynamicStringSchema.safeParse("/user/name");
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe("/user/name");
      }
    });

    it("accepts empty strings", () => {
      const result = dynamicStringSchema.safeParse("");
      expect(result.success).toBe(true);
    });
  });

  describe("dynamicNumberSchema", () => {
    it("accepts literal numbers", () => {
      const result = dynamicNumberSchema.safeParse(42);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(42);
      }
    });

    it("accepts JSON Pointer references", () => {
      const result = dynamicNumberSchema.safeParse("/metrics/count");
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe("/metrics/count");
      }
    });

    it("rejects booleans", () => {
      const result = dynamicNumberSchema.safeParse(true);
      expect(result.success).toBe(false);
    });
  });

  describe("dynamicBooleanSchema", () => {
    it("accepts literal booleans", () => {
      const trueResult = dynamicBooleanSchema.safeParse(true);
      expect(trueResult.success).toBe(true);
      if (trueResult.success) {
        expect(trueResult.data).toBe(true);
      }

      const falseResult = dynamicBooleanSchema.safeParse(false);
      expect(falseResult.success).toBe(true);
      if (falseResult.success) {
        expect(falseResult.data).toBe(false);
      }
    });

    it("accepts JSON Pointer references", () => {
      const result = dynamicBooleanSchema.safeParse("/flags/isActive");
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe("/flags/isActive");
      }
    });

    it("rejects numbers", () => {
      const result = dynamicBooleanSchema.safeParse(1);
      expect(result.success).toBe(false);
    });
  });

  describe("childListSchema", () => {
    it("accepts array of component IDs", () => {
      const result = childListSchema.safeParse(["btn-1", "card-2", "input-3"]);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(["btn-1", "card-2", "input-3"]);
      }
    });

    it("accepts empty arrays", () => {
      const result = childListSchema.safeParse([]);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual([]);
      }
    });

    it("rejects arrays with empty strings", () => {
      const result = childListSchema.safeParse(["btn-1", "", "card-2"]);
      expect(result.success).toBe(false);
    });

    it("rejects non-arrays", () => {
      const result = childListSchema.safeParse("btn-1");
      expect(result.success).toBe(false);
    });
  });

  describe("jsonPointerSchema", () => {
    it("accepts root pointer", () => {
      const result = jsonPointerSchema.safeParse("");
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe("");
      }
    });

    it("accepts valid JSON Pointers", () => {
      const validPointers = ["/user", "/user/profile/name", "/items/0", "/data/nested/deep/value"];

      validPointers.forEach((pointer) => {
        const result = jsonPointerSchema.safeParse(pointer);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toBe(pointer);
        }
      });
    });

    it("accepts any string (validation is structural, not semantic)", () => {
      // Note: We don't validate JSON Pointer format strictly here
      // That's the responsibility of the data binding resolver
      const result = jsonPointerSchema.safeParse("not-a-pointer");
      expect(result.success).toBe(true);
    });
  });
});
