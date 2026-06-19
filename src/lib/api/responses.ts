/**
 * Standardized API response helpers for consistent error/success shapes.
 */

/**
 * Return a standardized error response with consistent shape:
 * { error: string, ...details }
 */
export function apiError(message: string, status = 500, details?: unknown): Response {
  const body: Record<string, unknown> = { error: message };
  if (details !== undefined) {
    if (typeof details === "object" && details !== null && !Array.isArray(details)) {
      Object.assign(body, details);
    } else {
      body.details = details;
    }
  }
  return Response.json(body, { status });
}

/**
 * Parse JSON body from a Request with graceful failure.
 * Returns null if parsing fails (malformed JSON or empty body).
 */
export async function parseJsonBody<T = unknown>(request: Request): Promise<T | null> {
  try {
    return (await request.json()) as T;
  } catch {
    return null;
  }
}
