import { describe, it, expect, vi } from "vitest";

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

// ---------------------------------------------------------------------------
// Official A2UI basic-catalog functions (named-arg style)
// ---------------------------------------------------------------------------

describe("evaluateFunctionCall - arithmetic", () => {
  it("add/subtract/multiply with named args", () => {
    expect(evaluateFunctionCall({ call: "add", args: { a: 2, b: 3 } }, {})).toBe(5);
    expect(evaluateFunctionCall({ call: "subtract", args: { a: 10, b: 4 } }, {})).toBe(6);
    expect(evaluateFunctionCall({ call: "multiply", args: { a: 6, b: 7 } }, {})).toBe(42);
  });

  it("coerces string operands to numbers", () => {
    expect(evaluateFunctionCall({ call: "add", args: { a: "2", b: "3" } }, {})).toBe(5);
  });

  it("divide returns Infinity on divide-by-zero and NaN on bad input", () => {
    expect(evaluateFunctionCall({ call: "divide", args: { a: 8, b: 2 } }, {})).toBe(4);
    expect(evaluateFunctionCall({ call: "divide", args: { a: 1, b: 0 } }, {})).toBe(Infinity);
    expect(evaluateFunctionCall({ call: "divide", args: { a: "x", b: 2 } }, {})).toBeNaN();
  });

  it("resolves { path } args before arithmetic", () => {
    const dataModel = { qty: 3, price: 4 };
    expect(
      evaluateFunctionCall(
        { call: "multiply", args: { a: { path: "/qty" }, b: { path: "/price" } } },
        dataModel
      )
    ).toBe(12);
  });
});

describe("evaluateFunctionCall - comparison", () => {
  it("equals/not_equals use strict equality", () => {
    expect(evaluateFunctionCall({ call: "equals", args: { a: 1, b: 1 } }, {})).toBe(true);
    expect(evaluateFunctionCall({ call: "equals", args: { a: 1, b: "1" } }, {})).toBe(false);
    expect(evaluateFunctionCall({ call: "not_equals", args: { a: 1, b: 2 } }, {})).toBe(true);
  });

  it("greater_than/less_than compare numerically", () => {
    expect(evaluateFunctionCall({ call: "greater_than", args: { a: 5, b: 3 } }, {})).toBe(true);
    expect(evaluateFunctionCall({ call: "less_than", args: { a: 5, b: 3 } }, {})).toBe(false);
  });
});

describe("evaluateFunctionCall - string predicates", () => {
  it("contains/starts_with/ends_with", () => {
    expect(
      evaluateFunctionCall(
        { call: "contains", args: { string: "noir city", substring: "city" } },
        {}
      )
    ).toBe(true);
    expect(
      evaluateFunctionCall({ call: "starts_with", args: { string: "noir", prefix: "no" } }, {})
    ).toBe(true);
    expect(
      evaluateFunctionCall({ call: "ends_with", args: { string: "noir", suffix: "ir" } }, {})
    ).toBe(true);
  });
});

describe("evaluateFunctionCall - validation", () => {
  it("required is false for null/undefined/empty", () => {
    expect(evaluateFunctionCall({ call: "required", args: { value: "" } }, {})).toBe(false);
    expect(evaluateFunctionCall({ call: "required", args: { value: [] } }, {})).toBe(false);
    expect(evaluateFunctionCall({ call: "required", args: { value: "x" } }, {})).toBe(true);
  });

  it("regex tests the pattern and never throws on a bad pattern", () => {
    expect(
      evaluateFunctionCall(
        { call: "regex", args: { value: "abc123", pattern: "^[a-z]+\\d+$" } },
        {}
      )
    ).toBe(true);
    expect(evaluateFunctionCall({ call: "regex", args: { value: "x", pattern: "(" } }, {})).toBe(
      false
    );
  });

  it("length checks min/max bounds", () => {
    expect(
      evaluateFunctionCall({ call: "length", args: { value: "abcd", min: 2, max: 5 } }, {})
    ).toBe(true);
    expect(evaluateFunctionCall({ call: "length", args: { value: "a", min: 2 } }, {})).toBe(false);
  });

  it("numeric checks value range", () => {
    expect(evaluateFunctionCall({ call: "numeric", args: { value: 5, min: 1, max: 10 } }, {})).toBe(
      true
    );
    expect(evaluateFunctionCall({ call: "numeric", args: { value: "nope" } }, {})).toBe(false);
  });

  it("email recognizes a plausible address", () => {
    expect(evaluateFunctionCall({ call: "email", args: { value: "sam@noir.co" } }, {})).toBe(true);
    expect(evaluateFunctionCall({ call: "email", args: { value: "not-an-email" } }, {})).toBe(
      false
    );
  });
});

