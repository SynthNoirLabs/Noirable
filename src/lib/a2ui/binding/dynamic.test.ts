import { describe, it, expect } from "vitest";

import { resolveDynamicString, resolveDynamicNumber, resolveDynamicBoolean } from "./dynamic";

describe("dynamic binding", () => {
  it("returns literal dynamic strings", () => {
    const dataModel = { user: { name: "Ada" } };

    expect(resolveDynamicString("Casefile", dataModel)).toBe("Casefile");
  });

  it("resolves dynamic strings from absolute pointers", () => {
    const dataModel = { user: { name: "Ada" } };

    expect(resolveDynamicString("/user/name", dataModel)).toBe("Ada");
  });

  it("coerces dynamic numbers from bound values", () => {
    const dataModel = { metrics: { count: "42" } };

    expect(resolveDynamicNumber("/metrics/count", dataModel)).toBe(42);
  });

  it("coerces dynamic booleans from bound values", () => {
    const dataModel = { flags: { active: "true", disabled: 0 } };

    expect(resolveDynamicBoolean("/flags/active", dataModel)).toBe(true);
    expect(resolveDynamicBoolean("/flags/disabled", dataModel)).toBe(false);
  });

  it("resolves relative bindings with scope", () => {
    const dataModel = { items: [{ count: "7" }] };
    const scope = dataModel.items[0];

    expect(resolveDynamicNumber("count", dataModel, scope)).toBe(7);
  });

  it("returns undefined when a binding is missing", () => {
    const dataModel = { user: { name: "Ada" } };

    expect(resolveDynamicString("/user/title", dataModel)).toBeUndefined();
  });
});
