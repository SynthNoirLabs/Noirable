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

  it("maps modal/badge/grid to their real catalog components (not Unsupported)", () => {
    const modal = flattenLegacyToCatalog({
      type: "modal",
      trigger: { type: "button", label: "Open" },
      content: { type: "text", content: "secret" },
    });
    expect(modal.components.find((c) => c.id === "root")?.component).toBe("Modal");

    const badge = flattenLegacyToCatalog({ type: "badge", label: "WANTED", variant: "danger" });
    expect(badge.components.find((c) => c.id === "root")?.component).toBe("Badge");

    const grid = flattenLegacyToCatalog({
      type: "grid",
      columns: "3",
      children: [
        { type: "text", content: "a" },
        { type: "text", content: "b" },
      ],
    });
    expect(grid.components.find((c) => c.id === "root")?.component).toBe("Grid");

    // None degraded to the Unsupported/Unrenderable fallback.
    for (const r of [modal, badge, grid]) {
      expect(
        r.components.some(
          (c) => c.text === "Unsupported component" || c.text === "Unrenderable component"
        )
      ).toBe(false);
    }
  });

  it("infers a badge variant from the label when the model omits it", () => {
    const danger = flattenLegacyToCatalog({ type: "badge", label: "Armed" });
    expect((danger.components[0] as SurfaceComponent & { variant?: string }).variant).toBe(
      "danger"
    );

    const ghost = flattenLegacyToCatalog({ type: "badge", label: "Unknown Location" });
    expect((ghost.components[0] as SurfaceComponent & { variant?: string }).variant).toBe("ghost");

    const positive = flattenLegacyToCatalog({ type: "badge", label: "Active" });
    expect((positive.components[0] as SurfaceComponent & { variant?: string }).variant).toBe(
      "primary"
    );

    // An explicit variant from the model is respected, not overridden.
    const explicit = flattenLegacyToCatalog({ type: "badge", label: "Armed", variant: "ghost" });
    expect((explicit.components[0] as SurfaceComponent & { variant?: string }).variant).toBe(
      "ghost"
    );
  });

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

  it("maps object-shaped table rows into column order (no '[object Object]')", () => {
    // Regression: models often emit rows as objects keyed by column name. These
    // were naively String()-ed into "[object Object]" cells.
    const { components } = flattenLegacyToCatalog({
      type: "table",
      columns: ["Name", "Last Seen", "Status"],
      rows: [
        { name: "Vance", lastSeen: "Sector 4", status: "missing" },
        { Name: "Doe", "Last Seen": "Pier 9", Status: "cleared" },
      ],
    });
    const tableNode = components.find((c) => c.component === "Table") as
      | (SurfaceComponent & { rows?: unknown })
      | undefined;
    expect(tableNode?.rows).toEqual([
      ["Vance", "Sector 4", "missing"],
      ["Doe", "Pier 9", "cleared"],
    ]);
    expect(JSON.stringify(tableNode?.rows)).not.toContain("[object Object]");
  });

  it("renders a slider (a type the legacy schema previously rejected outright)", () => {
    const { components } = flattenLegacyToCatalog({
      type: "slider",
      label: "Threat level",
      min: 0,
      max: 10,
    });
    expect(components.some((c) => c.text === "Unrenderable component")).toBe(false);
    const slider = components.find((c) => c.component === "Slider") as
      | (SurfaceComponent & { min?: number; max?: number })
      | undefined;
    expect(slider).toBeDefined();
    expect(slider?.min).toBe(0);
    expect(slider?.max).toBe(10);
  });

  it("renders an intake form (inputs without placeholders + slider + modal)", () => {
    const { components } = flattenLegacyToCatalog({
      type: "container",
      children: [
        { type: "input", label: "Name" },
        { type: "textarea", label: "Notes" },
        { type: "checkbox", label: "Confidential source" },
        { type: "select", label: "Precinct", options: ["12th", "9th", "Harbor"] },
        { type: "slider", label: "Threat level", min: 0, max: 10 },
        { type: "button", label: "File Report", action: "submit" },
        {
          type: "modal",
          trigger: { type: "button", label: "View Priors" },
          content: { type: "text", content: "priors" },
        },
      ],
    });
    expect(components.some((c) => c.text === "Unrenderable component")).toBe(false);
    expect(components.some((c) => c.component === "Slider")).toBe(true);
    expect(components.some((c) => c.component === "Modal")).toBe(true);
    expect(components.some((c) => c.component === "ChoicePicker")).toBe(true);
  });

  it("salvages valid siblings instead of blanking the whole tree on one bad node", () => {
    // Regression: a single unrenderable child previously collapsed the ENTIRE
    // surface to one "Unrenderable component" placeholder. Now valid siblings
    // survive.
    const { components } = flattenLegacyToCatalog({
      type: "container",
      children: [
        { type: "heading", text: "Form", level: 2 },
        { type: "totally-bogus-type", foo: 1 } as never,
        { type: "input", label: "Name" },
      ],
    });
    expect(components.some((c) => c.component === "Text" && c.text === "Form")).toBe(true);
    expect(components.some((c) => c.component === "TextField")).toBe(true);
  });

  it("maps a legacy video node into a catalog Video carrying the prompt as its url", () => {
    // The model emits motion footage as `{ type: "video", prompt: "…" }`; it must
    // flatten to a catalog Video whose url is that prompt text, so the renderer
    // shows the on-demand "Generate footage" placeholder (not a broken player).
    const { components, rootId } = flattenLegacyToCatalog({
      type: "video",
      prompt: "grainy security-cam footage of a figure crossing the alley",
      alt: "Alley surveillance",
    } as never);
    const root = components.find((c) => c.id === rootId) as
      | (SurfaceComponent & { url?: string; accessibility?: { label?: string } })
      | undefined;
    expect(root?.component).toBe("Video");
    expect(root?.url).toBe("grainy security-cam footage of a figure crossing the alley");
    expect(root?.accessibility?.label).toBe("Alley surveillance");
  });

  it("keeps a real video src url intact (plays directly, not a prompt)", () => {
    const { components, rootId } = flattenLegacyToCatalog({
      type: "video",
      src: "/footage/clip.mp4",
    } as never);
    const root = components.find((c) => c.id === rootId) as
      | (SurfaceComponent & { url?: string })
      | undefined;
    expect(root?.component).toBe("Video");
    expect(root?.url).toBe("/footage/clip.mp4");
  });
});
