import { describe, it, expect } from "vitest";
import { enrichA2UI } from "./enrich";
import type { A2UIInput } from "@/lib/protocol/schema";

const card = (title: string): A2UIInput => ({ type: "card", title, status: "active" });

describe("enrichA2UI — auto-grid card stacks", () => {
  it("wraps a column of 3+ bare cards in a grid", () => {
    const tree: A2UIInput = {
      type: "column",
      children: [card("A"), card("B"), card("C")],
    };
    const out = enrichA2UI(tree) as { children: A2UIInput[] };
    expect(out.children).toHaveLength(1);
    const grid = out.children[0] as { type: string; columns?: string; children: A2UIInput[] };
    expect(grid.type).toBe("grid");
    expect(grid.children).toHaveLength(3);
    expect(grid.columns).toBe("2"); // 3 cards -> 2 columns
  });

  it("uses 3 columns for 4+ cards", () => {
    const tree: A2UIInput = {
      type: "column",
      children: [card("A"), card("B"), card("C"), card("D")],
    };
    const grid = (enrichA2UI(tree) as { children: A2UIInput[] }).children[0] as {
      columns?: string;
    };
    expect(grid.columns).toBe("3");
  });

  it("leaves a small stack (< 3 cards) untouched", () => {
    const tree: A2UIInput = { type: "column", children: [card("A"), card("B")] };
    const out = enrichA2UI(tree) as { children: A2UIInput[] };
    expect(out.children).toHaveLength(2);
    expect(out.children.every((c) => c.type === "card")).toBe(true);
  });

  it("leaves a mixed stack (cards + other content) untouched", () => {
    const tree: A2UIInput = {
      type: "column",
      children: [
        card("A"),
        { type: "text", content: "note", priority: "normal" },
        card("B"),
        card("C"),
      ],
    };
    const out = enrichA2UI(tree) as { children: A2UIInput[] };
    expect(out.children).toHaveLength(4); // not wrapped
    expect(out.children.some((c) => c.type === "grid")).toBe(false);
  });

  it("is idempotent — re-running does not double-wrap", () => {
    const tree: A2UIInput = {
      type: "column",
      children: [card("A"), card("B"), card("C")],
    };
    const once = enrichA2UI(tree);
    const twice = enrichA2UI(once);
    expect(JSON.stringify(twice)).toBe(JSON.stringify(once));
  });
});

describe("enrichA2UI — leading heading promotion", () => {
  it("promotes a short leading paragraph at the root to a heading", () => {
    const tree: A2UIInput = {
      type: "column",
      children: [
        { type: "paragraph", text: "Case File 8042" },
        { type: "paragraph", text: "The rain never stops." },
      ],
    };
    const out = enrichA2UI(tree) as { children: A2UIInput[] };
    expect(out.children[0].type).toBe("heading");
    expect((out.children[0] as { text: string }).text).toBe("Case File 8042");
  });

  it("does NOT promote long leading body text", () => {
    const longText = "x".repeat(80);
    const tree: A2UIInput = {
      type: "column",
      children: [
        { type: "paragraph", text: longText },
        { type: "paragraph", text: "more" },
      ],
    };
    const out = enrichA2UI(tree) as { children: A2UIInput[] };
    expect(out.children[0].type).toBe("paragraph");
  });

  it("does not promote when a heading already follows", () => {
    const tree: A2UIInput = {
      type: "column",
      children: [
        { type: "paragraph", text: "Subtitle" },
        { type: "heading", text: "Real Title", level: 1 },
      ],
    };
    const out = enrichA2UI(tree) as { children: A2UIInput[] };
    expect(out.children[0].type).toBe("paragraph"); // left as-is
  });

  it("only promotes at the root, not in nested containers", () => {
    const tree: A2UIInput = {
      type: "column",
      children: [
        { type: "heading", text: "Top", level: 1 },
        {
          type: "column",
          children: [
            { type: "paragraph", text: "Nested label" },
            { type: "paragraph", text: "body" },
          ],
        },
      ],
    };
    const out = enrichA2UI(tree) as { children: A2UIInput[] };
    const nested = out.children[1] as { children: A2UIInput[] };
    expect(nested.children[0].type).toBe("paragraph"); // not promoted (not root)
  });
});

describe("enrichA2UI — non-destructive", () => {
  it("returns a leaf root unchanged", () => {
    const tree: A2UIInput = { type: "card", title: "Lone", status: "active" };
    expect(enrichA2UI(tree)).toEqual(tree);
  });

  it("does not mutate the input tree", () => {
    const tree: A2UIInput = {
      type: "column",
      children: [card("A"), card("B"), card("C")],
    };
    const snapshot = JSON.stringify(tree);
    enrichA2UI(tree);
    expect(JSON.stringify(tree)).toBe(snapshot);
  });
});
