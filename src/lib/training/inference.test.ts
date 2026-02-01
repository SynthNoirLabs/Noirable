import { describe, it, expect } from "vitest";
import {
  extractComponentTypes,
  countComponents,
  calculateDepth,
  inferCategory,
  inferComplexity,
} from "./inference";
import type { A2UIInput } from "@/lib/protocol/schema";

describe("extractComponentTypes", () => {
  it("extracts type from simple component", () => {
    const input: A2UIInput = {
      type: "text",
      content: "Hello",
      priority: "normal",
    };
    expect(extractComponentTypes(input)).toEqual(["text"]);
  });

  it("extracts types from nested container", () => {
    const input: A2UIInput = {
      type: "container",
      children: [
        { type: "heading", text: "Title", level: 1 },
        { type: "paragraph", text: "Content" },
        { type: "button", label: "Submit" },
      ],
    };
    expect(extractComponentTypes(input)).toEqual(["button", "container", "heading", "paragraph"]);
  });

  it("extracts types from deeply nested structure", () => {
    const input: A2UIInput = {
      type: "container",
      children: [
        {
          type: "row",
          children: [
            {
              type: "column",
              children: [{ type: "text", content: "A", priority: "normal" }],
            },
            {
              type: "column",
              children: [{ type: "badge", label: "B" }],
            },
          ],
        },
      ],
    };
    const types = extractComponentTypes(input);
    expect(types).toContain("container");
    expect(types).toContain("row");
    expect(types).toContain("column");
    expect(types).toContain("text");
    expect(types).toContain("badge");
  });

  it("extracts types from tabs structure", () => {
    const input: A2UIInput = {
      type: "tabs",
      tabs: [
        {
          label: "Tab 1",
          content: { type: "text", content: "A", priority: "normal" },
        },
        {
          label: "Tab 2",
          content: { type: "stat", label: "Count", value: "42" },
        },
      ],
    };
    const types = extractComponentTypes(input);
    expect(types).toContain("tabs");
    expect(types).toContain("text");
    expect(types).toContain("stat");
  });
});

describe("countComponents", () => {
  it("counts single component", () => {
    const input: A2UIInput = {
      type: "text",
      content: "Hello",
      priority: "normal",
    };
    expect(countComponents(input)).toBe(1);
  });

  it("counts nested components", () => {
    const input: A2UIInput = {
      type: "container",
      children: [
        { type: "heading", text: "Title", level: 1 },
        { type: "paragraph", text: "Content" },
      ],
    };
    expect(countComponents(input)).toBe(3);
  });

  it("counts deeply nested components", () => {
    const input: A2UIInput = {
      type: "container",
      children: [
        {
          type: "row",
          children: [
            { type: "text", content: "A", priority: "normal" },
            { type: "text", content: "B", priority: "normal" },
          ],
        },
      ],
    };
    expect(countComponents(input)).toBe(4);
  });

  it("counts tabs content", () => {
    const input: A2UIInput = {
      type: "tabs",
      tabs: [
        {
          label: "Tab 1",
          content: { type: "text", content: "A", priority: "normal" },
        },
        {
          label: "Tab 2",
          content: { type: "text", content: "B", priority: "normal" },
        },
      ],
    };
    expect(countComponents(input)).toBe(3);
  });
});

describe("calculateDepth", () => {
  it("returns 1 for flat component", () => {
    const input: A2UIInput = {
      type: "text",
      content: "Hello",
      priority: "normal",
    };
    expect(calculateDepth(input)).toBe(1);
  });

  it("returns 2 for single level nesting", () => {
    const input: A2UIInput = {
      type: "container",
      children: [{ type: "text", content: "Hello", priority: "normal" }],
    };
    expect(calculateDepth(input)).toBe(2);
  });

  it("returns correct depth for deep nesting", () => {
    const input: A2UIInput = {
      type: "container",
      children: [
        {
          type: "row",
          children: [
            {
              type: "column",
              children: [{ type: "text", content: "Deep", priority: "normal" }],
            },
          ],
        },
      ],
    };
    expect(calculateDepth(input)).toBe(4);
  });
});

