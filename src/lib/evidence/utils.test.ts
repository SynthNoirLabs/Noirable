import { describe, it, expect } from "vitest";
import type { A2UIComponent } from "@/lib/protocol/schema";
import { deriveEvidenceLabel, deriveEvidenceStatus } from "./utils";

// Helper to create text components with required priority field
const text = (
  content: string,
  priority: "low" | "normal" | "high" | "critical" = "normal"
): A2UIComponent => ({
  type: "text",
  content,
  priority,
});

// Helper to create card components with required status field
const card = (
  title: string,
  status: "active" | "archived" | "missing" | "redacted" = "active",
  description?: string
): A2UIComponent => ({
  type: "card",
  title,
  status,
  ...(description && { description }),
});

// Helper to create table components with required rows field
const table = (columns: string[], rows: string[][] = []): A2UIComponent => ({
  type: "table",
  columns,
  rows,
});

describe("deriveEvidenceLabel", () => {
  describe("card component", () => {
    it("returns title when present", () => {
      const card: A2UIComponent = {
        type: "card",
        title: "Suspect Profile",
        description: "John Doe",
        status: "active",
      };
      expect(deriveEvidenceLabel(card)).toBe("Suspect Profile");
    });

    it("returns description when title is empty", () => {
      const card: A2UIComponent = {
        type: "card",
        title: "",
        description: "John Doe",
        status: "active",
      };
      expect(deriveEvidenceLabel(card)).toBe("John Doe");
    });

    it("returns title over description when both present", () => {
      const card: A2UIComponent = {
        type: "card",
        title: "Primary",
        description: "Secondary",
        status: "active",
      };
      expect(deriveEvidenceLabel(card)).toBe("Primary");
    });

    it("returns default when title and description are empty", () => {
      const card: A2UIComponent = {
        type: "card",
        title: "",
        status: "active",
      };
      expect(deriveEvidenceLabel(card)).toBe("Evidence Item");
    });

    it("trims whitespace from title", () => {
      const card: A2UIComponent = {
        type: "card",
        title: "  Trimmed Title  ",
        status: "active",
      };
      expect(deriveEvidenceLabel(card)).toBe("Trimmed Title");
    });

    it("ignores whitespace-only title", () => {
      const card: A2UIComponent = {
        type: "card",
        title: "   ",
        description: "Fallback",
        status: "active",
      };
      expect(deriveEvidenceLabel(card)).toBe("Fallback");
    });
  });

  describe("heading component", () => {
    it("returns text content", () => {
      const heading: A2UIComponent = {
        type: "heading",
        text: "Investigation Report",
        level: 1,
      };
      expect(deriveEvidenceLabel(heading)).toBe("Investigation Report");
    });

    it("returns default when text is empty", () => {
      const heading: A2UIComponent = {
        type: "heading",
        text: "",
        level: 2,
      };
      expect(deriveEvidenceLabel(heading)).toBe("Evidence Item");
    });

    it("trims whitespace from heading text", () => {
      const heading: A2UIComponent = {
        type: "heading",
        text: "  Spaced Heading  ",
        level: 3,
      };
      expect(deriveEvidenceLabel(heading)).toBe("Spaced Heading");
    });
  });

  describe("text component", () => {
    it("returns content", () => {
      const text: A2UIComponent = {
        type: "text",
        content: "Evidence description",
        priority: "normal",
      };
      expect(deriveEvidenceLabel(text)).toBe("Evidence description");
    });

    it("returns default when content is empty", () => {
      const text: A2UIComponent = {
        type: "text",
        content: "",
        priority: "normal",
      };
      expect(deriveEvidenceLabel(text)).toBe("Evidence Item");
    });

    it("trims whitespace from text content", () => {
      const text: A2UIComponent = {
        type: "text",
        content: "  Padded content  ",
        priority: "normal",
      };
      expect(deriveEvidenceLabel(text)).toBe("Padded content");
    });
  });

  describe("paragraph component", () => {
    it("returns text content", () => {
      const paragraph: A2UIComponent = {
        type: "paragraph",
        text: "This is a paragraph",
      };
      expect(deriveEvidenceLabel(paragraph)).toBe("This is a paragraph");
    });

    it("returns default when text is empty", () => {
      const paragraph: A2UIComponent = {
        type: "paragraph",
        text: "",
      };
      expect(deriveEvidenceLabel(paragraph)).toBe("Evidence Item");
    });

    it("trims whitespace from paragraph text", () => {
      const paragraph: A2UIComponent = {
        type: "paragraph",
        text: "  Paragraph with spaces  ",
      };
      expect(deriveEvidenceLabel(paragraph)).toBe("Paragraph with spaces");
    });
  });

  describe("badge component", () => {
    it("returns label", () => {
      const badge: A2UIComponent = {
        type: "badge",
        label: "Active",
      };
      expect(deriveEvidenceLabel(badge)).toBe("Active");
    });

    it("returns default when label is empty", () => {
      const badge: A2UIComponent = {
        type: "badge",
        label: "",
      };
      expect(deriveEvidenceLabel(badge)).toBe("Evidence Item");
    });

    it("trims whitespace from badge label", () => {
      const badge: A2UIComponent = {
        type: "badge",
        label: "  Status Badge  ",
      };
      expect(deriveEvidenceLabel(badge)).toBe("Status Badge");
    });
  });

  describe("stat component", () => {
    it("returns label when present", () => {
      const stat: A2UIComponent = {
        type: "stat",
        label: "Total Cases",
        value: "42",
      };
      expect(deriveEvidenceLabel(stat)).toBe("Total Cases");
    });

    it("returns value when label is empty", () => {
      const stat: A2UIComponent = {
        type: "stat",
        label: "",
        value: "42",
      };
      expect(deriveEvidenceLabel(stat)).toBe("42");
    });

    it("returns label over value when both present", () => {
      const stat: A2UIComponent = {
        type: "stat",
        label: "Primary",
        value: "Secondary",
      };
      expect(deriveEvidenceLabel(stat)).toBe("Primary");
    });

    it("returns default when both label and value are empty", () => {
      const stat: A2UIComponent = {
        type: "stat",
        label: "",
        value: "",
      };
      expect(deriveEvidenceLabel(stat)).toBe("Evidence Item");
    });

    it("trims whitespace from stat label", () => {
      const stat: A2UIComponent = {
        type: "stat",
        label: "  Stat Label  ",
        value: "100",
      };
      expect(deriveEvidenceLabel(stat)).toBe("Stat Label");
    });
  });

  describe("list component", () => {
    it("returns first item", () => {
      const list: A2UIComponent = {
        type: "list",
        items: ["First Item", "Second Item", "Third Item"],
      };
      expect(deriveEvidenceLabel(list)).toBe("First Item");
    });

    it("returns default when items array is empty", () => {
      const list: A2UIComponent = {
        type: "list",
        items: [],
      };
      expect(deriveEvidenceLabel(list)).toBe("Evidence Item");
    });

    it("trims whitespace from first list item", () => {
      const list: A2UIComponent = {
        type: "list",
        items: ["  First Item  ", "Second Item"],
      };
      expect(deriveEvidenceLabel(list)).toBe("First Item");
    });

    it("returns default when first item is empty", () => {
      const list: A2UIComponent = {
        type: "list",
        items: ["", "Second Item"],
      };
      expect(deriveEvidenceLabel(list)).toBe("Evidence Item");
    });
  });

  describe("table component", () => {
    it("returns first column name", () => {
      const table: A2UIComponent = {
        type: "table",
        columns: ["Name", "Age", "Status"],
        rows: [["John", "30", "Active"]],
      };
      expect(deriveEvidenceLabel(table)).toBe("Name");
    });

    it("returns default when columns array is empty", () => {
      const table: A2UIComponent = {
        type: "table",
        columns: [],
        rows: [],
      };
      expect(deriveEvidenceLabel(table)).toBe("Evidence Item");
    });

    it("trims whitespace from first column", () => {
      const table: A2UIComponent = {
        type: "table",
        columns: ["  Column Name  ", "Age"],
        rows: [],
      };
      expect(deriveEvidenceLabel(table)).toBe("Column Name");
    });

    it("returns default when first column is empty", () => {
      const tableComp: A2UIComponent = table(["", "Age", "Status"], []);
      expect(deriveEvidenceLabel(tableComp)).toBe("Evidence Item");
    });
  });

  describe("image component", () => {
    it("returns alt text", () => {
      const image: A2UIComponent = {
        type: "image",
        src: "/image.jpg",
        alt: "Suspect Photo",
      };
      expect(deriveEvidenceLabel(image)).toBe("Suspect Photo");
    });

    it("returns default when alt is empty", () => {
      const image: A2UIComponent = {
        type: "image",
        src: "/image.jpg",
        alt: "",
      };
      expect(deriveEvidenceLabel(image)).toBe("Evidence Item");
    });

    it("trims whitespace from alt text", () => {
      const image: A2UIComponent = {
        type: "image",
        src: "/image.jpg",
        alt: "  Image Description  ",
      };
      expect(deriveEvidenceLabel(image)).toBe("Image Description");
    });
  });

  describe("input component", () => {
    it("returns label", () => {
      const input: A2UIComponent = {
        type: "input",
        label: "Name",
        placeholder: "Enter name",
      };
      expect(deriveEvidenceLabel(input)).toBe("Name");
    });

    it("returns default when label is empty", () => {
      const input: A2UIComponent = {
        type: "input",
        label: "",
        placeholder: "Enter name",
      };
      expect(deriveEvidenceLabel(input)).toBe("Evidence Item");
    });

    it("trims whitespace from input label", () => {
      const input: A2UIComponent = {
        type: "input",
        label: "  Input Label  ",
        placeholder: "placeholder",
      };
      expect(deriveEvidenceLabel(input)).toBe("Input Label");
    });
  });

  describe("textarea component", () => {
    it("returns label", () => {
      const textarea: A2UIComponent = {
        type: "textarea",
        label: "Comments",
        placeholder: "Enter comments",
      };
      expect(deriveEvidenceLabel(textarea)).toBe("Comments");
    });

    it("returns default when label is empty", () => {
      const textarea: A2UIComponent = {
        type: "textarea",
        label: "",
        placeholder: "Enter comments",
      };
      expect(deriveEvidenceLabel(textarea)).toBe("Evidence Item");
    });

    it("trims whitespace from textarea label", () => {
      const textarea: A2UIComponent = {
        type: "textarea",
        label: "  Textarea Label  ",
        placeholder: "placeholder",
      };
      expect(deriveEvidenceLabel(textarea)).toBe("Textarea Label");
    });
  });

  describe("select component", () => {
    it("returns label", () => {
      const select: A2UIComponent = {
        type: "select",
        label: "Status",
        options: ["Active", "Inactive"],
      };
      expect(deriveEvidenceLabel(select)).toBe("Status");
    });

    it("returns default when label is empty", () => {
      const select: A2UIComponent = {
        type: "select",
        label: "",
        options: ["Option1"],
      };
      expect(deriveEvidenceLabel(select)).toBe("Evidence Item");
    });

    it("trims whitespace from select label", () => {
      const select: A2UIComponent = {
        type: "select",
        label: "  Select Label  ",
        options: ["Option1"],
      };
      expect(deriveEvidenceLabel(select)).toBe("Select Label");
    });
  });

  describe("checkbox component", () => {
    it("returns label", () => {
      const checkbox: A2UIComponent = {
        type: "checkbox",
        label: "Agree",
      };
      expect(deriveEvidenceLabel(checkbox)).toBe("Agree");
    });

    it("returns default when label is empty", () => {
      const checkbox: A2UIComponent = {
        type: "checkbox",
        label: "",
      };
      expect(deriveEvidenceLabel(checkbox)).toBe("Evidence Item");
    });

    it("trims whitespace from checkbox label", () => {
      const checkbox: A2UIComponent = {
        type: "checkbox",
        label: "  Checkbox Label  ",
      };
      expect(deriveEvidenceLabel(checkbox)).toBe("Checkbox Label");
    });
  });

  describe("button component", () => {
    it("returns label", () => {
      const button: A2UIComponent = {
        type: "button",
        label: "Submit",
      };
      expect(deriveEvidenceLabel(button)).toBe("Submit");
    });

    it("returns default when label is empty", () => {
      const button: A2UIComponent = {
        type: "button",
        label: "",
      };
      expect(deriveEvidenceLabel(button)).toBe("Evidence Item");
    });

    it("trims whitespace from button label", () => {
      const button: A2UIComponent = {
        type: "button",
        label: "  Button Label  ",
      };
      expect(deriveEvidenceLabel(button)).toBe("Button Label");
    });
  });

  describe("container component", () => {
    it("returns label from first child with content", () => {
      const container: A2UIComponent = {
        type: "container",
        children: [text(""), { type: "heading", text: "Found Label", level: 2 }],
      };
      expect(deriveEvidenceLabel(container)).toBe("Found Label");
    });

    it("returns default when no children have labels", () => {
      const container: A2UIComponent = {
        type: "container",
        children: [text(""), { type: "heading", text: "", level: 2 }],
      };
      expect(deriveEvidenceLabel(container)).toBe("Evidence Item");
    });

    it("returns default when children array is empty", () => {
      const container: A2UIComponent = {
        type: "container",
        children: [],
      };
      expect(deriveEvidenceLabel(container)).toBe("Evidence Item");
    });

    it("skips empty children and finds first non-empty", () => {
      const container: A2UIComponent = {
        type: "container",
        children: [text(""), text("   "), { type: "badge", label: "Found" }],
      };
      expect(deriveEvidenceLabel(container)).toBe("Found");
    });
  });

  describe("row component", () => {
    it("returns label from first child with content", () => {
      const row: A2UIComponent = {
        type: "row",
        children: [text(""), { type: "paragraph", text: "Row Content" }],
      };
      expect(deriveEvidenceLabel(row)).toBe("Row Content");
    });

    it("returns default when no children have labels", () => {
      const row: A2UIComponent = {
        type: "row",
        children: [text("")],
      };
      expect(deriveEvidenceLabel(row)).toBe("Evidence Item");
    });

    it("returns default when children array is empty", () => {
      const row: A2UIComponent = {
        type: "row",
        children: [],
      };
      expect(deriveEvidenceLabel(row)).toBe("Evidence Item");
    });
  });

  describe("column component", () => {
    it("returns label from first child with content", () => {
      const column: A2UIComponent = {
        type: "column",
        children: [text(""), { type: "stat", label: "Column Stat", value: "100" }],
      };
      expect(deriveEvidenceLabel(column)).toBe("Column Stat");
    });

    it("returns default when no children have labels", () => {
      const column: A2UIComponent = {
        type: "column",
        children: [text("")],
      };
      expect(deriveEvidenceLabel(column)).toBe("Evidence Item");
    });

    it("returns default when children array is empty", () => {
      const column: A2UIComponent = {
        type: "column",
        children: [],
      };
      expect(deriveEvidenceLabel(column)).toBe("Evidence Item");
    });
  });

  describe("grid component", () => {
    it("returns label from first child with content", () => {
      const grid: A2UIComponent = {
        type: "grid",
        columns: "2",
        children: [text(""), card("Grid Card")],
      };
      expect(deriveEvidenceLabel(grid)).toBe("Grid Card");
    });

    it("returns default when no children have labels", () => {
      const grid: A2UIComponent = {
        type: "grid",
        children: [text("")],
      };
      expect(deriveEvidenceLabel(grid)).toBe("Evidence Item");
    });

    it("returns default when children array is empty", () => {
      const grid: A2UIComponent = {
        type: "grid",
        children: [],
      };
      expect(deriveEvidenceLabel(grid)).toBe("Evidence Item");
    });
  });

  describe("tabs component", () => {
    it("returns label from first tab label", () => {
      const tabs: A2UIComponent = {
        type: "tabs",
        tabs: [
          { label: "Tab One", content: text("") },
          { label: "Tab Two", content: text("") },
        ],
      };
      expect(deriveEvidenceLabel(tabs)).toBe("Tab One");
    });

    it("returns label from first tab content when tab label is empty", () => {
      const tabs: A2UIComponent = {
        type: "tabs",
        tabs: [{ label: "", content: { type: "heading", text: "Content Label", level: 2 } }],
      };
      expect(deriveEvidenceLabel(tabs)).toBe("Content Label");
    });

    it("returns default when no tabs exist", () => {
      const tabs: A2UIComponent = {
        type: "tabs",
        tabs: [],
      };
      expect(deriveEvidenceLabel(tabs)).toBe("Evidence Item");
    });

    it("returns default when first tab has no label and content has no label", () => {
      const tabs: A2UIComponent = {
        type: "tabs",
        tabs: [{ label: "", content: text("") }],
      };
      expect(deriveEvidenceLabel(tabs)).toBe("Evidence Item");
    });

    it("trims whitespace from tab label", () => {
      const tabs: A2UIComponent = {
        type: "tabs",
        tabs: [{ label: "  Tab Label  ", content: text("") }],
      };
      expect(deriveEvidenceLabel(tabs)).toBe("Tab Label");
    });
  });

  describe("nested containers", () => {
    it("finds label in deeply nested structure", () => {
      const nested: A2UIComponent = {
        type: "container",
        children: [
          {
            type: "row",
            children: [
              {
                type: "column",
                children: [text(""), { type: "badge", label: "Deep Label" }],
              },
            ],
          },
        ],
      };
      expect(deriveEvidenceLabel(nested)).toBe("Deep Label");
    });

    it("returns default for deeply nested empty structure", () => {
      const nested: A2UIComponent = {
        type: "container",
        children: [
          {
            type: "row",
            children: [
              {
                type: "column",
                children: [text("")],
              },
            ],
          },
        ],
      };
      expect(deriveEvidenceLabel(nested)).toBe("Evidence Item");
    });
  });

  describe("callout and divider components", () => {
    it("returns default for callout (no label extraction)", () => {
      const callout: A2UIComponent = {
        type: "callout",
        content: "Important message",
        priority: "high",
      };
      expect(deriveEvidenceLabel(callout)).toBe("Evidence Item");
    });

    it("returns default for divider without label", () => {
      const divider: A2UIComponent = {
        type: "divider",
      };
      expect(deriveEvidenceLabel(divider)).toBe("Evidence Item");
    });

    it("returns default for divider with label (no extraction)", () => {
      const divider: A2UIComponent = {
        type: "divider",
        label: "Section Break",
      };
      expect(deriveEvidenceLabel(divider)).toBe("Evidence Item");
    });
  });
});

