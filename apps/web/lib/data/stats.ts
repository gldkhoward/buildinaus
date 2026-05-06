import { cacheLife, cacheTag } from "next/cache"
import {
  and,
  companies,
  count,
  eq,
  events,
  founders,
  getDb,
  isNull,
  jobs,
} from "@buildinaus/database"

export interface EcosystemStats {
  companies: number
  founders: number
  openJobs: number
  cities: number
}

export async function getEcosystemStats(): Promise<EcosystemStats> {
  "use cache"
  cacheLife("hours")
  cacheTag(
    "stats:ecosystem",
    "companies:list",
    "founders:list",
    "jobs:list",
    "events:list",
  )

  const db = getDb()

  const [
    companiesRow,
    foundersRow,
    openJobsRow,
    companyCities,
    founderCities,
    jobCities,
    eventCities,
  ] = await Promise.all([
    db
      .select({ value: count() })
      .from(companies)
      .where(eq(companies.reviewStatus, "approved")),
    db
      .select({ value: count() })
      .from(founders)
      .where(eq(founders.reviewStatus, "approved")),
    db
      .select({ value: count() })
      .from(jobs)
      .where(and(eq(jobs.reviewStatus, "approved"), isNull(jobs.closedAt))),
    db
      .selectDistinct({ city: companies.citySlug })
      .from(companies)
      .where(eq(companies.reviewStatus, "approved")),
    db
      .selectDistinct({ city: founders.citySlug })
      .from(founders)
      .where(eq(founders.reviewStatus, "approved")),
    db
      .selectDistinct({ city: jobs.citySlug })
      .from(jobs)
      .where(eq(jobs.reviewStatus, "approved")),
    db
      .selectDistinct({ city: events.citySlug })
      .from(events)
      .where(eq(events.reviewStatus, "approved")),
  ])

  const cities = new Set([
    ...companyCities.map((r) => r.city),
    ...founderCities.map((r) => r.city),
    ...jobCities.map((r) => r.city),
    ...eventCities.map((r) => r.city),
  ]).size

  return {
    companies: companiesRow[0]?.value ?? 0,
    founders: foundersRow[0]?.value ?? 0,
    openJobs: openJobsRow[0]?.value ?? 0,
    cities,
  }
}
