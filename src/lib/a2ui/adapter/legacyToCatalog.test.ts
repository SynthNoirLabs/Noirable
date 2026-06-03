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
});
