import { cacheLife, cacheTag } from "next/cache"
import {
  and,
  asc,
  atlasEntries,
  atlasSections,
  desc,
  eq,
  getDb,
  type AtlasEntry as AtlasEntryRow,
  type AtlasSection as AtlasSectionRow,
} from "@buildinaus/database"

/**
 * Atlas data layer.
 *
 * Translates DB rows into a view shape that mirrors the old static
 * `AtlasCity` interface so existing pages can swap data sources without
 * a structural rewrite. List sections re-group entries by their stored
 * `metadata.group_label` so the original visual hierarchy survives.
 *
 * The intro section's `content_md` is the canonical city blurb and is
 * rendered via `apps/web/lib/atlas/compile.tsx` (MDX → atlas component
 * tree). Stats live as a dedicated `kind='list'` section with one entry
 * per stat (`metadata.stat_value` carries the value).
 *
 * City-level metadata (state, timezone, status) is hard-coded here
 * pending the deferred `cities` lookup table (see schema doc §14).
 */

export type AtlasCitySlug = "sydney" | "melbourne" | "brisbane"

const CITY_META: Record<
  AtlasCitySlug,
  { city: string; state: string; timezone: string; status: "live" | "scaffolded" }
> = {
  sydney: {
    city: "Sydney",
    state: "NSW",
    timezone: "Australia/Sydney",
    status: "live",
  },
  melbourne: {
    city: "Melbourne",
    state: "VIC",
    timezone: "Australia/Melbourne",
    status: "scaffolded",
  },
  brisbane: {
    city: "Brisbane",
    state: "QLD",
    timezone: "Australia/Brisbane",
    status: "scaffolded",
  },
}

const SUPPORTED_SLUGS = Object.keys(CITY_META) as AtlasCitySlug[]

export interface AtlasItemView {
  label: string
  href?: string
  description?: string
}

export interface AtlasGroupView {
  label?: string
  blurb?: string
  items: AtlasItemView[]
}

export interface AtlasSectionView {
  id: string
  title: string
  blurb?: string
  groups: AtlasGroupView[]
}

export interface AtlasStatView {
  label: string
  value: string
}

export interface AtlasCityView {
  slug: AtlasCitySlug
  city: string
  state: string
  timezone: string
  tagline: string
  status: "live" | "scaffolded"
  lastUpdated: string
  intro: AtlasSectionRow | null
  stats: AtlasStatView[]
  sections: AtlasSectionView[]
}

export interface AtlasCitySummary {
  slug: AtlasCitySlug
  city: string
  state: string
  tagline: string
  status: "live" | "scaffolded"
  lastUpdated: string
  sectionCount: number
}

/* ── Reads ──────────────────────────────────────────────────────────────── */

export async function listAtlasCities(): Promise<AtlasCitySummary[]> {
  "use cache"
  cacheLife("weeks")
  cacheTag("atlas")

  const db = getDb()
  const rows = await db
    .select()
    .from(atlasSections)
    .where(eq(atlasSections.reviewStatus, "approved"))
    .orderBy(asc(atlasSections.citySlug), asc(atlasSections.orderIndex))

  // Group sections by city to compute summary fields.
  const byCity = new Map<AtlasCitySlug, AtlasSectionRow[]>()
  for (const row of rows) {
    if (!isCitySlug(row.citySlug)) continue
    const list = byCity.get(row.citySlug) ?? []
    list.push(row)
    byCity.set(row.citySlug, list)
  }

  // Always return all SUPPORTED_SLUGS in a stable order, with `scaffolded`
  // status when no rows exist for a city yet (rather than dropping it).
  return SUPPORTED_SLUGS.map((slug) => {
    const meta = CITY_META[slug]
    const sections = byCity.get(slug) ?? []
    const intro = sections.find((s) => s.slug === "intro")
    const lastUpdated =
      sections.length > 0
        ? sections.reduce(
            (latest, s) => (s.updatedAt > latest ? s.updatedAt : latest),
            sections[0]!.updatedAt,
          )
        : new Date(0)
    return {
      slug,
      city: meta.city,
      state: meta.state,
      tagline: intro?.title ?? `${meta.city} atlas — coming soon`,
      status: meta.status,
      lastUpdated: lastUpdated.toISOString(),
      sectionCount: sections.filter(
        (s) => s.slug !== "intro" && s.slug !== "stats",
      ).length,
    }
  })
}

export async function getAtlasCity(
  citySlug: string,
): Promise<AtlasCityView | null> {
  if (!isCitySlug(citySlug)) return null

  return loadAtlasCity(citySlug)
}

