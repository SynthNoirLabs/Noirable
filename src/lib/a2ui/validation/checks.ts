import type { z } from "zod";

import { checkRuleSchema } from "@/lib/a2ui/catalog/components";

export type CheckRule = z.infer<typeof checkRuleSchema>;

/**
 * Email matcher used by the `email` check. Intentionally simple and aligned with
 * the reference validator: one or more non-space/@ chars, an @, more non-space/@
 * chars, a dot, and a TLD.
 */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isEmpty(value: unknown): boolean {
  if (value === undefined || value === null || value === "" || value === false) return true;
  if (Array.isArray(value) && value.length === 0) return true;
  return false;
}

function toNumber(value: unknown): number | undefined {
  if (typeof value === "number") return Number.isNaN(value) ? undefined : value;
  if (typeof value === "string") {
    if (value.trim() === "") return undefined;
    const parsed = Number(value);
    return Number.isNaN(parsed) ? undefined : parsed;
  }
  return undefined;
}

function getNumberArg(args: Record<string, unknown> | undefined, key: string): number | undefined {
  if (!args) return undefined;
  return toNumber(args[key]);
}

/**
 * Runs a single check rule against a value.
 * Returns the check's `message` when it fails, or null when it passes
 * (including unknown `call` values, which are ignored).
 */
function runCheck(value: unknown, check: CheckRule): string | null {
  const { call, args, message } = check;

  switch (call) {
    case "required": {
      return isEmpty(value) ? message : null;
    }
    case "email": {
      if (typeof value !== "string" || value === "") return null;
      return EMAIL_PATTERN.test(value) ? null : message;
    }
    case "regex": {
      if (typeof value !== "string") return null;
      const pattern = args?.pattern;
      if (typeof pattern !== "string") return null;
      try {
        const re = new RegExp(pattern);
        return re.test(value) ? null : message;
      } catch {
        // Invalid pattern => treat as pass.
        return null;
      }
    }
    case "minLength": {
      if (typeof value !== "string") return null;
      const min = getNumberArg(args, "min");
      if (min === undefined) return null;
      return value.length < min ? message : null;
    }
    case "maxLength": {
      if (typeof value !== "string") return null;
      const max = getNumberArg(args, "max");
      if (max === undefined) return null;
      return value.length > max ? message : null;
    }
    case "min": {
      const min = getNumberArg(args, "min");
      if (min === undefined) return null;
      const numeric = toNumber(value);
      if (numeric === undefined) return null;
      return numeric < min ? message : null;
    }
    case "max": {
      const max = getNumberArg(args, "max");
      if (max === undefined) return null;
      const numeric = toNumber(value);
      if (numeric === undefined) return null;
      return numeric > max ? message : null;
    }
    default: {
      // Unknown call => ignored (pass).
      return null;
    }
  }
}

/**
 * Runs each check in order and returns the FIRST failing check's `message`,
 * or null if all checks pass (or there are no checks).
 */
export function runChecks(value: unknown, checks?: CheckRule[]): string | null {
  if (!checks || checks.length === 0) return null;

  for (const check of checks) {
    const failure = runCheck(value, check);
    if (failure !== null) return failure;
  }

  return null;
}