describe("evaluateFunctionCall - formatting", () => {
  it("formatString interpolates ${name} tokens from resolved named args", () => {
    const dataModel = { user: { name: "Sam" } };
    expect(
      evaluateFunctionCall(
        { call: "formatString", args: { value: "Agent ${who}", who: { path: "/user/name" } } },
        dataModel
      )
    ).toBe("Agent Sam");
  });

  it("formatString leaves unknown tokens untouched", () => {
    expect(
      evaluateFunctionCall({ call: "formatString", args: { value: "Hi ${missing}" } }, {})
    ).toBe("Hi ${missing}");
  });

  it("formatNumber applies decimals (locale-independent)", () => {
    // Compare against a reference Intl call so the assertion holds regardless of
    // the runner's locale (separators differ between en-US, de-DE, etc.).
    const expected = new Intl.NumberFormat(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(1234.5);
    expect(
      evaluateFunctionCall({ call: "formatNumber", args: { value: 1234.5, decimals: 2 } }, {})
    ).toBe(expected);
  });

  it("formatCurrency formats with a currency code (locale-independent)", () => {
    const expected = new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: "USD",
    }).format(9.99);
    expect(
      evaluateFunctionCall({ call: "formatCurrency", args: { value: 9.99, currency: "USD" } }, {})
    ).toBe(expected);
  });

  it("formatDate uses token patterns and ISO", () => {
    const iso = "2026-06-04T13:05:09.000Z";
    expect(
      evaluateFunctionCall({ call: "formatDate", args: { value: iso, format: "ISO" } }, {})
    ).toBe(iso);
    // Use a local-time constructor so the date tokens are deterministic.
    const local = new Date(2026, 5, 4).toISOString();
    expect(
      evaluateFunctionCall({ call: "formatDate", args: { value: local, format: "yyyy-MM-dd" } }, {})
    ).toBe("2026-06-04");
    expect(evaluateFunctionCall({ call: "formatDate", args: { value: "garbage" } }, {})).toBe("");
  });

  it("formatDate treats single-quoted text as a literal (does not mangle letters)", () => {
    const local = new Date(2026, 5, 4).toISOString();
    // The `a` in 'at' and letters in 'year' must NOT be replaced with AM/PM etc.
    expect(
      evaluateFunctionCall(
        { call: "formatDate", args: { value: local, format: "MMM d 'at' yyyy" } },
        {}
      )
    ).toBe("Jun 4 at 2026");
    // Doubled '' collapses to a single literal apostrophe.
    expect(
      evaluateFunctionCall(
        { call: "formatDate", args: { value: local, format: "yyyy '''quoted'''" } },
        {}
      )
    ).toBe("2026 'quoted'");
  });

  it("pluralize selects a plural form by count", () => {
    const args = { one: "1 case", other: "{} cases" };
    expect(evaluateFunctionCall({ call: "pluralize", args: { value: 1, ...args } }, {})).toBe(
      "1 case"
    );
    expect(evaluateFunctionCall({ call: "pluralize", args: { value: 5, ...args } }, {})).toBe(
      "{} cases"
    );
  });
});

describe("evaluateFunctionCall - openUrl", () => {
  it("calls window.open only when side effects are allowed (explicit action)", () => {
    const open = vi.fn();
    vi.stubGlobal("window", { open });
    const result = evaluateFunctionCall(
      { call: "openUrl", args: { url: "https://example.test" } },
      {},
      undefined,
      { allowSideEffects: true }
    );
    expect(open).toHaveBeenCalledWith("https://example.test", "_blank", "noopener,noreferrer");
    expect(result).toBeUndefined();
    vi.unstubAllGlobals();
  });

  it("does NOT navigate during value resolution (no side effects by default)", () => {
    const open = vi.fn();
    vi.stubGlobal("window", { open });
    // This is the render path: a binding value that happens to be an openUrl call.
    evaluateFunctionCall({ call: "openUrl", args: { url: "https://example.test" } }, {});
    expect(open).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it("refuses unsafe protocols (javascript:/data:) even with side effects allowed", () => {
    const open = vi.fn();
    vi.stubGlobal("window", { open });
    for (const url of ["javascript:alert(1)", "data:text/html,<script>1</script>", "vbscript:x"]) {
      evaluateFunctionCall({ call: "openUrl", args: { url } }, {}, undefined, {
        allowSideEffects: true,
      });
    }
    expect(open).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
});

describe("functionRegistry - parity coverage", () => {
  it("registers every official basic-catalog function name", () => {
    const officialNames = [
      "add",
      "subtract",
      "multiply",
      "divide",
      "equals",
      "not_equals",
      "greater_than",
      "less_than",
      "and",
      "or",
      "not",
      "contains",
      "starts_with",
      "ends_with",
      "required",
      "regex",
      "length",
      "numeric",
      "email",
      "formatString",
      "formatNumber",
      "formatCurrency",
      "formatDate",
      "pluralize",
      "openUrl",
    ];
    for (const name of officialNames) {
      expect(typeof functionRegistry[name]).toBe("function");
    }
  });
});