describe("inferCategory", () => {
  it("identifies form components", () => {
    const input: A2UIInput = {
      type: "container",
      children: [
        { type: "input", label: "Name", placeholder: "Enter name" },
        { type: "input", label: "Email", placeholder: "Enter email" },
        { type: "button", label: "Submit" },
      ],
    };
    expect(inferCategory(input)).toBe("form");
  });

  it("identifies dashboard components", () => {
    const input: A2UIInput = {
      type: "grid",
      columns: "3",
      children: [
        { type: "stat", label: "Users", value: "1,234" },
        { type: "stat", label: "Revenue", value: "$56K" },
        { type: "stat", label: "Orders", value: "789" },
      ],
    };
    expect(inferCategory(input)).toBe("dashboard");
  });

  it("identifies card components", () => {
    const input: A2UIInput = {
      type: "container",
      children: [
        { type: "card", title: "Card 1" },
        { type: "card", title: "Card 2" },
      ],
    };
    expect(inferCategory(input)).toBe("card");
  });

  it("identifies data components", () => {
    const input: A2UIInput = {
      type: "container",
      children: [{ type: "table", columns: ["Name", "Age"], rows: [["John", "30"]] }],
    };
    expect(inferCategory(input)).toBe("data");
  });

  it("identifies layout components", () => {
    const input: A2UIInput = {
      type: "container",
      children: [
        { type: "heading", text: "Title", level: 1 },
        { type: "text", content: "Hello", priority: "normal" },
      ],
    };
    expect(inferCategory(input)).toBe("layout");
  });

  it("identifies mixed category", () => {
    const input: A2UIInput = {
      type: "container",
      children: [
        { type: "card", title: "Card" },
        { type: "input", label: "Name", placeholder: "Enter" },
        { type: "table", columns: ["Col"], rows: [] },
      ],
    };
    expect(inferCategory(input)).toBe("mixed");
  });
});

describe("inferComplexity", () => {
  it("identifies simple complexity for single component", () => {
    const input: A2UIInput = {
      type: "text",
      content: "Hello",
      priority: "normal",
    };
    expect(inferComplexity(input)).toBe("simple");
  });

  it("identifies simple complexity for small containers", () => {
    // 5 components, depth 2, 4 types = score 0+0+1 = 1 (simple)
    const input: A2UIInput = {
      type: "container",
      children: [
        { type: "heading", text: "Title", level: 1 },
        { type: "paragraph", text: "Description" },
        { type: "input", label: "Name", placeholder: "Enter" },
        { type: "button", label: "Submit" },
      ],
    };
    expect(inferComplexity(input)).toBe("simple");
  });

  it("identifies moderate complexity for medium structures", () => {
    // 9 components, depth 3, 6 types = score 2+1+2 = 5 (moderate)
    const input: A2UIInput = {
      type: "container",
      children: [
        { type: "heading", text: "Form", level: 1 },
        {
          type: "row",
          children: [
            { type: "input", label: "First", placeholder: "..." },
            { type: "input", label: "Last", placeholder: "..." },
          ],
        },
        { type: "input", label: "Email", placeholder: "..." },
        { type: "textarea", label: "Message", placeholder: "..." },
        { type: "checkbox", label: "Accept terms" },
        { type: "button", label: "Submit" },
      ],
    };
    expect(inferComplexity(input)).toBe("moderate");
  });

  it("identifies complex structures", () => {
    // Very large structure: 15+ components, depth 4+, many types
    const input: A2UIInput = {
      type: "container",
      children: [
        { type: "heading", text: "Dashboard", level: 1 },
        {
          type: "tabs",
          tabs: [
            {
              label: "Overview",
              content: {
                type: "grid",
                columns: "4",
                children: [
                  { type: "stat", label: "Users", value: "1K" },
                  { type: "stat", label: "Revenue", value: "$50K" },
                  { type: "stat", label: "Orders", value: "500" },
                  { type: "stat", label: "Growth", value: "+25%" },
                ],
              },
            },
            {
              label: "Data",
              content: {
                type: "container",
                children: [
                  {
                    type: "table",
                    columns: ["A", "B", "C"],
                    rows: [
                      ["1", "2", "3"],
                      ["4", "5", "6"],
                    ],
                  },
                  { type: "list", items: ["Item 1", "Item 2", "Item 3"] },
                  {
                    type: "callout",
                    content: "Important note",
                    priority: "high",
                  },
                ],
              },
            },
          ],
        },
        {
          type: "row",
          children: [
            { type: "input", label: "Search", placeholder: "..." },
            {
              type: "select",
              label: "Filter",
              options: ["All", "Active", "Archived"],
            },
            { type: "button", label: "Apply" },
          ],
        },
        { type: "divider" },
        { type: "paragraph", text: "Footer text" },
      ],
    };
    expect(inferComplexity(input)).toBe("complex");
  });
});
