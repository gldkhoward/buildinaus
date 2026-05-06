import {
  companies,
  companyFounders,
  eq,
  events,
  founders,
  getDb,
  ilike,
  jobs,
  or,
  sql,
} from "@buildinaus/database"
import { type SearchKind, type SearchResult } from "@/lib/search"
import { citySlugToDisplay } from "./_helpers"

interface SearchOpts {
  kind?: SearchKind | null
  limit?: number
}

const ALL_KINDS: SearchKind[] = ["company", "founder", "job", "event"]
const PER_KIND_DEFAULT = 50

export async function searchAll(
  rawQuery: string,
  opts: SearchOpts = {},
): Promise<SearchResult[]> {
  const query = rawQuery.trim()
  if (!query) return []

  const db = getDb()
  const like = `%${query}%`
  const perKind = Math.min(Math.max(opts.limit ?? PER_KIND_DEFAULT, 1), 200)
  const kinds = opts.kind ? [opts.kind] : ALL_KINDS

  const tasks: Promise<SearchResult[]>[] = []

  if (kinds.includes("company")) {
    tasks.push(
      db
        .select({
          slug: companies.slug,
          name: companies.name,
          tagline: companies.tagline,
          citySlug: companies.citySlug,
          industry: companies.industry,
        })
        .from(companies)
        .where(
          sql`${companies.reviewStatus} = 'approved' AND (${or(
            ilike(companies.name, like),
            ilike(companies.tagline, like),
            ilike(companies.description, like),
            ilike(companies.citySlug, like),
            sql`${companies.industry}::text ILIKE ${like}`,
          )})`,
        )
        .limit(perKind)
        .then((rows) =>
          rows.map<SearchResult>((r) => ({
            kind: "company",
            href: `/companies/${r.slug}`,
            label: r.name,
            sublabel: `${citySlugToDisplay(r.citySlug)} · ${r.industry.join(" · ")}`,
            haystack: r.tagline,
          })),
        ),
    )
  }

  if (kinds.includes("founder")) {
    tasks.push(
      db
        .select({
          slug: founders.slug,
          name: founders.name,
          role: founders.role,
          companyName: companies.name,
        })
        .from(founders)
        .leftJoin(
          companyFounders,
          eq(companyFounders.founderId, founders.id),
        )
        .leftJoin(companies, eq(companies.id, companyFounders.companyId))
        .where(
          sql`${founders.reviewStatus} = 'approved' AND (${or(
            ilike(founders.name, like),
            ilike(founders.role, like),
            ilike(founders.bio, like),
            ilike(companies.name, like),
          )})`,
        )
        .limit(perKind)
        .then((rows) => {
          // Multiple company-founder rows can yield duplicates per founder.
          // Keep the first hit per slug (which carries the matched company).
          const seen = new Set<string>()
          const out: SearchResult[] = []
          for (const r of rows) {
            if (seen.has(r.slug)) continue
            seen.add(r.slug)
            out.push({
              kind: "founder",
              href: `/founders/${r.slug}`,
              label: r.name,
              sublabel: r.companyName
                ? `${r.role} · ${r.companyName}`
                : r.role,
              haystack: r.role,
            })
          }
          return out
        }),
    )
  }

  if (kinds.includes("job")) {
    tasks.push(
      db
        .select({
          slug: jobs.slug,
          title: jobs.title,
          citySlug: jobs.citySlug,
          salary: jobs.salary,
          companyName: companies.name,
        })
        .from(jobs)
        .innerJoin(companies, eq(jobs.companyId, companies.id))
        .where(
          sql`${jobs.reviewStatus} = 'approved' AND (${or(
            ilike(jobs.title, like),
            ilike(jobs.description, like),
            ilike(jobs.citySlug, like),
            ilike(jobs.salary, like),
            ilike(companies.name, like),
          )})`,
        )
        .limit(perKind)
        .then((rows) =>
          rows.map<SearchResult>((r) => ({
            kind: "job",
            href: `/jobs/${r.slug}`,
            label: r.title,
            sublabel: `${r.companyName} · ${citySlugToDisplay(r.citySlug)}`,
            haystack: r.salary,
          })),
        ),
    )
  }

  if (kinds.includes("event")) {
    tasks.push(
      db
        .select({
          slug: events.slug,
          title: events.title,
          citySlug: events.citySlug,
          venue: events.venue,
          startsAt: events.startsAt,
        })
        .from(events)
        .where(
          sql`${events.reviewStatus} = 'approved' AND (${or(
            ilike(events.title, like),
            ilike(events.description, like),
            ilike(events.citySlug, like),
            ilike(events.venue, like),
          )})`,
        )
        .limit(perKind)
        .then((rows) =>
          rows.map<SearchResult>((r) => ({
            kind: "event",
            href: `/events/${r.slug}`,
            label: r.title,
            sublabel: `${citySlugToDisplay(r.citySlug)} · ${r.venue}`,
            haystack: r.venue,
          })),
        ),
    )
  }

  const groups = await Promise.all(tasks)
  return groups.flat()
}
