import { cacheLife, cacheTag } from "next/cache"
import {
  companies,
  eq,
  getDb,
  jobs,
  type Job as JobRow,
} from "@buildinaus/database"
import type { Job, JobType } from "@buildinaus/types"
import { citySlugToDisplay, postedAtRelative } from "./_helpers"

function rowToJob(row: JobRow, companySlug: string): Job {
  return {
    id: row.slug,
    title: row.title,
    companySlug,
    city: citySlugToDisplay(row.citySlug),
    salary: row.salary,
    type: row.type as JobType,
    postedAt: postedAtRelative(row.postedAt),
    description: row.description,
    applyUrl: row.applyUrl ?? undefined,
  }
}

export async function listJobs(): Promise<Job[]> {
  "use cache"
  cacheLife("hours")
  cacheTag("jobs:list")

  const db = getDb()
  const rows = await db
    .select({ job: jobs, companySlug: companies.slug })
    .from(jobs)
    .innerJoin(companies, eq(jobs.companyId, companies.id))
    .where(eq(jobs.reviewStatus, "approved"))

  return rows.map((r) => rowToJob(r.job, r.companySlug))
}

export async function getJob(id: string): Promise<Job | null> {
  "use cache"
  cacheLife("hours")
  cacheTag(`job:${id}`)

  const db = getDb()
  const [row] = await db
    .select({ job: jobs, companySlug: companies.slug })
    .from(jobs)
    .innerJoin(companies, eq(jobs.companyId, companies.id))
    .where(eq(jobs.slug, id))
    .limit(1)
  if (!row) return null
  return rowToJob(row.job, row.companySlug)
}

export async function listJobsForCompany(
  companySlug: string,
): Promise<Job[]> {
  "use cache"
  cacheLife("hours")
  cacheTag(`company:${companySlug}`, "jobs:list")

  const db = getDb()
  const rows = await db
    .select({ job: jobs })
    .from(jobs)
    .innerJoin(companies, eq(jobs.companyId, companies.id))
    .where(eq(companies.slug, companySlug))

  return rows.map((r) => rowToJob(r.job, companySlug))
}
