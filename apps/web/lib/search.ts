/**
 * Client-safe search types + URL utilities.
 *
 * The actual search query lives in:
 *   - lib/data/search.ts → searchAll() — server-side DB query
 *   - app/api/search/route.ts → JSON wrapper for the client command bar
 */

export type SearchKind = "company" | "founder" | "job" | "event"

export interface SearchResult {
  kind: SearchKind
  href: string
  label: string
  sublabel: string
  haystack: string
}

const URL_RE = /^https?:\/\//i
const TLD_RE = /^[\w.-]+\.[a-z]{2,}(\/.*)?$/i

export function looksLikeUrl(value: string): boolean {
  const v = value.trim()
  if (!v) return false
  if (URL_RE.test(v)) return true
  // bare domains like "buildinaus.dev" or "github.com/foo/bar"
  if (TLD_RE.test(v) && !v.includes(" ")) return true
  return false
}

export function normaliseUrl(value: string): string {
  const v = value.trim()
  return URL_RE.test(v) ? v : `https://${v}`
}

export const KIND_LABEL: Record<SearchKind, string> = {
  company: "Company",
  founder: "Founder",
  job: "Job",
  event: "Event",
}
