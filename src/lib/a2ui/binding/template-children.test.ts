import { describe, it, expect } from "vitest";

import { resolveChildList } from "./template-children";

describe("resolveChildList", () => {
  it("passes a static string[] through with ids as keys and no scope", () => {
    const result = resolveChildList(["a", "b", "c"], {});

    expect(result).toEqual([
      { componentId: "a", key: "a" },
      { componentId: "b", key: "b" },
      { componentId: "c", key: "c" },
    ]);
    expect(result[0].scope).toBeUndefined();
  });

  it("expands a template over an array of objects with scopes and stable keys", () => {
    const dataModel = {
      items: [{ name: "Neon" }, { name: "Rain" }],
    };

    const result = resolveChildList({ componentId: "row", path: "/items" }, dataModel);

    expect(result).toEqual([
      { componentId: "row", scope: { name: "Neon" }, key: "row-0" },
      { componentId: "row", scope: { name: "Rain" }, key: "row-1" },
    ]);
  });

  it("returns [] when the template path points at a non-array", () => {
    const dataModel = { items: { not: "an array" } };

    expect(resolveChildList({ componentId: "row", path: "/items" }, dataModel)).toEqual([]);
  });

  it("returns [] when the template path is missing", () => {
    expect(resolveChildList({ componentId: "row", path: "/missing" }, {})).toEqual([]);
  });

  it("returns [] for an empty array at the template path", () => {
    const dataModel = { items: [] };

    expect(resolveChildList({ componentId: "row", path: "/items" }, dataModel)).toEqual([]);
  });

  it("returns [] for non-childList input", () => {
    expect(resolveChildList(null, {})).toEqual([]);
    expect(resolveChildList(undefined, {})).toEqual([]);
    expect(resolveChildList(42, {})).toEqual([]);
    expect(resolveChildList("not-a-list", {})).toEqual([]);
    expect(resolveChildList({ componentId: "row" }, {})).toEqual([]);
    expect(resolveChildList({ path: "/items" }, {})).toEqual([]);
  });
});
