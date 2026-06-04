/**
 * A2UI v0.9 function-call evaluator for dynamic data bindings.
 *
 * A Dynamic value can be a `functionCall`: `{ call: string, args?: Record<string, unknown> }`.
 * This module provides a small, SAFE built-in function registry that evaluates
 * those calls against the data model. Args may themselves be `{ path }` bindings
 * or nested function calls, which are resolved recursively before invocation.
 */

import { resolvePointer } from "./pointer";

export interface FunctionCall {
  call: string;
  args?: Record<string, unknown>;
}

/**
 * A built-in function. Receives BOTH the positional args (flattened from
 * `{ values: [...] }` or `Object.values(args)`) and the resolved named-arg map,
 * so callers can address arguments either way. The official A2UI basic catalog
 * keys arguments by name (`a`, `b`, `value`, `decimals`, …); positional support
 * is kept for back-compat with our original `{ values: [...] }` calling style.
 */
export type BuiltinFunction = (args: unknown[], named?: Record<string, unknown>) => unknown;

interface PathBinding {
  path: string;
}

/**
 * Type guard for a `functionCall`. True when `value` is a plain object with a
 * string `call` property and NO `path` key (so it is not confused with a
 * `{ path }` data binding).
 */
export function isFunctionCall(value: unknown): value is FunctionCall {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const record = value as Record<string, unknown>;
  return typeof record.call === "string" && !("path" in record);
}

function isPathBinding(value: unknown): value is PathBinding {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const record = value as Record<string, unknown>;
  return typeof record.path === "string";
}

/**
 * Resolve a single argument value: `{ path }` bindings resolve via JSON Pointer,
 * nested function calls recurse, everything else passes through as a literal.
 */
function resolveArg(value: unknown, dataModel: Record<string, unknown>, scope?: unknown): unknown {
  if (isPathBinding(value)) {
    return resolvePointer(dataModel, value.path, scope);
  }

  if (isFunctionCall(value)) {
    return evaluateFunctionCall(value, dataModel, scope);
  }

  return value;
}

/**
 * Flatten a `functionCall`'s `args` into a positional list of resolved values.
 * Supports both an explicit `{ values: [...] }` array form and the positional
 * `{ a, b, ... }` object-map form (taking `Object.values` order).
 */
function resolveArgs(
  args: Record<string, unknown> | undefined,
  dataModel: Record<string, unknown>,
  scope?: unknown
): unknown[] {
  if (args === undefined || args === null) {
    return [];
  }

  const raw = Array.isArray(args.values) ? args.values : Object.values(args);
  return raw.map((value) => resolveArg(value, dataModel, scope));
}

/**
 * Resolve a `functionCall`'s `args` into a named map of resolved values, so
 * functions can read arguments by name (`a`, `b`, `decimals`, plural forms…).
 * Each value is resolved the same way as positional args: `{ path }` bindings
 * and nested function calls are evaluated; literals pass through.
 */
function resolveNamedArgs(
  args: Record<string, unknown> | undefined,
  dataModel: Record<string, unknown>,
  scope?: unknown
): Record<string, unknown> {
  if (args === undefined || args === null) {
    return {};
  }

  const resolved: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(args)) {
    resolved[key] = resolveArg(value, dataModel, scope);
  }
  return resolved;
}

function coerceString(value: unknown): string {
  if (value === undefined || value === null) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  return String(value);
}

function coerceBoolean(value: unknown): boolean {
  return Boolean(value);
}

/** Coerce to a number; non-numeric input becomes NaN (so callers can guard). */
function coerceNumber(value: unknown): number {
  if (typeof value === "number") {
    return value;
  }
  if (value === null || value === undefined || value === "") {
    return NaN;
  }
  return Number(value);
}

/** Strict-ish equality: same-type strict equals, else compare String() forms. */
function looseEquals(a: unknown, b: unknown): boolean {
  if (typeof a === typeof b) {
    return a === b;
  }

  return String(a) === String(b);
}

/**
 * Read a named argument, falling back to a positional index. Lets the same
 * function body serve both calling styles: `{ a, b }` and `{ values: [a, b] }`.
 */
function pick(
  named: Record<string, unknown> | undefined,
  key: string,
  positional: unknown[],
  index: number
): unknown {
  if (named && key in named) {
    return named[key];
  }
  return positional[index];
}

/** Length of a string or array; 0 for anything else. */
function lengthOf(value: unknown): number {
  if (typeof value === "string" || Array.isArray(value)) {
    return value.length;
  }
  return 0;
}

/**
 * Format a Date using a small subset of date-fns-style tokens. Supported:
 *   yyyy (4-digit year), yy (2-digit), MMMM (full month), MMM (short month),
 *   MM (2-digit month), M (month), dd (2-digit day), d (day),
 *   HH (24h hour), H, hh (12h hour), h, mm (minutes), m, ss (seconds), s, a (AM/PM).
 * The special pattern "ISO" returns the ISO 8601 string. Unknown tokens pass
 * through literally. This avoids a date-fns dependency for the common cases
 * LLM-generated surfaces actually emit.
 */
