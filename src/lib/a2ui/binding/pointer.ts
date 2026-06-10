/**
 * JSON Pointer (RFC 6901) resolver + writer.
 * Supports absolute pointers ("/path/to/value") and relative pointers
 * when a scope object is provided.
 */

export function resolvePointer(root: unknown, pointer: string, scope?: unknown): unknown {
  if (pointer === "") {
    return root;
  }

  const isAbsolute = pointer.startsWith("/");
  const base = isAbsolute ? root : (scope ?? root);
  const tokens = isAbsolute ? pointer.slice(1).split("/") : pointer.split("/");

  return resolveTokens(base, tokens);
}

function resolveTokens(base: unknown, tokens: string[]): unknown {
  let current: unknown = base;

  for (const rawToken of tokens) {
    if (current === null || current === undefined) {
      return undefined;
    }

    if (typeof current !== "object") {
      return undefined;
    }

    const token = unescapeToken(rawToken);
    const record = current as Record<string, unknown>;
    current = record[token];
  }

  return current;
}

/** Decode a JSON Pointer token per RFC 6901 (~1 → "/", ~0 → "~"). */
export function unescapeToken(token: string): string {
  return token.replace(/~1/g, "/").replace(/~0/g, "~");
}

/** Keys that must never be written through a JSON Pointer (prototype pollution). */
export const UNSAFE_POINTER_KEYS = new Set(["__proto__", "constructor", "prototype"]);

/**
 * Sets (or deletes) a value in an object at a JSON Pointer path, implementing
 * the A2UI v0.9 upsert semantics shared by the store and the renderer:
 * - Root path ("/" or "") replaces the entire data model.
 * - An `undefined` value removes the key (or splices the array index).
 * - Missing intermediate containers are created (array when the next token is
 *   a numeric index, object otherwise).
 * - Tokens are RFC 6901 decoded; prototype-polluting keys are rejected (no-op).
 *
 * By default the input is mutated in place and returned (the store's reactive
 * Map already holds a fresh object per surface). Pass `{ immutable: true }` to
 * instead return a fresh object graph along the touched path, leaving the input
 * untouched — the renderer needs this so React sees a new reference.
 *
 * @returns The (possibly new) root object to assign back.
 */
export function setAtPath(
  root: Record<string, unknown>,
  path: string,
  value: unknown,
  options: { immutable?: boolean } = {}
): Record<string, unknown> {
  const immutable = options.immutable ?? false;

  // Root path → replace the whole model with a shallow copy of the new object.
  if (path === "/" || path === "") {
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      return { ...(value as Record<string, unknown>) };
    }
    // A non-object root value is not representable as a data model; ignore.
    return root;
  }

  const parts = path.replace(/^\//, "").split("/").map(unescapeToken);

  if (parts.some((part) => UNSAFE_POINTER_KEYS.has(part))) {
    return root;
  }

  const out = immutable ? shallowCopy(root) : root;
  let cursor: Record<string, unknown> = out;

  // Navigate to the parent of the target, creating/copying containers as needed.
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    const nextIsArray = /^\d+$/.test(parts[i + 1]);
    const existing = cursor[part];

    if (existing === null || typeof existing !== "object") {
      cursor[part] = nextIsArray ? [] : {};
    } else if (immutable) {
      // Copy each touched container so the original graph is left intact.
      cursor[part] = shallowCopy(existing as Record<string, unknown>);
    }

    cursor = cursor[part] as Record<string, unknown>;
  }

  const last = parts[parts.length - 1];

  // An omitted value deletes the key (v0.9 delete semantics).
  if (value === undefined) {
    if (Array.isArray(cursor) && /^\d+$/.test(last)) {
      (cursor as unknown[]).splice(Number(last), 1);
    } else {
      delete cursor[last];
    }
    return out;
  }

  cursor[last] = value;
  return out;
}

/** Shallow-copy an object or array, preserving the array-ness. */
function shallowCopy(value: Record<string, unknown>): Record<string, unknown> {
  return (Array.isArray(value) ? [...value] : { ...value }) as Record<string, unknown>;
}
