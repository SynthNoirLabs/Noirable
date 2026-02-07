import "server-only";

/**
 * Simple in-memory rate limiter for API routes.
 * NOTE: Resets on serverless cold starts. For production, use Redis or similar.
 */
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 30; // per window

export function checkRateLimit(identifier: string): { allowed: boolean; retryAfterMs?: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(identifier);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(identifier, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true };
  }

  if (entry.count >= RATE_LIMIT_MAX_REQUESTS) {
    return { allowed: false, retryAfterMs: entry.resetAt - now };
  }

  entry.count++;
  return { allowed: true };
}

/**
 * Get a rate limit identifier from the request.
 * Uses X-Forwarded-For in production (behind proxy) or falls back to a constant for dev.
 */
export function getRateLimitId(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return "local";
}

/**
 * Verify same-origin request via Origin/Referer header check.
 * Returns null if valid, or an error Response if invalid.
 */
export function verifySameOrigin(request: Request): Response | null {
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const host = request.headers.get("host");

  // Skip check in development and test environments
  if (process.env.NODE_ENV !== "production") return null;

  // At least one of origin or referer must be present for POST requests
  if (!origin && !referer) {
    return new Response("Forbidden: missing origin", { status: 403 });
  }

  // Verify origin matches host
  if (origin && host) {
    try {
      const originHost = new URL(origin).host;
      if (originHost !== host) {
        return new Response("Forbidden: origin mismatch", { status: 403 });
      }
    } catch {
      return new Response("Forbidden: invalid origin", { status: 403 });
    }
  }

  return null;
}

/**
 * Combined security check: rate limit + CSRF origin verification.
 * Returns null if all checks pass, or an error Response.
 */
export function apiSecurityCheck(request: Request): Response | null {
  // 1. CSRF origin check
  const originError = verifySameOrigin(request);
  if (originError) return originError;

  // 2. Rate limit
  const id = getRateLimitId(request);
  const { allowed, retryAfterMs } = checkRateLimit(id);
  if (!allowed) {
    return new Response("Too Many Requests", {
      status: 429,
      headers: {
        "Retry-After": String(Math.ceil((retryAfterMs ?? 60000) / 1000)),
      },
    });
  }

  return null;
}
