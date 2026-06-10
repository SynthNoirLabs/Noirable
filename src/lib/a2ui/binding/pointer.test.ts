import { describe, it, expect } from "vitest";

import { resolvePointer, setAtPath } from "./pointer";

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

describe("setAtPath", () => {
  it("sets a nested value, creating intermediate objects", () => {
    const root = setAtPath({}, "/user/name", "Ada");
    expect(root).toEqual({ user: { name: "Ada" } });
  });

  it("creates an array when the next token is a numeric index", () => {
    const root = setAtPath({}, "/items/0/id", 1);
    expect(Array.isArray((root as { items: unknown }).items)).toBe(true);
    expect(root).toEqual({ items: [{ id: 1 }] });
  });

  it("replaces the whole model for the root path", () => {
    const next = setAtPath({ a: 1 }, "/", { b: 2 });
    expect(next).toEqual({ b: 2 });
  });

  it("deletes a key when the value is undefined", () => {
    const root = setAtPath({ a: 1, b: 2 }, "/a", undefined);
    expect(root).toEqual({ b: 2 });
  });

  it("rejects prototype-polluting keys (no-op)", () => {
    const root = setAtPath({}, "/__proto__/polluted", true);
    expect(root).toEqual({});
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
  });

  it("unescapes RFC 6901 tokens in write paths", () => {
    const root = setAtPath({}, "/a~1b", 5);
    expect(root).toEqual({ "a/b": 5 });
  });

  it("mutates in place by default", () => {
    const input: Record<string, unknown> = { user: { name: "old" } };
    const out = setAtPath(input, "/user/name", "new");
    expect(out).toBe(input); // same reference
    expect((input.user as { name: string }).name).toBe("new");
  });

  it("immutable mode leaves the input untouched and copies the touched path", () => {
    const input = { user: { name: "old" }, other: { keep: true } };
    const out = setAtPath(input, "/user/name", "new", { immutable: true }) as typeof input;
    // Input unchanged.
    expect(input.user.name).toBe("old");
    // Output has the new value with fresh references along the path.
    expect(out.user.name).toBe("new");
    expect(out).not.toBe(input);
    expect(out.user).not.toBe(input.user);
    // Untouched siblings are shared (shallow copy), not deep-cloned.
    expect(out.other).toBe(input.other);
  });
});