function formatDateWithPattern(date: Date, pattern: string): string {
  if (pattern === "ISO") {
    return date.toISOString();
  }

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const pad = (n: number) => String(n).padStart(2, "0");
  const hours24 = date.getHours();
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;

  const tokens: Record<string, string> = {
    yyyy: String(date.getFullYear()),
    yy: pad(date.getFullYear() % 100),
    MMMM: months[date.getMonth()],
    MMM: months[date.getMonth()].slice(0, 3),
    MM: pad(date.getMonth() + 1),
    M: String(date.getMonth() + 1),
    dd: pad(date.getDate()),
    d: String(date.getDate()),
    HH: pad(hours24),
    H: String(hours24),
    hh: pad(hours12),
    h: String(hours12),
    mm: pad(date.getMinutes()),
    m: String(date.getMinutes()),
    ss: pad(date.getSeconds()),
    s: String(date.getSeconds()),
    a: hours24 < 12 ? "AM" : "PM",
  };

  // Match longest tokens first so `yyyy` wins over `yy`, `MMMM` over `MM`, etc.
  return pattern.replace(
    /yyyy|yy|MMMM|MMM|MM|M|dd|d|HH|H|hh|h|mm|m|ss|s|a/g,
    (match) => tokens[match] ?? match
  );
}

/**
 * Built-in function registry for `{ call, args }` dynamic bindings.
 *
 * Names and semantics mirror the official A2UI v0.9 "basic" catalog functions
 * (github.com/a2ui-project/a2ui — web_core/src/v0_9/basic_catalog/functions),
 * so spec-conformant surfaces evaluate the same here. Each function receives
 * resolved positional args plus a resolved named-arg map; functions read by the
 * argument names the spec uses (`a`/`b`, `value`, `decimals`, …) and fall back
 * to positional order for our original `{ values: [...] }` calling style.
 *
 * Functions are pure (no side effects) except `openUrl`, which opens a window.
 */
