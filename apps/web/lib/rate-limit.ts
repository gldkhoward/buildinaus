import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

/**
 * Anonymous-intake rate limit. Sliding window: 2 runs per IP per hour.
 *
 * Storage is **Upstash Redis** via the Vercel Marketplace integration —
 * `Redis.fromEnv()` reads UPSTASH_REDIS_REST_URL / _TOKEN. If the
 * integration isn't provisioned yet, we fall back to a permissive limiter
 * so local dev doesn't 429 — the warning prints once at startup.
 */

let _intakeAnonymousLimiter: Ratelimit | undefined

export function intakeAnonymousLimiter(): Ratelimit {
  if (_intakeAnonymousLimiter) return _intakeAnonymousLimiter

  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN

  if (!url || !token) {
    console.warn(
      "[rate-limit] UPSTASH_REDIS_REST_URL/TOKEN not set — anonymous intake is uncapped. Provision Upstash via the Vercel Marketplace and re-run `vercel env pull`.",
    )
    // Use a lazy proxy that always succeeds — keeps the call site shape
    // identical so we don't branch on env at every request.
    _intakeAnonymousLimiter = {
      limit: async () => ({
        success: true,
        limit: Infinity,
        remaining: Infinity,
        reset: 0,
        pending: Promise.resolve(),
      }),
    } as unknown as Ratelimit
    return _intakeAnonymousLimiter
  }

  _intakeAnonymousLimiter = new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.slidingWindow(2, "1 h"),
    analytics: true,
    prefix: "rl:intake:anon",
  })
  return _intakeAnonymousLimiter
}

/** Best-effort client IP extraction. Vercel forwards the real IP in `x-forwarded-for`. */
export function clientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  )
}
