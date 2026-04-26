import "server-only";

/**
 * Rate limiting + CSRF for API routes.
 *
 * Two backends:
 *  - in-memory (default): per-process Map with TTL eviction and size cap.
 *    Resets on serverless cold starts; intended for single-instance/local use.
 *  - Upstash REST (production): activates when UPSTASH_REDIS_REST_URL and
 *    UPSTASH_REDIS_REST_TOKEN are set. Uses INCR + EXPIRE for atomic limiting.
 */

const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 30; // per window
const IN_MEMORY_MAX_KEYS = 10_000;

export interface RateLimitResult {
  allowed: boolean;
  retryAfterMs?: number;
}

export interface RateLimitAdapter {
  check(identifier: string): Promise<RateLimitResult> | RateLimitResult;
}

// ---------- In-memory adapter ----------

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function evictExpired(now: number): void {
  for (const [key, entry] of rateLimitMap) {
    if (now > entry.resetAt) rateLimitMap.delete(key);
  }
}

function inMemoryCheck(identifier: string): RateLimitResult {
  const now = Date.now();

  if (rateLimitMap.size >= IN_MEMORY_MAX_KEYS) {
    evictExpired(now);
    if (rateLimitMap.size >= IN_MEMORY_MAX_KEYS) {
      // Drop the oldest entry to bound memory.
      const oldest = rateLimitMap.keys().next().value;
      if (oldest !== undefined) rateLimitMap.delete(oldest);
    }
  }

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

const inMemoryAdapter: RateLimitAdapter = { check: inMemoryCheck };

/** @internal */
export function _resetInMemoryRateLimit(): void {
  rateLimitMap.clear();
}

// ---------- Upstash REST adapter ----------

interface UpstashConfig {
  url: string;
  token: string;
}

function readUpstashConfig(): UpstashConfig | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return { url, token };
}

function makeUpstashAdapter(config: UpstashConfig): RateLimitAdapter {
  const windowSeconds = Math.ceil(RATE_LIMIT_WINDOW_MS / 1000);

  return {
    async check(identifier: string): Promise<RateLimitResult> {
      const key = `rl:${identifier}`;
      try {
        // Pipeline INCR + EXPIRE atomically. Upstash REST supports a
        // multi-command body via POST /pipeline.
        const res = await fetch(`${config.url}/pipeline`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${config.token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify([
            ["INCR", key],
            ["EXPIRE", key, String(windowSeconds), "NX"],
            ["PTTL", key],
          ]),
        });

        if (!res.ok) {
          // Fail open rather than blocking traffic on backend issues.
          console.warn("[rateLimit] Upstash REST returned", res.status, "— failing open");
          return { allowed: true };
        }

        const body = (await res.json()) as Array<{ result?: number; error?: string }>;
        const incrResult = body[0]?.result ?? 0;
        const pttl = body[2]?.result ?? RATE_LIMIT_WINDOW_MS;

        if (incrResult > RATE_LIMIT_MAX_REQUESTS) {
          return { allowed: false, retryAfterMs: pttl > 0 ? pttl : RATE_LIMIT_WINDOW_MS };
        }
        return { allowed: true };
      } catch (err) {
        console.warn("[rateLimit] Upstash REST error — failing open:", err);
        return { allowed: true };
      }
    },
  };
}

// ---------- Adapter selection ----------

let cachedAdapter: RateLimitAdapter | null = null;
let warnedInMemoryProd = false;

function getAdapter(): RateLimitAdapter {
  if (cachedAdapter) return cachedAdapter;

  const upstash = readUpstashConfig();
  if (upstash) {
    cachedAdapter = makeUpstashAdapter(upstash);
    return cachedAdapter;
  }

  if (process.env.NODE_ENV === "production" && !warnedInMemoryProd) {
    warnedInMemoryProd = true;
    console.warn(
      "[security] Using in-memory rate limiter in production. " +
        "Set UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN for a shared backend."
    );
  }

  cachedAdapter = inMemoryAdapter;
  return cachedAdapter;
}

/** @internal */
export function _resetAdapterCache(): void {
  cachedAdapter = null;
  warnedInMemoryProd = false;
}

// ---------- Public API ----------

export async function checkRateLimit(identifier: string): Promise<RateLimitResult> {
  return Promise.resolve(getAdapter().check(identifier));
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
export async function apiSecurityCheck(request: Request): Promise<Response | null> {
  // 1. CSRF origin check
  const originError = verifySameOrigin(request);
  if (originError) return originError;

  // 2. Rate limit
  const id = getRateLimitId(request);
  const { allowed, retryAfterMs } = await checkRateLimit(id);
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
