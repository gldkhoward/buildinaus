import { scout } from "./scout"
import type { DeepDiveOutput, ScoutOutput } from "../schemas"

const HIGH_VALUE_PATTERNS = [
  "about",
  "team",
  "people",
  "founders",
  "company",
  "leadership",
  "mission",
  "story",
]

interface DeepDiveOptions {
  /** Max sub-pages to follow beyond the root. */
  maxPages?: number
  /** Same-host only. Defaults to true. */
  sameOriginOnly?: boolean
}

/**
 * The "Deep-Diver" — recursive scout. Pulls the root, picks "high value"
 * links (about / team / etc.), scouts them in parallel, and aggregates.
 *
 * In production this should run inside a Vercel Workflow step so the
 * parallel fan-out is durable across function timeouts.
 */
export async function deepDive(
  rootUrl: string,
  options: DeepDiveOptions = {},
): Promise<DeepDiveOutput> {
  const maxPages = options.maxPages ?? 4
  const sameOriginOnly = options.sameOriginOnly ?? true

  const root = await scout(rootUrl)

  const rootOrigin = safeOrigin(rootUrl)
  const candidates = root.detected_links
    .filter((link) => isHighValue(link.href, link.text))
    .filter((link) => !sameOriginOnly || safeOrigin(link.href) === rootOrigin)
    .map((link) => link.href)

  const unique = Array.from(new Set(candidates)).slice(0, maxPages)

  const sub = await Promise.allSettled(unique.map((u) => scout(u)))
  const subPages: ScoutOutput[] = sub
    .filter((r): r is PromiseFulfilledResult<ScoutOutput> => r.status === "fulfilled")
    .map((r) => r.value)

  const pages = [root, ...subPages]
  const aggregated_markdown = pages
    .map((p) => `<!-- source: ${p.url} -->\n\n${p.markdown_content}`)
    .join("\n\n---\n\n")

  return {
    root_url: rootUrl,
    pages,
    aggregated_markdown,
  }
}

function isHighValue(href: string, text?: string): boolean {
  const haystack = `${href} ${text ?? ""}`.toLowerCase()
  return HIGH_VALUE_PATTERNS.some((p) => haystack.includes(p))
}

function safeOrigin(url: string): string | null {
  try {
    return new URL(url).origin
  } catch {
    return null
  }
}
