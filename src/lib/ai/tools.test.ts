import { describe, it, expect } from "vitest";
import { asSchema } from "ai";
import { tools } from "./tools";

describe("AI Tools", () => {
  it("defines generate_ui tool", () => {
    expect(tools).toHaveProperty("generate_ui");
  });

  it("generate_ui has correct description", () => {
    expect(tools.generate_ui.description).toMatch(/generate/i);
    expect(tools.generate_ui.description).toContain("UI");
  });

  // We can't easily test the schema internal validation without calling execute,
  // but we can verify it exists.
  it("has input schema", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const inputSchema = (tools.generate_ui as any).inputSchema;
    expect(inputSchema).toBeDefined();
    const jsonSchema = asSchema(inputSchema).jsonSchema;
    expect(jsonSchema.type).toBe("object");
  });

  it("expects a component payload", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const inputSchema = (tools.generate_ui as any).inputSchema;
    const jsonSchema = asSchema(inputSchema).jsonSchema as {
      properties?: Record<string, unknown>;
      required?: string[];
    };
    expect(jsonSchema.properties).toHaveProperty("component");
    expect(jsonSchema.required).toContain("component");
  });
});
