/**
 * Vercel Runtime Cache wrapper for cross-function ephemeral state (scrape
 * results, model fetches, etc.). Sits beside Cache Components, not in front
 * of it — Cache Components serves rendered HTML; Runtime Cache serves the
 * raw building blocks that producers (scrape tools, embedders) consume.
 *
 * Conventions enforced here:
 *   - keys are versioned: `<namespace>:v<n>:<sha256(...)>`
 *     bump <n> instead of mass-invalidating when a value's shape changes
 *   - tags are dot-namespaced: `scrape:url:<hash>`, `scrape:domain:<host>`
 *   - TTL is set per call site, never globally — see TTLs in
 *     docs/database-schema.md §7.2
 */

import { getCache } from "@vercel/functions"

const KEY_VERSION = 1

interface GetOrSetOptions {
  /** TTL in seconds. */
  ttl: number
  /** Tags applied to the entry — `expireTag` purges by tag. */
  tags?: string[]
}

/**
 * Read-through cache. Returns a cached value if present, otherwise calls
 * `producer`, stores the result, and returns it. Misses are reported via
 * the second tuple element so callers (e.g. scout) can record a
 * `scrape_provenance.cache_hit` row.
 */
export async function getOrSet<T>(
  key: string,
  producer: () => Promise<T>,
  options: GetOrSetOptions,
): Promise<{ value: T; hit: boolean }> {
  const cache = getCache()
  const namespacedKey = withVersion(key)

  const cached = (await cache.get(namespacedKey)) as T | null
  if (cached !== null && cached !== undefined) {
    return { value: cached, hit: true }
  }

  const value = await producer()
  // Fire-and-forget — the producer's value should reach the caller even if
  // the write to the cache trails. Errors are non-fatal.
  void cache
    .set(namespacedKey, value, { ttl: options.ttl, tags: options.tags })
    .catch((err: unknown) => {
      console.warn("[runtime-cache] set failed", { key: namespacedKey, err })
    })
  return { value, hit: false }
}

/** Manually purge by tag — used by /admin/queue's "force re-scrape" button. */
export async function expireTag(tag: string | string[]): Promise<void> {
  const cache = getCache()
  await cache.expireTag(tag)
}

function withVersion(key: string): string {
  // Inserts the key version after the first colon-delimited segment. Allows
  // both `scrape:abc123` and `events:lu.ma:xyz` to receive the same versioning
  // discipline without callers having to remember to apply it.
  const i = key.indexOf(":")
  if (i === -1) return `${key}:v${KEY_VERSION}`
  return `${key.slice(0, i)}:v${KEY_VERSION}${key.slice(i)}`
}

/**
 * Stable tag helpers. Use these instead of constructing tag strings inline
 * so a future taxonomy change is one edit, not a grep.
 */
export const cacheKeys = {
  scrape: (urlHash: string) => `scrape:${urlHash}`,
} as const

export const cacheTags = {
  scrapeUrl: (urlHash: string) => `scrape:url:${urlHash}`,
  scrapeDomain: (host: string) => `scrape:domain:${host}`,
  scrapeAll: () => "scrape:all",
} as const
