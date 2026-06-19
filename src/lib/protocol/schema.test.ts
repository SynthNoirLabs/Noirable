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
    if (result.success && result.data.type === "text") {
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
    if (result.success && result.data.type === "image") {
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

describe("A2UI Schema — relationshipGraph (suspect web)", () => {
  it("accepts a valid relationship graph with nodes and edges", () => {
    const data = {
      type: "relationshipGraph",
      title: "The Web",
      nodes: [
        { id: "n1", label: "Victor Kessler", kind: "suspect" },
        { id: "n2", label: "The Docks", kind: "location" },
      ],
      edges: [{ from: "n1", to: "n2", label: "LAST SEEN AT", kind: "connection" }],
    };
    const result = a2uiInputSchema.safeParse(data);
    expect(result.success).toBe(true);
    if (result.success && result.data.type === "relationshipGraph") {
      expect(result.data.nodes).toHaveLength(2);
      expect(result.data.edges).toHaveLength(1);
    }
  });

  it("canonicalizes the `suspectWeb` synonym to relationshipGraph", () => {
    const data = {
      type: "suspectWeb",
      nodes: [{ id: "a", label: "A" }],
      edges: [],
    };
    const result = a2uiInputSchema.safeParse(data);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.type).toBe("relationshipGraph");
    }
  });

  it("coerces edge source/target aliases and drops endpoint-less edges", () => {
    const data = {
      type: "relationshipGraph",
      nodes: [
        { id: "x", label: "X" },
        { id: "y", label: "Y" },
      ],
      links: [
        { source: "x", target: "y", kind: "motive" },
        { source: "x" }, // missing target → dropped
      ],
    };
    const result = a2uiInputSchema.safeParse(data);
    expect(result.success).toBe(true);
    if (result.success && result.data.type === "relationshipGraph") {
      expect(result.data.edges).toHaveLength(1);
      expect(result.data.edges[0]).toMatchObject({ from: "x", to: "y", kind: "motive" });
    }
  });
});

describe("A2UI Schema — model-output coercions", () => {
  it("coerces a dataDashboard trend.value emitted as a string", () => {
    const data = {
      type: "dataDashboard",
      title: "Surveillance",
      widgets: [
        {
          title: "Sightings",
          type: "metric",
          value: "42",
          trend: { value: "12", direction: "up" },
        },
        { title: "Leads", type: "metric", value: "7", trend: { value: "+5%", direction: "up" } },
      ],
    };
    const result = a2uiInputSchema.safeParse(data);
    expect(result.success).toBe(true);
    if (result.success && result.data.type === "dataDashboard") {
      expect(result.data.widgets[0].trend?.value).toBe(12);
      expect(result.data.widgets[1].trend?.value).toBe(5);
    }
  });

  it("drops a non-numeric trend value rather than rejecting the dashboard", () => {
    const data = {
      type: "dataDashboard",
      title: "Surveillance",
      widgets: [
        {
          title: "Status",
          type: "metric",
          value: "open",
          trend: { value: "n/a", direction: "neutral" },
        },
      ],
    };
    const result = a2uiInputSchema.safeParse(data);
    expect(result.success).toBe(true);
    if (result.success && result.data.type === "dataDashboard") {
      expect(result.data.widgets[0].trend).toBeUndefined();
    }
  });

  it("drops an out-of-enum button action instead of failing the button", () => {
    const data = { type: "button", label: "Open Case File", action: "navigate" };
    const result = a2uiInputSchema.safeParse(data);
    expect(result.success).toBe(true);
    if (result.success && result.data.type === "button") {
      expect(result.data.action).toBeUndefined();
      expect(result.data.label).toBe("Open Case File");
    }
  });

  it("keeps a valid button action", () => {
    const data = { type: "button", label: "Submit", action: "submit" };
    const result = a2uiInputSchema.safeParse(data);
    expect(result.success).toBe(true);
    if (result.success && result.data.type === "button") {
      expect(result.data.action).toBe("submit");
    }
  });
});
