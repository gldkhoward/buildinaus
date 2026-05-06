import type { MetadataRoute } from "next"
import { ATLAS_CITIES } from "@/lib/atlas"
import { listCompanies } from "@/lib/data/companies"
import { listEvents } from "@/lib/data/events"
import { listFounders } from "@/lib/data/founders"
import { listJobs } from "@/lib/data/jobs"
import { siteUrl } from "@/lib/site"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl()
  const now = new Date()

  // Fetch the four indices in parallel — each is independently cached via
  // `lib/data/*` so the sitemap inherits Cache Components freshness for
  // free without re-querying Postgres on every crawl.
  const [companies, founders, jobs, events] = await Promise.all([
    listCompanies(),
    listFounders(),
    listJobs(),
    listEvents(),
  ])

  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${base}/atlas`, lastModified: now, changeFrequency: "weekly" },
    { url: `${base}/companies`, lastModified: now, changeFrequency: "daily" },
    { url: `${base}/founders`, lastModified: now, changeFrequency: "daily" },
    { url: `${base}/jobs`, lastModified: now, changeFrequency: "daily" },
    { url: `${base}/events`, lastModified: now, changeFrequency: "daily" },
    { url: `${base}/about`, lastModified: now, changeFrequency: "monthly" },
    { url: `${base}/contact`, lastModified: now, changeFrequency: "monthly" },
    { url: `${base}/privacy`, lastModified: now, changeFrequency: "yearly" },
    { url: `${base}/terms`, lastModified: now, changeFrequency: "yearly" },
    { url: `${base}/brand-kit`, lastModified: now, changeFrequency: "monthly" },
    { url: `${base}/changelog`, lastModified: now, changeFrequency: "weekly" },
  ]

  const cityEntries: MetadataRoute.Sitemap = ATLAS_CITIES.map((c) => ({
    url: `${base}/atlas/${c.slug}`,
    lastModified: new Date(c.lastUpdated),
    changeFrequency: "weekly",
  }))

  const companyEntries: MetadataRoute.Sitemap = companies.map((c) => ({
    url: `${base}/companies/${c.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
  }))

  const founderEntries: MetadataRoute.Sitemap = founders.flatMap((f) => [
    {
      url: `${base}/founders/${f.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
    },
    {
      url: `${base}/p/${f.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
    },
  ])

  const jobEntries: MetadataRoute.Sitemap = jobs.map((j) => ({
    url: `${base}/jobs/${j.id}`,
    lastModified: now,
    changeFrequency: "daily",
  }))

  const eventEntries: MetadataRoute.Sitemap = events.map((e) => ({
    url: `${base}/events/${e.id}`,
    lastModified: now,
    changeFrequency: "weekly",
  }))

  return [
    ...staticEntries,
    ...cityEntries,
    ...companyEntries,
    ...founderEntries,
    ...jobEntries,
    ...eventEntries,
  ]
}