describe("deriveEvidenceStatus", () => {
  describe("card component", () => {
    it("returns status when present", () => {
      const card: A2UIComponent = {
        type: "card",
        title: "Test",
        status: "active",
      };
      expect(deriveEvidenceStatus(card)).toBe("active");
    });

    it("returns archived status", () => {
      const card: A2UIComponent = {
        type: "card",
        title: "Test",
        status: "archived",
      };
      expect(deriveEvidenceStatus(card)).toBe("archived");
    });

    it("returns missing status", () => {
      const card: A2UIComponent = {
        type: "card",
        title: "Test",
        status: "missing",
      };
      expect(deriveEvidenceStatus(card)).toBe("missing");
    });

    it("returns redacted status", () => {
      const card: A2UIComponent = {
        type: "card",
        title: "Test",
        status: "redacted",
      };
      expect(deriveEvidenceStatus(card)).toBe("redacted");
    });

    it("returns default active status when not specified", () => {
      const testCard: A2UIComponent = card("Test");
      expect(deriveEvidenceStatus(testCard)).toBe("active");
    });
  });

  describe("non-card components", () => {
    it("returns undefined for text component", () => {
      const textComp: A2UIComponent = text("Test");
      expect(deriveEvidenceStatus(textComp)).toBeUndefined();
    });

    it("returns undefined for heading component", () => {
      const heading: A2UIComponent = {
        type: "heading",
        text: "Test",
        level: 1,
      };
      expect(deriveEvidenceStatus(heading)).toBeUndefined();
    });

    it("returns undefined for badge component", () => {
      const badge: A2UIComponent = {
        type: "badge",
        label: "Test",
      };
      expect(deriveEvidenceStatus(badge)).toBeUndefined();
    });

    it("returns undefined for button component", () => {
      const button: A2UIComponent = {
        type: "button",
        label: "Test",
      };
      expect(deriveEvidenceStatus(button)).toBeUndefined();
    });

    it("returns undefined for image component", () => {
      const image: A2UIComponent = {
        type: "image",
        src: "/test.jpg",
        alt: "Test",
      };
      expect(deriveEvidenceStatus(image)).toBeUndefined();
    });

    it("returns undefined for list component", () => {
      const list: A2UIComponent = {
        type: "list",
        items: ["Item 1"],
      };
      expect(deriveEvidenceStatus(list)).toBeUndefined();
    });

    it("returns undefined for table component", () => {
      const tableComp: A2UIComponent = table(["Col1"]);
      expect(deriveEvidenceStatus(tableComp)).toBeUndefined();
    });

    it("returns undefined for input component", () => {
      const input: A2UIComponent = {
        type: "input",
        label: "Test",
        placeholder: "Test",
      };
      expect(deriveEvidenceStatus(input)).toBeUndefined();
    });

    it("returns undefined for textarea component", () => {
      const textarea: A2UIComponent = {
        type: "textarea",
        label: "Test",
        placeholder: "Test",
      };
      expect(deriveEvidenceStatus(textarea)).toBeUndefined();
    });

    it("returns undefined for select component", () => {
      const select: A2UIComponent = {
        type: "select",
        label: "Test",
        options: ["Option1"],
      };
      expect(deriveEvidenceStatus(select)).toBeUndefined();
    });

    it("returns undefined for checkbox component", () => {
      const checkbox: A2UIComponent = {
        type: "checkbox",
        label: "Test",
      };
      expect(deriveEvidenceStatus(checkbox)).toBeUndefined();
    });

    it("returns undefined for stat component", () => {
      const stat: A2UIComponent = {
        type: "stat",
        label: "Test",
        value: "100",
      };
      expect(deriveEvidenceStatus(stat)).toBeUndefined();
    });

    it("returns undefined for paragraph component", () => {
      const paragraph: A2UIComponent = {
        type: "paragraph",
        text: "Test",
      };
      expect(deriveEvidenceStatus(paragraph)).toBeUndefined();
    });

    it("returns undefined for callout component", () => {
      const callout: A2UIComponent = {
        type: "callout",
        content: "Test",
        priority: "normal",
      };
      expect(deriveEvidenceStatus(callout)).toBeUndefined();
    });

    it("returns undefined for divider component", () => {
      const divider: A2UIComponent = {
        type: "divider",
      };
      expect(deriveEvidenceStatus(divider)).toBeUndefined();
    });

    it("returns undefined for tabs component", () => {
      const tabs: A2UIComponent = {
        type: "tabs",
        tabs: [{ label: "Tab", content: text("Test") }],
      };
      expect(deriveEvidenceStatus(tabs)).toBeUndefined();
    });
  });

  describe("container component", () => {
    it("returns status from first child card", () => {
      const container: A2UIComponent = {
        type: "container",
        children: [text("No status"), card("Test", "archived")],
      };
      expect(deriveEvidenceStatus(container)).toBe("archived");
    });

    it("returns status from deeply nested card", () => {
      const container: A2UIComponent = {
        type: "container",
        children: [
          {
            type: "row",
            children: [
              {
                type: "column",
                children: [card("Test", "missing")],
              },
            ],
          },
        ],
      };
      expect(deriveEvidenceStatus(container)).toBe("missing");
    });

    it("returns undefined when no child has status", () => {
      const container: A2UIComponent = {
        type: "container",
        children: [text("No status"), { type: "badge", label: "No status" }],
      };
      expect(deriveEvidenceStatus(container)).toBeUndefined();
    });

    it("returns undefined when children array is empty", () => {
      const container: A2UIComponent = {
        type: "container",
        children: [],
      };
      expect(deriveEvidenceStatus(container)).toBeUndefined();
    });

    it("returns first status found in multiple cards", () => {
      const container: A2UIComponent = {
        type: "container",
        children: [card("First", "active"), card("Second", "archived")],
      };
      expect(deriveEvidenceStatus(container)).toBe("active");
    });
  });

  describe("row component", () => {
    it("returns status from first child card", () => {
      const row: A2UIComponent = {
        type: "row",
        children: [text("No status"), card("Test", "redacted")],
      };
      expect(deriveEvidenceStatus(row)).toBe("redacted");
    });

    it("returns undefined when no child has status", () => {
      const row: A2UIComponent = {
        type: "row",
        children: [text("No status")],
      };
      expect(deriveEvidenceStatus(row)).toBeUndefined();
    });

    it("returns undefined when children array is empty", () => {
      const row: A2UIComponent = {
        type: "row",
        children: [],
      };
      expect(deriveEvidenceStatus(row)).toBeUndefined();
    });
  });

  describe("column component", () => {
    it("returns status from first child card", () => {
      const column: A2UIComponent = {
        type: "column",
        children: [text("No status"), card("Test", "active")],
      };
      expect(deriveEvidenceStatus(column)).toBe("active");
    });

    it("returns undefined when no child has status", () => {
      const column: A2UIComponent = {
        type: "column",
        children: [text("No status")],
      };
      expect(deriveEvidenceStatus(column)).toBeUndefined();
    });

    it("returns undefined when children array is empty", () => {
      const column: A2UIComponent = {
        type: "column",
        children: [],
      };
      expect(deriveEvidenceStatus(column)).toBeUndefined();
    });
  });

  describe("grid component", () => {
    it("returns status from first child card", () => {
      const grid: A2UIComponent = {
        type: "grid",
        columns: "2",
        children: [text("No status"), card("Test", "archived")],
      };
      expect(deriveEvidenceStatus(grid)).toBe("archived");
    });

    it("returns undefined when no child has status", () => {
      const grid: A2UIComponent = {
        type: "grid",
        children: [text("No status")],
      };
      expect(deriveEvidenceStatus(grid)).toBeUndefined();
    });

    it("returns undefined when children array is empty", () => {
      const grid: A2UIComponent = {
        type: "grid",
        children: [],
      };
      expect(deriveEvidenceStatus(grid)).toBeUndefined();
    });
  });

  describe("complex nested structures", () => {
    it("finds status in complex nested structure", () => {
      const complex: A2UIComponent = {
        type: "container",
        children: [
          {
            type: "row",
            children: [
              {
                type: "column",
                children: [
                  text("No status"),
                  {
                    type: "grid",
                    children: [{ type: "badge", label: "No status" }, card("Found", "missing")],
                  },
                ],
              },
            ],
          },
        ],
      };
      expect(deriveEvidenceStatus(complex)).toBe("missing");
    });

    it("returns undefined for complex structure with no status", () => {
      const complex: A2UIComponent = {
        type: "container",
        children: [
          {
            type: "row",
            children: [
              {
                type: "column",
                children: [text("No status"), { type: "badge", label: "No status" }],
              },
            ],
          },
        ],
      };
      expect(deriveEvidenceStatus(complex)).toBeUndefined();
    });
  });

  describe("edge cases", () => {
    it("handles card with undefined status property", () => {
      const testCard: A2UIComponent = card("Test");
      expect(deriveEvidenceStatus(testCard)).toBe("active");
    });

    it("handles container with single empty child", () => {
      const container: A2UIComponent = {
        type: "container",
        children: [text("")],
      };
      expect(deriveEvidenceStatus(container)).toBeUndefined();
    });

    it("stops searching after finding first status", () => {
      const container: A2UIComponent = {
        type: "container",
        children: [card("First", "active"), card("Second", "archived"), card("Third", "missing")],
      };
      expect(deriveEvidenceStatus(container)).toBe("active");
    });
  });
});
