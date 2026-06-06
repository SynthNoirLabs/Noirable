/**
 * A2UI v0.9 template-children expansion.
 *
 * A childList is either a static array of component ids, or a template object
 * `{ componentId, path }` that renders `componentId` once per element of the
 * array found at `path` in the data model, each with a per-item data scope.
 */

import { resolvePointer } from "@/lib/a2ui/binding/pointer";

export type ResolvedChild = {
  componentId: string;
  scope?: unknown;
  key: string;
};

function isTemplate(value: unknown): value is { componentId: string; path: string } {
  if (value === null || typeof value !== "object") {
    return false;
  }

  const record = value as Record<string, unknown>;
  return typeof record.componentId === "string" && typeof record.path === "string";
}

export function resolveChildList(
  children: unknown,
  dataModel: Record<string, unknown>
): ResolvedChild[] {
  if (Array.isArray(children)) {
    const result: ResolvedChild[] = [];
    children.forEach((id, i) => {
      if (typeof id === "string") {
        // Key by id+index, not bare id: a container may legitimately list the
        // same child id twice, and a bare-id key would collide (React would
        // treat them as one element, sharing focus/animation/state).
        result.push({ componentId: id, key: `${id}-${i}` });
      }
    });
    return result;
  }

  if (isTemplate(children)) {
    const { componentId, path } = children;
    const resolved = resolvePointer(dataModel, path);

    if (!Array.isArray(resolved)) {
      return [];
    }

    return resolved.map((element, i) => ({
      componentId,
      scope: element,
      key: `${componentId}-${i}`,
    }));
  }

  return [];
}
