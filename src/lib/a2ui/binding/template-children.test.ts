import { describe, it, expect } from "vitest";

import { resolveChildList } from "./template-children";

describe("resolveChildList", () => {
  it("passes a static string[] through with id+index keys and no scope", () => {
    const result = resolveChildList(["a", "b", "c"], {});

    expect(result).toEqual([
      { componentId: "a", key: "a-0" },
      { componentId: "b", key: "b-1" },
      { componentId: "c", key: "c-2" },
    ]);
    expect(result[0].scope).toBeUndefined();
  });

  it("gives duplicate child ids distinct keys (no React key collision)", () => {
    const result = resolveChildList(["btn", "btn"], {});

    expect(result).toEqual([
      { componentId: "btn", key: "btn-0" },
      { componentId: "btn", key: "btn-1" },
    ]);
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
