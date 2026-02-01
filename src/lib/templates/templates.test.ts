import { describe, it, expect } from "vitest";
import { TEMPLATES, getTemplatesByCategory, getTemplateById } from "./index";
import { a2uiInputSchema } from "@/lib/protocol/schema";

describe("Template Library", () => {
  it("has templates in each category", () => {
    const categories = ["form", "dashboard", "card", "data", "layout"] as const;
    for (const category of categories) {
      const templates = getTemplatesByCategory(category);
      expect(templates.length).toBeGreaterThan(0);
    }
  });

  it("all templates have valid A2UI data", () => {
    for (const template of TEMPLATES) {
      const result = a2uiInputSchema.safeParse(template.data);
      expect(result.success, `Template "${template.name}" has invalid data`).toBe(true);
    }
  });

  it("all templates have unique ids", () => {
    const ids = TEMPLATES.map((t) => t.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it("getTemplateById returns correct template", () => {
    const template = getTemplateById("contact-form");
    expect(template).toBeDefined();
    expect(template?.name).toBe("Contact Form");
  });

  it("getTemplateById returns undefined for unknown id", () => {
    const template = getTemplateById("nonexistent");
    expect(template).toBeUndefined();
  });

  it("getTemplatesByCategory filters correctly", () => {
    const formTemplates = getTemplatesByCategory("form");
    for (const template of formTemplates) {
      expect(template.category).toBe("form");
    }
  });
});
