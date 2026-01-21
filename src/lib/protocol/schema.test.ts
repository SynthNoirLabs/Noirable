import { describe, it, expect } from "vitest";
import { a2uiSchema, a2uiInputSchema } from "./schema";

describe("A2UI Schema", () => {
  it("validates a correct text component", () => {
    const data = {
      type: "text",
      content: "The suspect was seen leaving the scene.",
      priority: "normal",
    };
    const result = a2uiSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it("accepts text components with legacy text field", () => {
    const data = {
      type: "text",
      text: "Legacy content field.",
    };
    const result = a2uiInputSchema.safeParse(data);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.content).toBe("Legacy content field.");
    }
  });

  it("validates a correct card component", () => {
    const data = {
      type: "card",
      title: "Dossier: John Doe",
      description: "Known associate of the Syndicate.",
      status: "active",
    };
    const result = a2uiSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it("validates a nested layout tree", () => {
    const data = {
      type: "container",
      style: { padding: "lg", gap: "md", align: "center" },
      children: [
        { type: "heading", level: 2, text: "Case Intake" },
        {
          type: "row",
          style: { gap: "sm" },
          children: [
            { type: "input", label: "Name", placeholder: "Jane Doe" },
            { type: "button", label: "Submit", variant: "primary" },
          ],
        },
      ],
    };
    const result = a2uiSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it("validates a callout component", () => {
    const data = {
      type: "callout",
      content: "Keep eyes on the exits.",
      priority: "high",
    };
    const result = a2uiSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it("validates list and badge components", () => {
    const list = {
      type: "list",
      items: ["Dock gate", "Warehouse", "Pier 9"],
    };
    const badge = {
      type: "badge",
      label: "ACTIVE",
      variant: "primary",
    };
    expect(a2uiSchema.safeParse(list).success).toBe(true);
    expect(a2uiSchema.safeParse(badge).success).toBe(true);
  });

  it("validates table and tabs components", () => {
    const table = {
      type: "table",
      columns: ["Field", "Value"],
      rows: [
        ["Status", "Active"],
        ["Location", "Docks"],
      ],
    };
    const tabs = {
      type: "tabs",
      tabs: [
        {
          label: "Summary",
          content: { type: "paragraph", text: "Case notes." },
        },
        {
          label: "Leads",
          content: { type: "list", items: ["Call witness", "Check CCTV"] },
        },
      ],
      activeIndex: 0,
    };
    expect(a2uiSchema.safeParse(table).success).toBe(true);
    expect(a2uiSchema.safeParse(tabs).success).toBe(true);
  });

  it("accepts image inputs with prompt only", () => {
    const data = {
      type: "image",
      prompt: "Noir alleyway under neon rain",
    };
    const result = a2uiInputSchema.safeParse(data);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.alt).toContain("Noir alleyway");
    }
  });

  it("fails on invalid image", () => {
    const data = {
      type: "image",
      alt: "Missing photo",
    };
    const result = a2uiSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it("fails on invalid component type", () => {
    const data = {
      type: "ufo",
      something: "else",
    };
    const result = a2uiSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it("fails on missing required fields", () => {
    const data = {
      type: "text",
      // missing content
    };
    const result = a2uiSchema.safeParse(data);
    expect(result.success).toBe(false);
  });
});
