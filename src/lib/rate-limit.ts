/**
 * Fixed-window rate limiter, in process memory.
 *
 * This guards the export endpoint, which is the one place a visitor can make
 * us issue up to fifty sequential requests to the client's WordPress — an
 * origin already measured returning 500s under light concurrency. Without a
 * limit, one person holding down refresh on /api/export is a denial of service
 * against the newsroom's CMS, not just against us.
 *
 * Caveat worth knowing before this ships behind several instances: the counter
 * is per process, so N instances allow N x limit. For a single container or a
 * modest serverless footprint that is still a meaningful brake; if the site
 * moves to wide horizontal scaling, swap the store for Redis or Vercel KV. The
 * interface here is deliberately small so that swap is local to this file.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

/** Stop the map growing without bound on a long-lived server. */
function sweep(now: number): void {
  if (buckets.size < 5000) return;
  for (const [key, b] of buckets) {
    if (b.resetAt <= now) buckets.delete(key);
  }
}

export interface RateLimitResult {
  ok: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfterSeconds: number;
}

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  sweep(now);

  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    const bucket = { count: 1, resetAt: now + windowMs };
    buckets.set(key, bucket);
    return {
      ok: true,
      limit,
      remaining: limit - 1,
      resetAt: bucket.resetAt,
      retryAfterSeconds: 0,
    };
  }

  existing.count += 1;
  const ok = existing.count <= limit;
  return {
    ok,
    limit,
    remaining: Math.max(0, limit - existing.count),
    resetAt: existing.resetAt,
    retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
  };
}

/**
 * Best-effort client identity. Behind a proxy or CDN the first entry of
 * x-forwarded-for is the real client; direct connections fall back to a
 * shared bucket, which is stricter rather than looser.
 */
export function clientKey(request: Request, scope: string): string {
  const fwd = request.headers.get("x-forwarded-for");
  const ip =
    fwd?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    request.headers.get("cf-connecting-ip") ||
    "unknown";
  return `${scope}:${ip}`;
}

export function rateLimitHeaders(r: RateLimitResult): Record<string, string> {
  return {
    "X-RateLimit-Limit": String(r.limit),
    "X-RateLimit-Remaining": String(r.remaining),
    "X-RateLimit-Reset": String(Math.ceil(r.resetAt / 1000)),
    ...(r.ok ? {} : { "Retry-After": String(r.retryAfterSeconds) }),
  };
}
