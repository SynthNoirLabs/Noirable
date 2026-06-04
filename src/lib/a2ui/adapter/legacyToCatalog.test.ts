import { describe, it, expect } from "vitest";
import { flattenLegacyToCatalog } from "./legacyToCatalog";
import type { SurfaceComponent } from "@/lib/a2ui/surfaces/manager";

function byId(components: SurfaceComponent[]): Map<string, SurfaceComponent> {
  return new Map(components.map((c) => [c.id, c]));
}

describe("flattenLegacyToCatalog", () => {
  it("flattens a single text node into a catalog Text with root id", () => {
    const { components, rootId } = flattenLegacyToCatalog({
      type: "text",
      content: "Hello",
      priority: "normal",
    });

    expect(rootId).toBe("root");
    expect(components).toHaveLength(1);
    expect(components[0]).toMatchObject({ id: "root", component: "Text", text: "Hello" });
  });

  it("produces a flat adjacency list with id references for nested trees", () => {
    const { components, rootId } = flattenLegacyToCatalog({
      type: "container",
      children: [
        { type: "heading", level: 1, text: "Title" },
        { type: "text", content: "Body", priority: "normal" },
      ],
    });

    const map = byId(components);
    const root = map.get(rootId);
    expect(root?.component).toBe("Column");
    // every child id referenced by root must exist in the flat list
    const childIds = (root?.children as string[]) ?? [];
    expect(childIds).toHaveLength(2);
    for (const childId of childIds) {
      expect(map.has(childId)).toBe(true);
    }
    // heading maps to a Text with an h1 variant
    const heading = map.get(childIds[0]);
    expect(heading).toMatchObject({ component: "Text", text: "Title", variant: "h1" });
  });

  it("maps a card with title/description into a Card wrapping a Column", () => {
    const { components, rootId } = flattenLegacyToCatalog({
      type: "card",
      title: "Suspect",
      description: "Person of interest",
      status: "active",
    });

    const map = byId(components);
    const root = map.get(rootId);
    expect(root?.component).toBe("Card");
    const column = map.get(root?.child as string);
    expect(column?.component).toBe("Column");
    const texts = (column?.children as string[]).map((id) => map.get(id));
    expect(texts[0]).toMatchObject({ component: "Text", text: "Suspect", variant: "h3" });
    expect(texts[1]).toMatchObject({ component: "Text", text: "Person of interest" });
  });

  it("maps a button into a Button with an event action and child label", () => {
    const { components, rootId } = flattenLegacyToCatalog({
      type: "button",
      label: "Submit",
      action: "submit",
    });

    const map = byId(components);
    const root = map.get(rootId);
    expect(root).toMatchObject({ component: "Button", action: { event: { name: "submit" } } });
    expect(map.get(root?.child as string)).toMatchObject({ component: "Text", text: "Submit" });
  });

  it("generates unique ids so multiple children never collide", () => {
    const { components } = flattenLegacyToCatalog({
      type: "column",
      children: [
        { type: "text", content: "a", priority: "normal" },
        { type: "text", content: "b", priority: "normal" },
        { type: "text", content: "c", priority: "normal" },
      ],
    });

    const ids = components.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("namespaces ids by prefix and honors a custom rootId", () => {
    const { components, rootId } = flattenLegacyToCatalog(
      { type: "text", content: "x", priority: "normal" },
      { idPrefix: "gen-2", rootId: "gen-2-root" }
    );
    expect(rootId).toBe("gen-2-root");
    expect(components[0].id).toBe("gen-2-root");
  });

  it("falls back to a Text node for unrenderable input", () => {
    const { components, rootId } = flattenLegacyToCatalog({ not: "valid" });
    expect(components).toHaveLength(1);
    expect(components[0]).toMatchObject({ id: rootId, component: "Text" });
  });

  // --- Tolerant normalization (real LLM output variations) -------------------
  // These shapes are exactly what models (Gemini) emit and previously rendered
  // as "Unrenderable component".

  it("renders a card with children (card-as-container) without dropping content", () => {
    const { components } = flattenLegacyToCatalog({
      type: "card",
      title: "CASE FILE",
      description: "Missing person",
      children: [{ type: "text", content: "Body" }],
    });
    // Not the single Unrenderable fallback.
    expect(components.length).toBeGreaterThan(1);
    expect(components.some((c) => c.component === "Text" && c.text === "Body")).toBe(true);
  });

  it("accepts a badge with an unsupported variant (clamped, not rejected)", () => {
    const { components } = flattenLegacyToCatalog({
      type: "container",
      children: [{ type: "badge", text: "CRITICAL", variant: "warning" }],
    });
    expect(components.some((c) => c.text === "Unrenderable component")).toBe(false);
  });

  it("accepts a grid with numeric columns and a stat missing its value", () => {
    const { components } = flattenLegacyToCatalog({
      type: "grid",
      columns: 2,
      children: [{ type: "stat", label: "Age" }],
    });
    expect(components.some((c) => c.text === "Unrenderable component")).toBe(false);
  });

  it("renders a select as a ChoicePicker with its options (not an empty TextField)", () => {
    const { components } = flattenLegacyToCatalog({
      type: "select",
      label: "Case",
      options: ["Case 904", "Case 887"],
    });
    const picker = components.find((c) => c.component === "ChoicePicker") as
      | (SurfaceComponent & { options?: unknown })
      | undefined;
    expect(picker).toBeDefined();
    expect(picker?.options).toEqual([
      { label: "Case 904", value: "Case 904" },
      { label: "Case 887", value: "Case 887" },
    ]);
  });

  it("emits a real Tabs component (not stacked headings) with wired children", () => {
    const { components } = flattenLegacyToCatalog({
      type: "tabs",
      tabs: [
        { label: "Victims", content: { type: "text", content: "v" } },
        { label: "Theory", content: { type: "text", content: "t" } },
      ],
    });
    const tabsNode = components.find((c) => c.component === "Tabs") as
      | (SurfaceComponent & { tabs?: Array<{ title?: unknown; child?: string }> })
      | undefined;
    expect(tabsNode).toBeDefined();
    expect(tabsNode?.tabs).toHaveLength(2);
    // Each tab's child id resolves to a real emitted component.
    for (const t of tabsNode!.tabs!) {
      expect(components.some((c) => c.id === t.child)).toBe(true);
    }
  });

  it("accepts tabs that use `children` or omit content entirely", () => {
    // Regression: a tab with `children` (or no content at all) previously failed
    // validation and discarded the whole tree.
    const { components } = flattenLegacyToCatalog({
      type: "tabs",
      tabs: [
        { id: "a", label: "Victims", children: [{ type: "text", content: "x" }] },
        { id: "b", label: "Theory" },
      ],
    });
    expect(components.some((c) => c.text === "Unrenderable component")).toBe(false);
  });

  it("accepts a table whose columns are named `headers` (common model synonym)", () => {
    // Regression: a deeply-nested table using `headers` instead of `columns`
    // previously failed validation and discarded the ENTIRE tree, leaving only
    // an "Unrenderable component" node.
    const { components } = flattenLegacyToCatalog({
      type: "container",
      children: [
        { type: "heading", text: "Evidence", level: 2 },
        {
          type: "table",
          headers: ["Item", "Location", "Status"],
          rows: [["Cyberdeck", "Alley", "Analyzing"]],
        },
      ],
    });
    expect(components.some((c) => c.text === "Unrenderable component")).toBe(false);
    const tableNode = components.find((c) => c.component === "Table") as
      | (SurfaceComponent & { columns?: unknown })
      | undefined;
    expect(tableNode).toBeDefined();
    expect(tableNode?.columns).toEqual(["Item", "Location", "Status"]);
  });
});
