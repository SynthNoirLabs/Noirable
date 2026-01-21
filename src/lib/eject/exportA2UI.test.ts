import { describe, it, expect } from "vitest";
import { exportA2UI, exportA2UIAsJSON } from "./exportA2UI";
import type { A2UIInput } from "@/lib/protocol/schema";

describe("exportA2UI", () => {
  it("exports a simple form layout", () => {
    const data: A2UIInput = {
      type: "container",
      style: { padding: "md", gap: "sm" },
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

    const output = exportA2UI(data);
    expect(output).toMatch(/function EvidenceComponent/);
    expect(output).toMatch(/Case Intake/);
    expect(output).toMatch(/<input/);
    expect(output).toMatch(/placeholder="Jane Doe"/);
    expect(output).toMatch(/<button/);
    expect(output).toMatch(/Submit/);
  });

  it("exports a text component with priority", () => {
    const data: A2UIInput = {
      type: "text",
      content: "Critical evidence found",
      priority: "critical",
    };

    const output = exportA2UI(data);
    expect(output).toContain("Critical evidence found");
    expect(output).toContain("text-red-400");
    expect(output).toContain("font-bold");
  });

  it("exports a card with status", () => {
    const data: A2UIInput = {
      type: "card",
      title: "Suspect Profile",
      description: "Primary person of interest",
      status: "active",
    };

    const output = exportA2UI(data);
    expect(output).toContain("Suspect Profile");
    expect(output).toContain("Primary person of interest");
    expect(output).toContain("border-amber");
  });

  it("exports a grid layout", () => {
    const data: A2UIInput = {
      type: "grid",
      columns: "3",
      style: { gap: "md" },
      children: [
        { type: "stat", label: "Cases", value: "42" },
        { type: "stat", label: "Solved", value: "38" },
        { type: "stat", label: "Active", value: "4" },
      ],
    };

    const output = exportA2UI(data);
    expect(output).toContain("grid-cols-3");
    expect(output).toContain("gap-4");
    expect(output).toContain("Cases");
    expect(output).toContain("42");
  });

  it("exports a list (ordered)", () => {
    const data: A2UIInput = {
      type: "list",
      ordered: true,
      items: ["First clue", "Second clue", "Third clue"],
    };

    const output = exportA2UI(data);
    expect(output).toContain("<ol");
    expect(output).toContain("list-decimal");
    expect(output).toContain("First clue");
  });

  it("exports a list (unordered)", () => {
    const data: A2UIInput = {
      type: "list",
      ordered: false,
      items: ["Fingerprints", "DNA sample"],
    };

    const output = exportA2UI(data);
    expect(output).toContain("<ul");
    expect(output).toContain("list-disc");
  });

  it("exports a table", () => {
    const data: A2UIInput = {
      type: "table",
      columns: ["Name", "Role", "Status"],
      rows: [
        ["John Doe", "Suspect", "Active"],
        ["Jane Smith", "Witness", "Interviewed"],
      ],
    };

    const output = exportA2UI(data);
    expect(output).toContain("<table");
    expect(output).toContain("<thead");
    expect(output).toContain("Name");
    expect(output).toContain("John Doe");
    expect(output).toContain("Suspect");
  });

  it("exports tabs with useState import", () => {
    const data: A2UIInput = {
      type: "tabs",
      tabs: [
        {
          label: "Evidence",
          content: {
            type: "text",
            content: "Tab 1 content",
            priority: "normal",
          },
        },
        {
          label: "Witnesses",
          content: {
            type: "text",
            content: "Tab 2 content",
            priority: "normal",
          },
        },
      ],
    };

    const output = exportA2UI(data);
    expect(output).toContain("useState");
    expect(output).toContain("activeTab");
    expect(output).toContain("setActiveTab");
    expect(output).toContain("Evidence");
    expect(output).toContain("Witnesses");
  });

  it("exports an image", () => {
    const data: A2UIInput = {
      type: "image",
      src: "/evidence/photo-001.jpg",
      alt: "Crime scene photograph",
    };

    const output = exportA2UI(data);
    expect(output).toContain("<img");
    expect(output).toContain('src="/evidence/photo-001.jpg"');
    expect(output).toContain('alt="Crime scene photograph"');
  });

  it("exports form elements", () => {
    const data: A2UIInput = {
      type: "container",
      children: [
        { type: "input", label: "Email", placeholder: "detective@noir.com" },
        {
          type: "textarea",
          label: "Notes",
          placeholder: "Enter notes...",
          rows: 5,
        },
        {
          type: "select",
          label: "Priority",
          options: ["Low", "Medium", "High"],
          value: "Medium",
        },
        { type: "checkbox", label: "Mark as reviewed", checked: true },
      ],
    };

    const output = exportA2UI(data);
    expect(output).toContain("<input");
    expect(output).toContain("<textarea");
    expect(output).toContain("<select");
    expect(output).toContain('type="checkbox"');
    expect(output).toContain("defaultChecked");
  });

  it("exports callout and badge", () => {
    const data: A2UIInput = {
      type: "container",
      children: [
        { type: "callout", content: "Important notice", priority: "high" },
        { type: "badge", label: "CLASSIFIED", variant: "danger" },
      ],
    };

    const output = exportA2UI(data);
    expect(output).toContain("border-l-2");
    expect(output).toContain("border-amber");
    expect(output).toContain("CLASSIFIED");
    expect(output).toContain("bg-red-900");
  });

  it("exports divider with label", () => {
    const data: A2UIInput = {
      type: "divider",
      label: "SECTION BREAK",
    };

    const output = exportA2UI(data);
    expect(output).toContain("border-t");
    expect(output).toContain("SECTION BREAK");
  });
});

describe("exportA2UIAsJSON", () => {
  it("returns formatted JSON string", () => {
    const data: A2UIInput = {
      type: "text",
      content: "Test",
      priority: "normal",
    };

    const output = exportA2UIAsJSON(data);
    const parsed = JSON.parse(output);
    expect(parsed.type).toBe("text");
    expect(parsed.content).toBe("Test");
  });
});
