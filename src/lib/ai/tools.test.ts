import { describe, it, expect, vi, beforeEach } from "vitest";
import { asSchema } from "ai";
import { coerceComponentInput } from "./tools";

// Mock server-only since registry has it
vi.mock("server-only", () => ({}));

describe("coerceComponentInput", () => {
  it("passes an object through unchanged", () => {
    const obj = { type: "card", title: "X" };
    expect(coerceComponentInput(obj)).toBe(obj);
  });

  it("parses a JSON string into an object", () => {
    expect(coerceComponentInput('{"type":"text","content":"hi"}')).toEqual({
      type: "text",
      content: "hi",
    });
  });

  it("repairs loose JS-object notation (unquoted keys / single quotes)", () => {
    expect(coerceComponentInput("{type: 'card', title: \"X\"}")).toEqual({
      type: "card",
      title: "X",
    });
  });

  it("returns the raw value when it cannot be parsed", () => {
    expect(coerceComponentInput("not json at all")).toBe("not json at all");
  });
});

describe("AI Tools", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  describe("generate_ui tool", () => {
    it("defines generate_ui tool", async () => {
      const { tools } = await import("./tools");
      expect(tools).toHaveProperty("generate_ui");
    });

    it("generate_ui has correct description", async () => {
      const { tools } = await import("./tools");
      expect(tools.generate_ui.description).toMatch(/generate/i);
      expect(tools.generate_ui.description).toContain("UI");
    });

    it("has input schema", async () => {
      const { tools } = await import("./tools");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const inputSchema = (tools.generate_ui as any).inputSchema;
      expect(inputSchema).toBeDefined();
      const schemaResult = asSchema(inputSchema);
      const jsonSchema = await schemaResult.jsonSchema;
      expect(jsonSchema.type).toBe("object");
    });

    it("expects a component payload", async () => {
      const { tools } = await import("./tools");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const inputSchema = (tools.generate_ui as any).inputSchema;
      const schemaResult = asSchema(inputSchema);
      const jsonSchema = (await schemaResult.jsonSchema) as {
        properties?: Record<string, unknown>;
        required?: string[];
      };
      expect(jsonSchema.properties).toHaveProperty("component");
      expect(jsonSchema.required).toContain("component");
    });
  });

  describe("set_aesthetic tool", () => {
    it("defines set_aesthetic tool", async () => {
      const { tools } = await import("./tools");
      expect(tools).toHaveProperty("set_aesthetic");
    });

    it("has correct description mentioning theme change", async () => {
      const { tools } = await import("./tools");
      expect(tools.set_aesthetic.description).toMatch(/aesthetic/i);
      expect(tools.set_aesthetic.description).toMatch(/theme/i);
    });

    it("has input schema with aestheticId", async () => {
      const { tools } = await import("./tools");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const inputSchema = (tools.set_aesthetic as any).inputSchema;
      expect(inputSchema).toBeDefined();
      const schemaResult = asSchema(inputSchema);
      const jsonSchema = (await schemaResult.jsonSchema) as {
        properties?: Record<string, unknown>;
        required?: string[];
      };
      expect(jsonSchema.properties).toHaveProperty("aestheticId");
      expect(jsonSchema.required).toContain("aestheticId");
    });

    it("executes successfully with valid aestheticId", async () => {
      const { tools } = await import("./tools");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (tools.set_aesthetic as any).execute({
        aestheticId: "noir",
      });
      expect(result.success).toBe(true);
      expect(result.aestheticId).toBe("noir");
      expect(result.appliedAt).toBeTypeOf("number");
    });

    it("executes successfully with minimal aestheticId", async () => {
      const { tools } = await import("./tools");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (tools.set_aesthetic as any).execute({
        aestheticId: "minimal",
        reason: "User requested a cleaner look",
      });
      expect(result.success).toBe(true);
      expect(result.aestheticId).toBe("minimal");
      expect(result.message).toContain("cleaner look");
    });

    it("returns failure for invalid aestheticId", async () => {
      const { tools } = await import("./tools");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (tools.set_aesthetic as any).execute({
        aestheticId: "invalid",
      });
      expect(result.success).toBe(false);
      expect(result.aestheticId).toBe("noir"); // fallback
      expect(result.message).toContain("Invalid");
    });
  });
});