export const functionRegistry: Record<string, BuiltinFunction> = {
  // --- Original built-ins (positional; unchanged semantics) -----------------
  concat: (args) => args.map(coerceString).join(""),
  uppercase: (args) => coerceString(args[0]).toUpperCase(),
  lowercase: (args) => coerceString(args[0]).toLowerCase(),
  not: (args, named) => !coerceBoolean(pick(named, "value", args, 0)),
  eq: (args, named) => looseEquals(pick(named, "a", args, 0), pick(named, "b", args, 1)),
  // `args` already flattens + resolves both `{ values: [...] }` and `{ a, b }`,
  // so positional reduction handles every calling style (and resolves any
  // `{ path }` bindings inside the list).
  and: (args) => args.every(coerceBoolean),
  or: (args) => args.some(coerceBoolean),
  count: (args) => lengthOf(args[0]),

  // --- Arithmetic -----------------------------------------------------------
  add: (args, named) =>
    coerceNumber(pick(named, "a", args, 0)) + coerceNumber(pick(named, "b", args, 1)),
  subtract: (args, named) =>
    coerceNumber(pick(named, "a", args, 0)) - coerceNumber(pick(named, "b", args, 1)),
  multiply: (args, named) =>
    coerceNumber(pick(named, "a", args, 0)) * coerceNumber(pick(named, "b", args, 1)),
  divide: (args, named) => {
    const a = coerceNumber(pick(named, "a", args, 0));
    const b = coerceNumber(pick(named, "b", args, 1));
    if (Number.isNaN(a) || Number.isNaN(b)) {
      return NaN;
    }
    if (b === 0) {
      return Infinity;
    }
    return a / b;
  },

  // --- Comparison -----------------------------------------------------------
  equals: (args, named) => pick(named, "a", args, 0) === pick(named, "b", args, 1),
  not_equals: (args, named) => pick(named, "a", args, 0) !== pick(named, "b", args, 1),
  greater_than: (args, named) =>
    coerceNumber(pick(named, "a", args, 0)) > coerceNumber(pick(named, "b", args, 1)),
  less_than: (args, named) =>
    coerceNumber(pick(named, "a", args, 0)) < coerceNumber(pick(named, "b", args, 1)),

  // --- String predicates ----------------------------------------------------
  contains: (args, named) =>
    coerceString(pick(named, "string", args, 0)).includes(
      coerceString(pick(named, "substring", args, 1))
    ),
  starts_with: (args, named) =>
    coerceString(pick(named, "string", args, 0)).startsWith(
      coerceString(pick(named, "prefix", args, 1))
    ),
  ends_with: (args, named) =>
    coerceString(pick(named, "string", args, 0)).endsWith(
      coerceString(pick(named, "suffix", args, 1))
    ),

  // --- Validation -----------------------------------------------------------
  required: (args, named) => {
    const value = pick(named, "value", args, 0);
    if (value === null || value === undefined) {
      return false;
    }
    if (typeof value === "string" && value === "") {
      return false;
    }
    if (Array.isArray(value) && value.length === 0) {
      return false;
    }
    return true;
  },
  regex: (args, named) => {
    const value = coerceString(pick(named, "value", args, 0));
    const pattern = coerceString(pick(named, "pattern", args, 1));
    try {
      return new RegExp(pattern).test(value);
    } catch {
      // Invalid pattern: treat as non-matching rather than throwing, so one
      // malformed generated check can't crash the surface.
      return false;
    }
  },
  length: (args, named) => {
    const len = lengthOf(pick(named, "value", args, 0));
    const min = coerceNumber(pick(named, "min", args, 1));
    const max = coerceNumber(pick(named, "max", args, 2));
    if (!Number.isNaN(min) && len < min) {
      return false;
    }
    if (!Number.isNaN(max) && len > max) {
      return false;
    }
    return true;
  },
  numeric: (args, named) => {
    const value = coerceNumber(pick(named, "value", args, 0));
    if (Number.isNaN(value)) {
      return false;
    }
    const min = coerceNumber(pick(named, "min", args, 1));
    const max = coerceNumber(pick(named, "max", args, 2));
    if (!Number.isNaN(min) && value < min) {
      return false;
    }
    if (!Number.isNaN(max) && value > max) {
      return false;
    }
    return true;
  },
  email: (args, named) =>
    /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(
      coerceString(pick(named, "value", args, 0))
    ),

  // --- Formatting -----------------------------------------------------------
  // formatString interpolates `${name}` tokens in `value` from the call's
  // OTHER named args (each already path-/function-resolved). The official
  // catalog resolves `${...}` via an expression parser against the data model;
  // we don't ship that parser, so this self-contained form covers the common
  // case `{ value: "Hi ${who}", who: { path: "/user/name" } }`.
  formatString: (args, named) => {
    const template = coerceString(pick(named, "value", args, 0));
    return template.replace(/\$\{([^}]+)\}/g, (whole, key: string) => {
      const name = key.trim();
      if (named && name in named && name !== "value") {
        return coerceString(named[name]);
      }
      return whole;
    });
  },
  formatNumber: (args, named) => {
    const value = coerceNumber(pick(named, "value", args, 0));
    if (Number.isNaN(value)) {
      return "";
    }
    const decimals = pick(named, "decimals", args, 1);
    const grouping = pick(named, "grouping", args, 2);
    try {
      return new Intl.NumberFormat(undefined, {
        minimumFractionDigits: typeof decimals === "number" ? decimals : undefined,
        maximumFractionDigits: typeof decimals === "number" ? decimals : undefined,
        useGrouping: typeof grouping === "boolean" ? grouping : undefined,
      }).format(value);
    } catch {
      return typeof decimals === "number" ? value.toFixed(decimals) : String(value);
    }
  },
  formatCurrency: (args, named) => {
    const value = coerceNumber(pick(named, "value", args, 0));
    if (Number.isNaN(value)) {
      return "";
    }
    const currency = coerceString(pick(named, "currency", args, 1)) || "USD";
    const decimals = pick(named, "decimals", args, 2);
    try {
      return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency,
        minimumFractionDigits: typeof decimals === "number" ? decimals : undefined,
        maximumFractionDigits: typeof decimals === "number" ? decimals : undefined,
      }).format(value);
    } catch {
      return value.toFixed(typeof decimals === "number" ? decimals : 2);
    }
  },
  formatDate: (args, named) => {
    const raw = pick(named, "value", args, 0);
    if (raw === null || raw === undefined || raw === "") {
      return "";
    }
    const date = new Date(raw as string | number | Date);
    if (Number.isNaN(date.getTime())) {
      return "";
    }
    const pattern = coerceString(pick(named, "format", args, 1)) || "ISO";
    try {
      return formatDateWithPattern(date, pattern);
    } catch {
      return date.toISOString();
    }
  },
  pluralize: (args, named) => {
    const value = coerceNumber(pick(named, "value", args, 0));
    const other = named?.other;
    if (Number.isNaN(value)) {
      return coerceString(other);
    }
    try {
      const rule = new Intl.PluralRules(undefined).select(value);
      const form = named?.[rule];
      return coerceString(form ?? other ?? "");
    } catch {
      return coerceString(other ?? "");
    }
  },

  // --- Actions --------------------------------------------------------------
  openUrl: (args, named) => {
    const url = coerceString(pick(named, "url", args, 0));
    if (url && typeof window !== "undefined" && typeof window.open === "function") {
      window.open(url, "_blank");
    }
    return undefined;
  },
};

/**
 * Evaluate a `functionCall` against the data model. Unknown calls return
 * `undefined`. Functions receive both resolved positional args and a resolved
 * named-arg map (see {@link functionRegistry}).
 */
export function evaluateFunctionCall(
  fc: FunctionCall,
  dataModel: Record<string, unknown>,
  scope?: unknown
): unknown {
  const fn = functionRegistry[fc.call];
  if (fn === undefined) {
    return undefined;
  }

  const resolvedArgs = resolveArgs(fc.args, dataModel, scope);
  const resolvedNamed = resolveNamedArgs(fc.args, dataModel, scope);
  return fn(resolvedArgs, resolvedNamed);
}
