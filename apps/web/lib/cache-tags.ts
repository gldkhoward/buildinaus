/**
 * Central catalogue of Cache Components tags. Every read in `lib/data/*`
 * tags itself with one or more of these; every write path calls
 * `revalidateOn{Company,Founder,Event,Job}Change()` to bust the right set.
 *
 * Source of truth for the taxonomy: docs/database-schema.md §7.4.
 */

import { revalidateTag } from "next/cache"

/**
 * Default cache-life profile used with `revalidateTag(tag, profile)`.
 *
 * Under Cache Components, single-arg `revalidateTag(tag)` is deprecated —
 * the second argument is the profile to revalidate to. `'max'` means
 * stale-while-revalidate: callers see the freshest version on the next
 * request without blocking the writer.
 *
 * Use `updateTag()` (not exposed here) only for read-your-own-writes
 * scenarios in server actions — see docs §7.4.
 */
const DEFAULT_PROFILE = "max" as const

function bust(tag: string) {
  // revalidateTag requires the Next.js static-generation store, which only
  // exists during a request. Migration scripts and dev CLIs that call into
  // promote() or write paths from plain Node have no such context — we
  // swallow the resulting "Invariant: static generation store missing"
  // here so the underlying DB writes aren't undone by a tag-bust failure.
  // Production calls (server actions, route handlers, cron) always have
  // the store and behave normally.
  try {
    revalidateTag(tag, DEFAULT_PROFILE)
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[cache-tags] revalidateTag(${tag}) skipped:`, err)
    }
  }
}

export const tags = {
  /* lists ─────────────────────────────────────────────────────────────── */
  companiesList: "companies:list",
  foundersList: "founders:list",
  eventsList: "events:list",
  jobsList: "jobs:list",

  /* per-entity ────────────────────────────────────────────────────────── */
  company: (slug: string) => `company:${slug}`,
  founder: (slug: string) => `founder:${slug}`,
  event: (slug: string) => `event:${slug}`,
  job: (slug: string) => `job:${slug}`,

  /* slicers ───────────────────────────────────────────────────────────── */
  city: (citySlug: string) => `city:${citySlug}`,
  stage: (stage: string) => `stage:${stage}`,
  industry: (tag: string) => `industry:${tag}`,
  type: (founderType: string) => `type:${founderType}`,

  /* tailored / cohort ─────────────────────────────────────────────────── */
  tailoredFingerprint: (fp: string) => `tailored:fingerprint:${fp}`,

  /* intake / admin / personalisation ──────────────────────────────────── */
  intakeRun: (runId: string) => `intake_run:${runId}`,
  user: (userId: string | number) => `user:${userId}`,
  draftQueue: "draft_queue",

  /* embeddings rails ──────────────────────────────────────────────────── */
  embedding: (kind: string, id: number) => `embedding:${kind}:${id}`,

  /* atlas ─────────────────────────────────────────────────────────────── */
  atlas: "atlas",
  atlasCity: (citySlug: string) => `atlas:${citySlug}`,
  atlasSection: (citySlug: string, sectionSlug: string) =>
    `atlas:${citySlug}:${sectionSlug}`,
  atlasEntry: (id: number) => `atlas_entry:${id}`,
} as const

/** Bust every tag relevant to a company publish/edit. */
export function revalidateOnCompanyChange(args: {
  slug: string
  citySlug: string
  stage: string
  industry: string[]
}) {
  bust(tags.companiesList)
  bust(tags.company(args.slug))
  bust(tags.city(args.citySlug))
  bust(tags.stage(args.stage))
  for (const i of args.industry) bust(tags.industry(i))
}

export function revalidateOnFounderChange(args: {
  slug: string
  citySlug: string
  type: string
}) {
  bust(tags.foundersList)
  bust(tags.founder(args.slug))
  bust(tags.city(args.citySlug))
  bust(tags.type(args.type))
}

export function revalidateOnEventChange(args: {
  slug: string
  citySlug: string
}) {
  bust(tags.eventsList)
  bust(tags.event(args.slug))
  bust(tags.city(args.citySlug))
}

export function revalidateOnJobChange(args: {
  slug: string
  citySlug: string
  companySlug: string
}) {
  bust(tags.jobsList)
  bust(tags.job(args.slug))
  bust(tags.city(args.citySlug))
  bust(tags.company(args.companySlug))
}

export function revalidateDraftQueue() {
  bust(tags.draftQueue)
}

export function revalidateOnAtlasSectionChange(args: {
  citySlug: string
  sectionSlug: string
}) {
  bust(tags.atlas)
  bust(tags.atlasCity(args.citySlug))
  bust(tags.atlasSection(args.citySlug, args.sectionSlug))
}

export function revalidateOnAtlasEntryChange(args: {
  id: number
  citySlug: string
  sectionSlug: string
}) {
  bust(tags.atlasEntry(args.id))
  bust(tags.atlasSection(args.citySlug, args.sectionSlug))
  bust(tags.atlasCity(args.citySlug))
}

export function revalidateIntakeRun(runId: string) {
  bust(tags.intakeRun(runId))
}