async function loadAtlasCity(
  citySlug: AtlasCitySlug,
): Promise<AtlasCityView | null> {
  "use cache"
  cacheLife("weeks")
  cacheTag("atlas", `atlas:${citySlug}`)

  const db = getDb()
  const sections = await db
    .select()
    .from(atlasSections)
    .where(
      and(
        eq(atlasSections.citySlug, citySlug),
        eq(atlasSections.reviewStatus, "approved"),
      ),
    )
    .orderBy(asc(atlasSections.orderIndex))

  if (sections.length === 0) return null

  const meta = CITY_META[citySlug]
  const intro = sections.find((s) => s.slug === "intro") ?? null
  const statsSection = sections.find((s) => s.slug === "stats") ?? null

  const sectionIds = sections.map((s) => s.id)
  const allEntries = await db
    .select()
    .from(atlasEntries)
    .where(
      and(
        eq(atlasEntries.reviewStatus, "approved"),
        // entries are scoped via section_id; filter in JS to avoid an inArray
        // since SUPPORTED_SLUGS is small and most calls hit one city.
      ),
    )
    .orderBy(asc(atlasEntries.orderIndex))

  const entriesBySection = new Map<number, AtlasEntryRow[]>()
  for (const entry of allEntries) {
    if (!sectionIds.includes(entry.sectionId)) continue
    const list = entriesBySection.get(entry.sectionId) ?? []
    list.push(entry)
    entriesBySection.set(entry.sectionId, list)
  }

  const stats: AtlasStatView[] = statsSection
    ? (entriesBySection.get(statsSection.id) ?? []).map((e) => ({
        label: e.name,
        value: extractStatValue(e),
      }))
    : []

  const sectionViews: AtlasSectionView[] = sections
    .filter((s) => s.slug !== "intro" && s.slug !== "stats")
    .map((s) => sectionToView(s, entriesBySection.get(s.id) ?? []))

  const lastUpdated = sections.reduce(
    (latest, s) => (s.updatedAt > latest ? s.updatedAt : latest),
    sections[0]!.updatedAt,
  )

  return {
    slug: citySlug,
    city: meta.city,
    state: meta.state,
    timezone: meta.timezone,
    tagline: intro?.title ?? `${meta.city} atlas`,
    status: meta.status,
    lastUpdated: lastUpdated.toISOString(),
    intro,
    stats,
    sections: sectionViews,
  }
}

/* ── Helpers ────────────────────────────────────────────────────────────── */

function isCitySlug(slug: string): slug is AtlasCitySlug {
  return SUPPORTED_SLUGS.includes(slug as AtlasCitySlug)
}

function extractStatValue(entry: AtlasEntryRow): string {
  // Stat values land in either `tagline` (the seed parser) or
  // `metadata.stat_value` (newer agent emissions). Fall back to name if
  // neither is set so we never render an empty stat.
  if (entry.tagline) return entry.tagline
  const meta = entry.metadata as { stat_value?: string }
  if (typeof meta?.stat_value === "string") return meta.stat_value
  return ""
}

function sectionToView(
  section: AtlasSectionRow,
  entries: AtlasEntryRow[],
): AtlasSectionView {
  // Re-group entries by their stored metadata.group_label so the original
  // visual hierarchy from the source content survives. Entries without a
  // group_label fall into the leading "ungrouped" bucket.
  const groups = new Map<string, { label?: string; blurb?: string; items: AtlasItemView[] }>()
  let ungroupedSeen = false

  for (const entry of entries) {
    const meta = entry.metadata as {
      group_label?: string
      group_blurb?: string | null
    }
    const key = meta?.group_label ?? "__ungrouped__"
    if (!groups.has(key)) {
      groups.set(key, {
        label: meta?.group_label,
        blurb: meta?.group_blurb ?? undefined,
        items: [],
      })
      if (key === "__ungrouped__") ungroupedSeen = true
    }
    groups.get(key)!.items.push({
      label: entry.name,
      href: entry.href ?? undefined,
      description: entry.tagline ?? undefined,
    })
  }

  // Reorder so ungrouped (header-less) bucket renders first when present.
  const ordered: AtlasGroupView[] = []
  if (ungroupedSeen) ordered.push(groups.get("__ungrouped__")!)
  for (const [key, value] of groups) {
    if (key !== "__ungrouped__") ordered.push(value)
  }

  return {
    id: section.slug,
    title: section.title,
    blurb: section.summary || undefined,
    groups: ordered,
  }
}

// Re-export ordering by latest update for any consumer that wants it.
export async function latestAtlasUpdate(): Promise<Date | null> {
  "use cache"
  cacheLife("weeks")
  cacheTag("atlas")
  const db = getDb()
  const [row] = await db
    .select({ updatedAt: atlasSections.updatedAt })
    .from(atlasSections)
    .orderBy(desc(atlasSections.updatedAt))
    .limit(1)
  return row?.updatedAt ?? null
}
