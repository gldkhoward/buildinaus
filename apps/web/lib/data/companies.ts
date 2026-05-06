import { cacheLife, cacheTag } from "next/cache"
import {
  companies,
  companyFounders,
  eq,
  founders,
  getDb,
  inArray,
  type Company as CompanyRow,
} from "@buildinaus/database"
import type { Company, CompanyStage } from "@buildinaus/types"
import { citySlugToDisplay } from "./_helpers"

function rowToCompany(row: CompanyRow, founderSlugs: string[]): Company {
  return {
    slug: row.slug,
    name: row.name,
    tagline: row.tagline,
    description: row.description,
    city: citySlugToDisplay(row.citySlug),
    industry: row.industry,
    stage: row.stage as CompanyStage,
    founderSlugs,
    trustScore: row.trustScore,
    domainAgeDays: row.domainAgeDays,
    metric: {
      label: row.metricLabel ?? "",
      value: row.metricValue ?? "",
    },
  }
}

async function loadFounderSlugsForCompanies(
  companyIds: number[],
): Promise<Map<number, string[]>> {
  if (companyIds.length === 0) return new Map()
  const db = getDb()
  const rows = await db
    .select({
      companyId: companyFounders.companyId,
      founderSlug: founders.slug,
    })
    .from(companyFounders)
    .innerJoin(founders, eq(companyFounders.founderId, founders.id))
    .where(inArray(companyFounders.companyId, companyIds))
  const map = new Map<number, string[]>()
  for (const r of rows) {
    const list = map.get(r.companyId) ?? []
    list.push(r.founderSlug)
    map.set(r.companyId, list)
  }
  return map
}

export async function listCompanies(): Promise<Company[]> {
  "use cache"
  cacheLife("hours")
  cacheTag("companies:list")

  const db = getDb()
  const rows = await db
    .select()
    .from(companies)
    .where(eq(companies.reviewStatus, "approved"))

  const founderMap = await loadFounderSlugsForCompanies(rows.map((r) => r.id))
  return rows.map((r) => rowToCompany(r, founderMap.get(r.id) ?? []))
}

export async function getCompany(slug: string): Promise<Company | null> {
  "use cache"
  cacheLife("hours")
  cacheTag(`company:${slug}`)

  const db = getDb()
  const [row] = await db
    .select()
    .from(companies)
    .where(eq(companies.slug, slug))
    .limit(1)
  if (!row) return null

  const founderMap = await loadFounderSlugsForCompanies([row.id])
  return rowToCompany(row, founderMap.get(row.id) ?? [])
}
