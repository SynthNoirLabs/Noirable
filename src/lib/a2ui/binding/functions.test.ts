import { describe, it, expect } from "vitest";

import { evaluateFunctionCall, functionRegistry, isFunctionCall } from "./functions";

describe("isFunctionCall", () => {
  it("returns true for an object with a string call and no path", () => {
    expect(isFunctionCall({ call: "uppercase" })).toBe(true);
    expect(isFunctionCall({ call: "concat", args: { values: ["a"] } })).toBe(true);
  });

  it("returns false for a { path } data binding", () => {
    expect(isFunctionCall({ path: "/user/name" })).toBe(false);
  });

  it("returns false when call is missing or not a string", () => {
    expect(isFunctionCall({})).toBe(false);
    expect(isFunctionCall({ call: 42 })).toBe(false);
  });

  it("returns false for non-objects and null", () => {
    expect(isFunctionCall(null)).toBe(false);
    expect(isFunctionCall(undefined)).toBe(false);
    expect(isFunctionCall("call")).toBe(false);
    expect(isFunctionCall(7)).toBe(false);
  });

  it("returns false when both call and path are present", () => {
    expect(isFunctionCall({ call: "uppercase", path: "/x" })).toBe(false);
  });
});

describe("evaluateFunctionCall - concat", () => {
  it("joins values from an args.values array", () => {
    expect(evaluateFunctionCall({ call: "concat", args: { values: ["a", "b", "c"] } }, {})).toBe(
      "abc"
    );
  });

  it("joins positional args by Object.values order", () => {
    expect(evaluateFunctionCall({ call: "concat", args: { a: "foo", b: "bar" } }, {})).toBe(
      "foobar"
    );
  });

  it("coerces non-string values and treats null/undefined as empty", () => {
    expect(
      evaluateFunctionCall({ call: "concat", args: { values: [1, true, null, undefined] } }, {})
    ).toBe("1true");
  });

  it("returns empty string with no args", () => {
    expect(evaluateFunctionCall({ call: "concat" }, {})).toBe("");
  });
});

describe("evaluateFunctionCall - case helpers", () => {
  it("uppercase converts to upper case", () => {
    expect(evaluateFunctionCall({ call: "uppercase", args: { values: ["noir"] } }, {})).toBe(
      "NOIR"
    );
  });

  it("lowercase converts to lower case", () => {
    expect(evaluateFunctionCall({ call: "lowercase", args: { values: ["NOIR"] } }, {})).toBe(
      "noir"
    );
  });

  it("coerces non-string input for case helpers", () => {
    expect(evaluateFunctionCall({ call: "uppercase", args: { values: [42] } }, {})).toBe("42");
  });
});

describe("evaluateFunctionCall - boolean logic", () => {
  it("not negates truthiness", () => {
    expect(evaluateFunctionCall({ call: "not", args: { values: [true] } }, {})).toBe(false);
    expect(evaluateFunctionCall({ call: "not", args: { values: [0] } }, {})).toBe(true);
    expect(evaluateFunctionCall({ call: "not", args: { values: [""] } }, {})).toBe(true);
  });

  it("and reduces over arg truthiness", () => {
    expect(evaluateFunctionCall({ call: "and", args: { values: [true, 1, "x"] } }, {})).toBe(true);
    expect(evaluateFunctionCall({ call: "and", args: { values: [true, 0] } }, {})).toBe(false);
    expect(evaluateFunctionCall({ call: "and", args: { values: [] } }, {})).toBe(true);
  });

  it("or reduces over arg truthiness", () => {
    expect(evaluateFunctionCall({ call: "or", args: { values: [false, 0, "x"] } }, {})).toBe(true);
    expect(evaluateFunctionCall({ call: "or", args: { values: [false, 0, ""] } }, {})).toBe(false);
    expect(evaluateFunctionCall({ call: "or", args: { values: [] } }, {})).toBe(false);
  });
});

describe("evaluateFunctionCall - eq", () => {
  it("compares same-type values strictly", () => {
    expect(evaluateFunctionCall({ call: "eq", args: { a: "x", b: "x" } }, {})).toBe(true);
    expect(evaluateFunctionCall({ call: "eq", args: { a: "x", b: "y" } }, {})).toBe(false);
  });

  it("compares String() forms across types", () => {
    expect(evaluateFunctionCall({ call: "eq", args: { a: 42, b: "42" } }, {})).toBe(true);
    expect(evaluateFunctionCall({ call: "eq", args: { a: true, b: "true" } }, {})).toBe(true);
    expect(evaluateFunctionCall({ call: "eq", args: { a: 1, b: "2" } }, {})).toBe(false);
  });
});

describe("evaluateFunctionCall - count", () => {
  it("returns length of an array", () => {
    expect(evaluateFunctionCall({ call: "count", args: { values: [[1, 2, 3]] } }, {})).toBe(3);
  });

  it("returns length of a string", () => {
    expect(evaluateFunctionCall({ call: "count", args: { values: ["abcd"] } }, {})).toBe(4);
  });

  it("returns 0 for non-countable values", () => {
    expect(evaluateFunctionCall({ call: "count", args: { values: [42] } }, {})).toBe(0);
    expect(evaluateFunctionCall({ call: "count", args: { values: [{}] } }, {})).toBe(0);
    expect(evaluateFunctionCall({ call: "count" }, {})).toBe(0);
  });
});

describe("evaluateFunctionCall - arg resolution", () => {
  it("resolves { path } bindings against the data model", () => {
    const dataModel = { user: { name: "Ada" } };

    expect(
      evaluateFunctionCall(
        { call: "uppercase", args: { value: { path: "/user/name" } } },
        dataModel
      )
    ).toBe("ADA");
  });

  it("resolves { path } bindings inside concat", () => {
    const dataModel = { greeting: "Hello, ", name: "Sam" };

    expect(
      evaluateFunctionCall(
        { call: "concat", args: { values: [{ path: "/greeting" }, { path: "/name" }] } },
        dataModel
      )
    ).toBe("Hello, Sam");
  });

  it("resolves relative pointers via scope", () => {
    const dataModel = { items: [{ label: "first" }] };
    const scope = { label: "scoped" };

    expect(
      evaluateFunctionCall(
        { call: "uppercase", args: { value: { path: "label" } } },
        dataModel,
        scope
      )
    ).toBe("SCOPED");
  });

  it("recurses into nested functionCall args", () => {
    const dataModel = { name: "ada" };

    expect(
      evaluateFunctionCall(
        {
          call: "concat",
          args: {
            values: ["Agent ", { call: "uppercase", args: { value: { path: "/name" } } }],
          },
        },
        dataModel
      )
    ).toBe("Agent ADA");
  });

  it("does not treat a { path } arg as a function call", () => {
    const dataModel = { call: { path: "/should/not/run" } };

    expect(
      evaluateFunctionCall({ call: "count", args: { values: [{ path: "/missing" }] } }, dataModel)
    ).toBe(0);
  });
});

describe("evaluateFunctionCall - unknown call", () => {
  it("returns undefined for an unregistered function", () => {
    expect(evaluateFunctionCall({ call: "nope", args: { values: [1] } }, {})).toBeUndefined();
  });
});

describe("functionRegistry", () => {
  it("exposes the built-in functions for extension", () => {
    expect(typeof functionRegistry.concat).toBe("function");
    expect(typeof functionRegistry.eq).toBe("function");
    expect(functionRegistry.uppercase(["hi"])).toBe("HI");
  });
});
