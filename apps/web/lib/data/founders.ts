import { cacheLife, cacheTag } from "next/cache"
import {
  and,
  companies,
  companyFounders,
  eq,
  founders,
  getDb,
  inArray,
  type Founder as FounderRow,
} from "@buildinaus/database"
import type { Founder, FounderType } from "@buildinaus/types"
import { citySlugToDisplay } from "./_helpers"

function rowToFounder(row: FounderRow, companySlug: string): Founder {
  return {
    slug: row.slug,
    name: row.name,
    role: row.role,
    companySlug,
    city: citySlugToDisplay(row.citySlug),
    type: row.type as FounderType,
    bio: row.bio,
    linkedin: row.linkedinUrl ?? undefined,
  }
}

async function loadCompanySlugsForFounders(
  founderIds: number[],
): Promise<Map<number, string>> {
  if (founderIds.length === 0) return new Map()
  const db = getDb()
  const rows = await db
    .select({
      founderId: companyFounders.founderId,
      companySlug: companies.slug,
      isPrimary: companyFounders.isPrimary,
    })
    .from(companyFounders)
    .innerJoin(companies, eq(companyFounders.companyId, companies.id))
    .where(inArray(companyFounders.founderId, founderIds))

  const map = new Map<number, string>()
  for (const r of rows) {
    const existing = map.get(r.founderId)
    if (!existing || r.isPrimary) map.set(r.founderId, r.companySlug)
  }
  return map
}

export async function listFounders(): Promise<Founder[]> {
  "use cache"
  cacheLife("hours")
  cacheTag("founders:list")

  const db = getDb()
  const rows = await db
    .select()
    .from(founders)
    .where(eq(founders.reviewStatus, "approved"))

  const slugMap = await loadCompanySlugsForFounders(rows.map((r) => r.id))
  return rows.map((r) => rowToFounder(r, slugMap.get(r.id) ?? ""))
}

export async function getFounder(slug: string): Promise<Founder | null> {
  "use cache"
  cacheLife("hours")
  cacheTag(`founder:${slug}`)

  const db = getDb()
  const [row] = await db
    .select()
    .from(founders)
    .where(eq(founders.slug, slug))
    .limit(1)
  if (!row) return null

  const slugMap = await loadCompanySlugsForFounders([row.id])
  return rowToFounder(row, slugMap.get(row.id) ?? "")
}

export async function listFoundersForCompany(
  companySlug: string,
): Promise<Founder[]> {
  "use cache"
  cacheLife("hours")
  cacheTag(`company:${companySlug}`, "founders:list")

  const db = getDb()
  const rows = await db
    .select({ founder: founders })
    .from(companyFounders)
    .innerJoin(companies, eq(companyFounders.companyId, companies.id))
    .innerJoin(founders, eq(companyFounders.founderId, founders.id))
    .where(eq(companies.slug, companySlug))

  return rows.map((r) => rowToFounder(r.founder, companySlug))
}

export async function listFoundersByType(
  type: FounderType,
): Promise<Founder[]> {
  "use cache"
  cacheLife("hours")
  cacheTag(`type:${type}`, "founders:list")

  const db = getDb()
  const rows = await db
    .select()
    .from(founders)
    .where(
      and(eq(founders.reviewStatus, "approved"), eq(founders.type, type)),
    )

  const slugMap = await loadCompanySlugsForFounders(rows.map((r) => r.id))
  return rows.map((r) => rowToFounder(r, slugMap.get(r.id) ?? ""))
}
