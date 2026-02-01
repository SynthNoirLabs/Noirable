/**
 * JSON Pointer (RFC 6901) resolver.
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

function unescapeToken(token: string): string {
  return token.replace(/~1/g, "/").replace(/~0/g, "~");
}
