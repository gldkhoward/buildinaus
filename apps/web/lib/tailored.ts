import type {
  Company,
  Event,
  Founder,
  FounderType,
  Job,
} from "@buildinaus/types"
import { listCompanies } from "./data/companies"
import { getFounder, listFounders } from "./data/founders"
import { listJobs } from "./data/jobs"
import { listEvents } from "./data/events"

/**
 * Tailored-page generation pipeline.
 *
 * Production path:
 *   1. Resolve viewer profile (auth session, IP geo, profile prefs).
 *   2. Hash into a *viewer fingerprint* — coarse enough that many similar
 *      viewers share a cache entry (cohort-level caching, not per-user).
 *   3. Look up cached page in Vercel Runtime Cache by fingerprint.
 *   4. On miss, call Vercel AI Gateway with the available block registry +
 *      candidate content; gateway returns a structured selection.
 *   5. Persist with cache tags (`tag(`viewer:${type}`)` etc.) so
 *      `updateTag` can invalidate cohorts without flushing everything.
 *
 * For the POC: a deterministic block selector keyed off founder type, plus
 * an in-memory Map standing in for the runtime cache.
 */

export interface ViewerProfile {
  slug: string
  founder: Founder
  type: FounderType
  city: Founder["city"]
}

export interface TailoredBlock {
  id: string
  kind: "headline" | "company-spotlight" | "jobs" | "events" | "founders" | "narrative"
  title: string
  body?: string
  data?: unknown
}

export interface TailoredPage {
  fingerprint: string
  cacheHit: boolean
  generatedAt: string
  generationMs: number
  modelHint: string
  blocks: TailoredBlock[]
}

/**
 * Derive a coarse fingerprint. In production this would mix:
 *   - viewer.role, viewer.industry, viewer.city, stage interest
 * For the POC the founder slug stands in for an authenticated viewer who
 * matches that founder's archetype.
 */
export function fingerprintFor(viewer: ViewerProfile): string {
  return `${viewer.type}::${viewer.city.toLowerCase().replaceAll(" ", "-")}`
}

/* In-memory stand-in for Vercel Runtime Cache. */
const cache = new Map<string, TailoredPage>()

/**
 * AI block selector — stubbed.
 *
 * Real implementation would call AI SDK v6 via Vercel AI Gateway with a
 * provider/model string, e.g.:
 *
 *   const { object } = await generateObject({
 *     model: "anthropic/claude-sonnet-4-6",
 *     schema: TailoredPageSchema,
 *     prompt: buildPrompt(viewer, candidates),
 *   })
 *
 * The schema constrains the model to pick from `blockRegistry` keys and
 * write copy in our voice. Output is then cached by `fingerprint`.
 */
interface TailorInputs {
  founders: Founder[]
  companies: Company[]
  jobs: Job[]
  events: Event[]
}

function generateBlocksFor(viewer: ViewerProfile, inputs: TailorInputs): TailoredBlock[] {
  const sameType = inputs.founders.filter(
    (f) => f.type === viewer.type && f.slug !== viewer.slug,
  )
  const sameCity = inputs.companies.filter((c) => c.city === viewer.city)
  const otherCity = inputs.companies.filter(
    (c) => c.industry.some((i) => matchesType(i, viewer.type)) && c.city !== viewer.city,
  )

  const featured: Company | undefined =
    sameCity.find((c) => c.industry.some((i) => matchesType(i, viewer.type))) ??
    sameCity[0] ??
    otherCity[0]

  const jobsForViewer: Job[] = inputs.jobs
    .filter((j) => j.city === viewer.city || inputs.jobs.indexOf(j) < 3)
    .slice(0, 4)

  const eventsForViewer: Event[] = inputs.events
    .filter((e) => e.city === viewer.city)
    .concat(inputs.events.filter((e) => e.city !== viewer.city))
    .slice(0, 3)

  const blocks: TailoredBlock[] = [
    {
      id: "headline",
      kind: "headline",
      title: `Built for ${viewer.founder.name.split(" ")[0]}`,
      body: `A snapshot of the Australian ecosystem from a ${typeLabel(viewer.type)} founder's lens, in ${viewer.city}.`,
    },
  ]

  if (featured) {
    blocks.push({
      id: `spotlight-${featured.slug}`,
      kind: "company-spotlight",
      title: `Watch: ${featured.name}`,
      body: featured.description,
      data: featured,
    })
  }

  if (jobsForViewer.length > 0) {
    blocks.push({
      id: "jobs",
      kind: "jobs",
      title: "Roles your peers are filling",
      body: `${jobsForViewer.length} roles selected from ${viewer.city} and adjacent ${typeLabel(viewer.type)} teams.`,
      data: jobsForViewer,
    })
  }

  if (sameType.length > 0) {
    blocks.push({
      id: "peers",
      kind: "founders",
      title: "Peers shipping in your category",
      body: `${typeLabel(viewer.type)} founders to compare notes with.`,
      data: sameType.slice(0, 3),
    })
  }

  if (eventsForViewer.length > 0) {
    blocks.push({
      id: "events",
      kind: "events",
      title: "Where they'll be next",
      data: eventsForViewer,
    })
  }

  blocks.push({
    id: "narrative",
    kind: "narrative",
    title: "Why this page exists",
    body:
      "Every founder gets a different snapshot of the ecosystem. This page is generated once for everyone like you and cached at the edge — so the next " +
      typeLabel(viewer.type) +
      " founder in " +
      viewer.city +
      " hits the same warm response.",
  })

  return blocks
}

export async function getTailoredPage(slug: string): Promise<TailoredPage | null> {
  const founder = await getFounder(slug)
  if (!founder) return null

  const viewer: ViewerProfile = {
    slug: founder.slug,
    founder,
    type: founder.type,
    city: founder.city,
  }
  const fingerprint = fingerprintFor(viewer)

  const cached = cache.get(fingerprint)
  if (cached) {
    return { ...cached, cacheHit: true }
  }

  const [founders, companies, jobs, events] = await Promise.all([
    listFounders(),
    listCompanies(),
    listJobs(),
    listEvents(),
  ])

  const start = performance.now()
  const blocks = generateBlocksFor(viewer, { founders, companies, jobs, events })
  const generationMs = Math.round(performance.now() - start)

  const page: TailoredPage = {
    fingerprint,
    cacheHit: false,
    generatedAt: new Date().toISOString(),
    generationMs,
    modelHint: "anthropic/claude-sonnet-4-6 (stubbed)",
    blocks,
  }
  cache.set(fingerprint, page)
  return page
}

/* ---------- helpers ---------- */

function matchesType(industry: string, type: FounderType): boolean {
  const i = industry.toLowerCase()
  switch (type) {
    case "ai-infra":
      return i.includes("ai") || i.includes("infra")
    case "devtools":
      return i.includes("devtools") || i.includes("data")
    case "climate":
      return i.includes("climate")
    case "biotech":
      return i.includes("biotech")
    case "robotics":
      return i.includes("robotics") || i.includes("agtech")
    case "consumer":
      return i.includes("consumer")
  }
}

export function typeLabel(t: FounderType): string {
  return {
    "ai-infra": "AI Infra",
    devtools: "DevTools",
    climate: "Climate",
    biotech: "Biotech",
    robotics: "Robotics",
    consumer: "Consumer",
  }[t]
}
