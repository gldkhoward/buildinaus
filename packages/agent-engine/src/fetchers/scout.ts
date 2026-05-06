import type { ScoutOutput } from "../schemas"

const USER_AGENT =
  "BuildinAusScraperAgent/0.1 (+https://buildinaus.dev)"

interface ScoutOptions {
  /** Override the underlying provider. Defaults to `firecrawl` when an API key
   *  is set, otherwise falls back to a plain fetch + html→markdown shim. */
  provider?: "firecrawl" | "fetch"
  /** Per-request timeout in ms. */
  timeoutMs?: number
}

/**
 * The "Scout" — extracts semantic content from a single URL as Markdown.
 *
 * Prefers a Headless API (Firecrawl) when configured to bypass bot detection
 * and return clean Markdown. Falls back to a plain fetch + minimal HTML →
 * Markdown shim so the agent stays runnable in local dev with no extra setup.
 */
export async function scout(
  url: string,
  options: ScoutOptions = {},
): Promise<ScoutOutput> {
  const provider =
    options.provider ?? (process.env.FIRECRAWL_API_KEY ? "firecrawl" : "fetch")

  const fetchedAt = new Date().toISOString()

  if (provider === "firecrawl") {
    return scoutViaFirecrawl(url, fetchedAt, options.timeoutMs ?? 30_000)
  }

  return scoutViaFetch(url, fetchedAt, options.timeoutMs ?? 15_000)
}

async function scoutViaFirecrawl(
  url: string,
  fetchedAt: string,
  timeoutMs: number,
): Promise<ScoutOutput> {
  const apiKey = process.env.FIRECRAWL_API_KEY
  if (!apiKey) {
    throw new Error("FIRECRAWL_API_KEY is not set")
  }

  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        url,
        formats: ["markdown", "links"],
        onlyMainContent: true,
      }),
      signal: ctrl.signal,
    })
    if (!res.ok) {
      throw new Error(`firecrawl ${res.status}: ${await res.text()}`)
    }
    const json = (await res.json()) as {
      data?: {
        markdown?: string
        html?: string
        rawHtml?: string
        links?: string[]
        metadata?: { title?: string; description?: string; statusCode?: number }
      }
    }
    const markdown = json.data?.markdown ?? ""
    const links = (json.data?.links ?? []).map((href) => ({ href }))
    return {
      url,
      page_title: json.data?.metadata?.title,
      meta_description: json.data?.metadata?.description,
      markdown_content: markdown,
      detected_links: links,
      fetched_at: fetchedAt,
      raw_html: json.data?.rawHtml ?? json.data?.html,
      provider: "firecrawl",
      http_status: json.data?.metadata?.statusCode ?? res.status,
    }
  } finally {
    clearTimeout(timer)
  }
}

async function scoutViaFetch(
  url: string,
  fetchedAt: string,
  timeoutMs: number,
): Promise<ScoutOutput> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(url, {
      headers: { "user-agent": USER_AGENT, accept: "text/html,*/*" },
      redirect: "follow",
      signal: ctrl.signal,
    })
    if (!res.ok) {
      throw new Error(`fetch ${res.status} for ${url}`)
    }
    const html = await res.text()
    const out = htmlToScoutOutput(url, html, fetchedAt)
    return {
      ...out,
      raw_html: html,
      provider: "fetch",
      http_status: res.status,
    }
  } finally {
    clearTimeout(timer)
  }
}

// ── HTML → Markdown shim ────────────────────────────────────────────────────
//
// Deliberately tiny — strips boilerplate, keeps headings/paragraphs/lists, and
// converts links. Good enough to feed to an LLM for the demo. Replace with
// Firecrawl by exporting FIRECRAWL_API_KEY when ready.

function htmlToScoutOutput(
  url: string,
  rawHtml: string,
  fetchedAt: string,
): ScoutOutput {
  const html = rawHtml
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")

  const title = match(html, /<title[^>]*>([\s\S]*?)<\/title>/i)
  const description = matchAttr(
    html,
    /<meta[^>]+name=["']description["'][^>]*>/i,
    "content",
  )

  const main = pickMain(html)
  const markdown = htmlBodyToMarkdown(main)

  const links = extractLinks(main, url)

  return {
    url,
    page_title: title ? decodeEntities(title.trim()) : undefined,
    meta_description: description ? decodeEntities(description.trim()) : undefined,
    markdown_content: markdown.trim(),
    detected_links: links,
    fetched_at: fetchedAt,
  }
}

function pickMain(html: string): string {
  // Prefer <main> or <article> when available — strips nav/header/footer noise.
  const candidates = [
    /<main[\s\S]*?>([\s\S]*?)<\/main>/i,
    /<article[\s\S]*?>([\s\S]*?)<\/article>/i,
  ]
  for (const re of candidates) {
    const m = html.match(re)
    if (m && m[1] && m[1].length > 400) return m[1]
  }
  const body = html.match(/<body[\s\S]*?>([\s\S]*?)<\/body>/i)
  return body?.[1] ?? html
}

function htmlBodyToMarkdown(body: string): string {
  let out = body
  // Headings
  out = out.replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, (_, c) => `\n\n# ${stripTags(c)}\n`)
  out = out.replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, (_, c) => `\n\n## ${stripTags(c)}\n`)
  out = out.replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, (_, c) => `\n\n### ${stripTags(c)}\n`)
  out = out.replace(/<h4[^>]*>([\s\S]*?)<\/h4>/gi, (_, c) => `\n\n#### ${stripTags(c)}\n`)
  // Lists
  out = out.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_, c) => `\n- ${stripTags(c)}`)
  // Links — keep label + url
  out = out.replace(
    /<a[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi,
    (_, href, label) => `[${stripTags(label).trim()}](${href})`,
  )
  // Paragraphs / breaks
  out = out.replace(/<\/p>/gi, "\n\n").replace(/<br\s*\/?>(?![^<]*>)/gi, "\n")
  // Strip remaining tags
  out = stripTags(out)
  // Collapse whitespace
  out = decodeEntities(out)
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
  return out
}

function extractLinks(body: string, baseUrl: string) {
  const out: { href: string; text?: string }[] = []
  const seen = new Set<string>()
  const re = /<a[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(body))) {
    const href = m[1]
    if (!href) continue
    const resolved = resolveUrl(href, baseUrl)
    if (!resolved) continue
    if (seen.has(resolved)) continue
    seen.add(resolved)
    const text = decodeEntities(stripTags(m[2] ?? "")).trim()
    out.push({ href: resolved, text: text || undefined })
  }
  return out
}

function resolveUrl(href: string, base: string): string | null {
  if (!href) return null
  if (href.startsWith("javascript:") || href.startsWith("mailto:")) return null
  try {
    return new URL(href, base).toString()
  } catch {
    return null
  }
}

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, "")
}

function match(html: string, re: RegExp): string | undefined {
  return html.match(re)?.[1]
}

function matchAttr(html: string, re: RegExp, attr: string): string | undefined {
  const tag = html.match(re)?.[0]
  if (!tag) return undefined
  return tag.match(new RegExp(`${attr}=["']([^"']*)["']`, "i"))?.[1]
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
}
