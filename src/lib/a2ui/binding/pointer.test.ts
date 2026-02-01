import { describe, it, expect } from "vitest";

import { resolvePointer } from "./pointer";

describe("resolvePointer", () => {
  it("resolves absolute pointer paths", () => {
    const data = {
      user: { name: "Ada" },
      items: [{ id: 1 }, { id: 2 }],
    };

    expect(resolvePointer(data, "/user/name")).toBe("Ada");
    expect(resolvePointer(data, "/items/0/id")).toBe(1);
  });

  it("resolves relative pointer paths with scope", () => {
    const data = {
      items: [
        { id: "first", meta: { label: "alpha" } },
        { id: "second", meta: { label: "beta" } },
      ],
    };

    const scope = data.items[1];
    expect(resolvePointer(data, "id", scope)).toBe("second");
    expect(resolvePointer(data, "meta/label", scope)).toBe("beta");
  });

  it("returns undefined for missing paths", () => {
    const data = { user: { name: "Ada" } };

    expect(resolvePointer(data, "/user/age")).toBeUndefined();
    expect(resolvePointer(data, "missing", data)).toBeUndefined();
  });

  it("returns the root value for empty pointer", () => {
    const data = { root: true };

    expect(resolvePointer(data, "")).toEqual(data);
  });

  it("unescapes RFC 6901 tokens", () => {
    const data = { "a/b": { "~c": 42 } };

    expect(resolvePointer(data, "/a~1b/~0c")).toBe(42);
  });
});
