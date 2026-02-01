import type { DynamicBoolean, DynamicNumber, DynamicString } from "../schema/common";

import { resolvePointer } from "./pointer";

export function resolveDynamicString(
  value: DynamicString,
  dataModel: Record<string, unknown>,
  scope?: unknown
): string | undefined {
  if (!isStringPointer(value)) {
    return value;
  }

  const resolved = resolvePointer(dataModel, value, scope);
  return coerceString(resolved);
}

export function resolveDynamicNumber(
  value: DynamicNumber,
  dataModel: Record<string, unknown>,
  scope?: unknown
): number | undefined {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : undefined;
  }

  if (typeof value === "string") {
    const resolved = resolvePointer(dataModel, value, scope);
    return coerceNumber(resolved);
  }

  return undefined;
}

export function resolveDynamicBoolean(
  value: DynamicBoolean,
  dataModel: Record<string, unknown>,
  scope?: unknown
): boolean | undefined {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const resolved = resolvePointer(dataModel, value, scope);
    return coerceBoolean(resolved);
  }

  return undefined;
}

function isStringPointer(value: string): boolean {
  return value.startsWith("/");
}

function coerceString(value: unknown): string | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value === "string") {
    return value;
  }

  return String(value);
}

function coerceNumber(value: unknown): number | undefined {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : undefined;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  if (typeof value === "boolean") {
    return value ? 1 : 0;
  }

  return undefined;
}

function coerceBoolean(value: unknown): boolean | undefined {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true" || normalized === "1") {
      return true;
    }

    if (normalized === "false" || normalized === "0") {
      return false;
    }

    return undefined;
  }

  if (typeof value === "number") {
    return value !== 0;
  }

  return undefined;
}
