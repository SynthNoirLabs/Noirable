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

export type BuiltinFunction = (args: unknown[]) => unknown;

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

/** Strict-ish equality: same-type strict equals, else compare String() forms. */
function looseEquals(a: unknown, b: unknown): boolean {
  if (typeof a === typeof b) {
    return a === b;
  }

  return String(a) === String(b);
}

export const functionRegistry: Record<string, BuiltinFunction> = {
  concat: (args) => args.map(coerceString).join(""),
  uppercase: (args) => coerceString(args[0]).toUpperCase(),
  lowercase: (args) => coerceString(args[0]).toLowerCase(),
  not: (args) => !coerceBoolean(args[0]),
  eq: (args) => looseEquals(args[0], args[1]),
  and: (args) => args.every(coerceBoolean),
  or: (args) => args.some(coerceBoolean),
  count: (args) => {
    const value = args[0];
    if (Array.isArray(value) || typeof value === "string") {
      return value.length;
    }
    return 0;
  },
};

/**
 * Evaluate a `functionCall` against the data model. Unknown calls return
 * `undefined`.
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
  return fn(resolvedArgs);
}
