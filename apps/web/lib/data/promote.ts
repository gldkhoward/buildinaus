"use server"

/**
 * promote(payloadId)
 *
 * Turns a `cleaned_payloads` row into a published `companies` / `founders` /
 * `events` row, generates an embedding, and busts the right Cache Components
 * tags. The agent's job ends at `cleaned_payloads`; this is the human (or
 * trusted-auto-approve) step that makes the entity visible on public
 * surfaces.
 *
 * Showcased Vercel features:
 *  - **AI Gateway + AI SDK `embed()`** for vector generation
 *  - **pgvector** via `@buildinaus/database`
 *  - **Cache Components `revalidateTag`** for granular invalidation
 *  - **Provenance columns** so the published row carries `source='agent'`,
 *    `source_run_id`, `extraction_model`, `confidence`
 */

import { embedEntity } from "@buildinaus/agent-engine"
import {
  and,
  atlasEntries,
  atlasSections,
  cleanedPayloads,
  companies,
  companyFounders,
  eq,
  events,
  founders,
  getDb,
  intakeRuns,
} from "@buildinaus/database"
import {
  revalidateDraftQueue,
  revalidateIntakeRun,
  revalidateOnAtlasEntryChange,
  revalidateOnAtlasSectionChange,
  revalidateOnCompanyChange,
  revalidateOnEventChange,
  revalidateOnFounderChange,
} from "@/lib/cache-tags"

const EXTRACTION_MODEL = "anthropic/claude-sonnet-4.6"

export type PromoteResult =
  | {
      ok: true
      kind: "company" | "founder" | "event" | "atlas_section" | "atlas_entry"
      slug: string
      redirectUrl: string
    }
  | { ok: false; error: string }

interface CompanyPayload {
  name: string
  hq_location?: string
  primary_problem?: string
  description?: string
  industry?: string[]
  founders?: string[]
  links?: { website?: string; linkedin?: string; twitter?: string }
}

interface FounderPayload {
  name: string
  headline?: string
  city?: string
  bio?: string
  current_company?: string
  links?: { website?: string; linkedin?: string; twitter?: string }
}

interface EventPayload {
  title: string
  date: string
  location: string
  tags: string[]
  source: "lu.ma" | "eventbrite" | "meetup" | "other"
  url: string
  ticket_price?: string
  rsvp_count?: number
  description?: string
}

interface AtlasSectionPayload {
  city_slug: string
  slug: string
  kind: "prose" | "list"
  title: string
  summary: string
  content_md?: string
  tags?: string[]
  order_index?: number
}

interface AtlasEntryPayload {
  city_slug: string
  section_slug: string
  name: string
  tagline?: string
  href?: string
  linked_kind?: "company" | "founder" | "event"
  linked_id?: number
  metadata?: Record<string, unknown>
  tags?: string[]
  order_index?: number
}

/* ── Public API ──────────────────────────────────────────────────────────── */

export async function promote(payloadId: number): Promise<PromoteResult> {
  const db = getDb()
  const [payload] = await db
    .select()
    .from(cleanedPayloads)
    .where(eq(cleanedPayloads.id, payloadId))
    .limit(1)
  if (!payload) return { ok: false, error: "payload_not_found" }
  if (payload.status !== "drafted") {
    return { ok: false, error: `payload_status_${payload.status}` }
  }

  switch (payload.kind) {
    case "company":
      return promoteCompany(payload.id, payload.runId, payload.payload as CompanyPayload, payload.confidence, payload.sourceUrl)
    case "founder":
      return promoteFounder(payload.id, payload.runId, payload.payload as FounderPayload, payload.confidence, payload.sourceUrl)
    case "event":
      return promoteEvent(payload.id, payload.runId, payload.payload as EventPayload, payload.confidence, payload.sourceUrl)
    case "atlas_section":
      return promoteAtlasSection(
        payload.id,
        payload.runId,
        payload.payload as AtlasSectionPayload,
        payload.confidence,
        payload.sourceUrl,
      )
    case "atlas_entry":
      return promoteAtlasEntry(
        payload.id,
        payload.runId,
        payload.payload as AtlasEntryPayload,
        payload.confidence,
        payload.sourceUrl,
      )
  }
}

/* ── Per-kind promotion ──────────────────────────────────────────────────── */

async function promoteCompany(
  payloadId: number,
  runId: string,
  data: CompanyPayload,
  confidence: number | null,
  sourceUrl: string | null,
): Promise<PromoteResult> {
  const db = getDb()
  const slug = slugify(data.name)
  const domain = extractDomain(data.links?.website ?? sourceUrl ?? "") ?? slug

  const [inserted] = await db
    .insert(companies)
    .values({
      slug,
      name: data.name,
      tagline: data.primary_problem ?? data.description?.slice(0, 120) ?? data.name,
      description: data.description ?? data.primary_problem ?? data.name,
      domain,
      citySlug: cityNameToSlug(data.hq_location) ?? "sydney",
      industry: data.industry ?? [],
      // Provenance — set on EVERY promote.
      source: "agent",
      sourceRunId: runId,
      sourceUrl: sourceUrl ?? data.links?.website ?? null,
      extractedAt: new Date(),
      extractionModel: EXTRACTION_MODEL,
      confidence: confidence ?? null,
      reviewStatus: "approved",
      publishedAt: new Date(),
    })
    .returning()
  if (!inserted) return { ok: false, error: "insert_failed" }

  // Mark the payload as approved + linked.
  await db
    .update(cleanedPayloads)
    .set({
      status: "approved",
      appliedCompanyId: inserted.id,
      reviewedAt: new Date(),
    })
    .where(eq(cleanedPayloads.id, payloadId))

  await db
    .update(intakeRuns)
    .set({ resourceCompanyId: inserted.id })
    .where(eq(intakeRuns.id, runId))

  // Embed via AI Gateway → pgvector — non-fatal.
  await safe(() =>
    embedEntity({
      kind: "company",
      entityId: inserted.id,
      sourceText: [inserted.name, inserted.tagline, inserted.description].join("\n"),
      sourceFields: ["name", "tagline", "description"],
    }),
  )

  // Bust every Cache Components tag this row appears in.
  revalidateOnCompanyChange({
    slug: inserted.slug,
    citySlug: inserted.citySlug,
    stage: inserted.stage,
    industry: inserted.industry,
  })
  revalidateDraftQueue()
  revalidateIntakeRun(runId)

  return {
    ok: true,
    kind: "company",
    slug: inserted.slug,
    redirectUrl: `/companies/${inserted.slug}`,
  }
}

async function promoteFounder(
  payloadId: number,
  runId: string,
  data: FounderPayload,
  confidence: number | null,
  sourceUrl: string | null,
): Promise<PromoteResult> {
  const db = getDb()
  const slug = slugify(data.name)

  const [inserted] = await db
    .insert(founders)
    .values({
      slug,
      name: data.name,
      role: data.headline ?? "Founder",
      bio: data.bio ?? "",
      citySlug: cityNameToSlug(data.city) ?? "sydney",
      type: "consumer", // sensible default; reviewer can re-tag later
      linkedinUrl: data.links?.linkedin,
      twitterUrl: data.links?.twitter,
      websiteUrl: data.links?.website,
      source: "agent",
      sourceRunId: runId,
      sourceUrl,
      extractedAt: new Date(),
      extractionModel: EXTRACTION_MODEL,
      confidence: confidence ?? null,
      reviewStatus: "approved",
      publishedAt: new Date(),
    })
    .returning()
  if (!inserted) return { ok: false, error: "insert_failed" }

  // If the agent recorded a current company, link via the join table.
  if (data.current_company) {
    const [company] = await db
      .select()
      .from(companies)
      .where(eq(companies.slug, slugify(data.current_company)))
      .limit(1)
    if (company) {
      await db.insert(companyFounders).values({
        companyId: company.id,
        founderId: inserted.id,
        role: data.headline ?? "Founder",
        isPrimary: false,
      })
    }
  }

  await db
    .update(cleanedPayloads)
    .set({
      status: "approved",
      appliedFounderId: inserted.id,
      reviewedAt: new Date(),
    })
    .where(eq(cleanedPayloads.id, payloadId))
  await db
    .update(intakeRuns)
    .set({ resourceFounderId: inserted.id })
    .where(eq(intakeRuns.id, runId))

  await safe(() =>
    embedEntity({
      kind: "founder",
      entityId: inserted.id,
      sourceText: [inserted.name, inserted.role, inserted.bio].join("\n"),
      sourceFields: ["name", "role", "bio"],
    }),
  )

  revalidateOnFounderChange({
    slug: inserted.slug,
    citySlug: inserted.citySlug,
    type: inserted.type,
  })
  revalidateDraftQueue()
  revalidateIntakeRun(runId)

  return {
    ok: true,
    kind: "founder",
    slug: inserted.slug,
    redirectUrl: `/founders/${inserted.slug}`,
  }
}

async function promoteEvent(
  payloadId: number,
  runId: string,
  data: EventPayload,
  confidence: number | null,
  sourceUrl: string | null,
): Promise<PromoteResult> {
  const db = getDb()
  const slug = slugify(`${data.title}-${data.date.slice(0, 10)}`)

  const [inserted] = await db
    .insert(events)
    .values({
      slug,
      title: data.title,
      description: data.description ?? "",
      citySlug: cityNameToSlug(data.location) ?? "sydney",
      startsAt: new Date(data.date),
      venue: data.location,
      rsvpCount: data.rsvp_count ?? 0,
      ticketPrice: data.ticket_price,
      platform: mapEventSource(data.source),
      platformUrl: data.url,
      tags: data.tags,
      nextRefreshAt: nextRefreshFor(new Date(data.date)),
      source: "agent",
      sourceRunId: runId,
      sourceUrl: sourceUrl ?? data.url,
      extractedAt: new Date(),
      extractionModel: EXTRACTION_MODEL,
      confidence: confidence ?? null,
      reviewStatus: "approved",
      publishedAt: new Date(),
    })
    .returning()
  if (!inserted) return { ok: false, error: "insert_failed" }

  await db
    .update(cleanedPayloads)
    .set({
      status: "approved",
      appliedEventId: inserted.id,
      reviewedAt: new Date(),
    })
    .where(eq(cleanedPayloads.id, payloadId))
  await db
    .update(intakeRuns)
    .set({ resourceEventId: inserted.id })
    .where(eq(intakeRuns.id, runId))

  await safe(() =>
    embedEntity({
      kind: "event",
      entityId: inserted.id,
      sourceText: [inserted.title, inserted.description, inserted.tags.join(" ")].join("\n"),
      sourceFields: ["title", "description", "tags"],
    }),
  )

  revalidateOnEventChange({
    slug: inserted.slug,
    citySlug: inserted.citySlug,
  })
  revalidateDraftQueue()
  revalidateIntakeRun(runId)

  return {
    ok: true,
    kind: "event",
    slug: inserted.slug,
    redirectUrl: `/events/${inserted.slug}`,
  }
}

async function promoteAtlasSection(
  payloadId: number,
  runId: string,
  data: AtlasSectionPayload,
  confidence: number | null,
  sourceUrl: string | null,
): Promise<PromoteResult> {
  const db = getDb()

  // Upsert by (city_slug, slug). If a row exists, UPDATE in place — id
  // is the stable identity, and `enrichment_log` records the run-level
  // history if we need an audit trail later.
  const [existing] = await db
    .select()
    .from(atlasSections)
    .where(
      and(
        eq(atlasSections.citySlug, data.city_slug),
        eq(atlasSections.slug, data.slug),
      ),
    )
    .limit(1)

  const baseValues = {
    kind: data.kind,
    title: data.title,
    summary: data.summary,
    contentMd: data.kind === "prose" ? (data.content_md ?? "") : null,
    tags: data.tags ?? [],
    orderIndex: data.order_index ?? existing?.orderIndex ?? 0,
    source: "agent" as const,
    sourceRunId: runId,
    sourceUrl,
    extractedAt: new Date(),
    extractionModel: EXTRACTION_MODEL,
    confidence: confidence ?? null,
    reviewStatus: "approved" as const,
    publishedAt: existing?.publishedAt ?? new Date(),
    lastEnrichedAt: existing ? new Date() : null,
    updatedAt: new Date(),
  }

  let inserted: typeof atlasSections.$inferSelect | undefined
  if (existing) {
    const [updated] = await db
      .update(atlasSections)
      .set(baseValues)
      .where(eq(atlasSections.id, existing.id))
      .returning()
    inserted = updated
  } else {
    const [created] = await db
      .insert(atlasSections)
      .values({
        ...baseValues,
        citySlug: data.city_slug,
        slug: data.slug,
      })
      .returning()
    inserted = created
  }
  if (!inserted) return { ok: false, error: "insert_failed" }

  await db
    .update(cleanedPayloads)
    .set({
      status: "approved",
      appliedAtlasSectionId: inserted.id,
      reviewedAt: new Date(),
    })
    .where(eq(cleanedPayloads.id, payloadId))

  // Embed prose sections only — list sections are searchable via their
  // entries.
  if (inserted.kind === "prose" && inserted.contentMd) {
    await safe(() =>
      embedEntity({
        kind: "atlas_section",
        entityId: inserted.id,
        sourceText: [inserted.title, inserted.summary, inserted.contentMd].join("\n"),
        sourceFields: ["title", "summary", "content_md"],
      }),
    )
  }

  revalidateOnAtlasSectionChange({
    citySlug: inserted.citySlug,
    sectionSlug: inserted.slug,
  })
  revalidateDraftQueue()
  revalidateIntakeRun(runId)

  return {
    ok: true,
    kind: "atlas_section",
    slug: inserted.slug,
    redirectUrl: `/atlas/${inserted.citySlug}#${inserted.slug}`,
  }
}

async function promoteAtlasEntry(
  payloadId: number,
  runId: string,
  data: AtlasEntryPayload,
  confidence: number | null,
  sourceUrl: string | null,
): Promise<PromoteResult> {
  const db = getDb()

  // Resolve the parent section by (city_slug, section_slug). If the section
  // doesn't exist yet, the entry is queued for the next pass — common when
  // the seed parses entries before their owning section.
  const [section] = await db
    .select()
    .from(atlasSections)
    .where(
      and(
        eq(atlasSections.citySlug, data.city_slug),
        eq(atlasSections.slug, data.section_slug),
      ),
    )
    .limit(1)
  if (!section) {
    return {
      ok: false,
      error: `parent_section_missing:${data.city_slug}:${data.section_slug}`,
    }
  }
  if (section.kind !== "list") {
    return { ok: false, error: `parent_section_not_list:${section.kind}` }
  }

  // Upsert by (section_id, name) — the unique constraint added in
  // migrations/0003_atlas_dedup.sql means re-promotes update in place
  // rather than duplicating rows.
  const [existing] = await db
    .select()
    .from(atlasEntries)
    .where(
      and(
        eq(atlasEntries.sectionId, section.id),
        eq(atlasEntries.name, data.name),
      ),
    )
    .limit(1)

  const baseValues = {
    tagline: data.tagline ?? null,
    href: data.href ?? null,
    linkedKind: data.linked_kind ?? null,
    linkedId: data.linked_id ?? null,
    metadata: data.metadata ?? {},
    tags: data.tags ?? [],
    orderIndex: data.order_index ?? existing?.orderIndex ?? 0,
    source: "agent" as const,
    sourceRunId: runId,
    sourceUrl,
    extractedAt: new Date(),
    extractionModel: EXTRACTION_MODEL,
    confidence: confidence ?? null,
    reviewStatus: "approved" as const,
    publishedAt: existing?.publishedAt ?? new Date(),
    lastEnrichedAt: existing ? new Date() : null,
    updatedAt: new Date(),
  }

  let inserted: typeof atlasEntries.$inferSelect | undefined
  if (existing) {
    const [updated] = await db
      .update(atlasEntries)
      .set(baseValues)
      .where(eq(atlasEntries.id, existing.id))
      .returning()
    inserted = updated
  } else {
    const [created] = await db
      .insert(atlasEntries)
      .values({
        ...baseValues,
        sectionId: section.id,
        name: data.name,
      })
      .returning()
    inserted = created
  }
  if (!inserted) return { ok: false, error: "insert_failed" }

  await db
    .update(cleanedPayloads)
    .set({
      status: "approved",
      appliedAtlasEntryId: inserted.id,
      reviewedAt: new Date(),
    })
    .where(eq(cleanedPayloads.id, payloadId))

  await safe(() =>
    embedEntity({
      kind: "atlas_entry",
      entityId: inserted.id,
      sourceText: [
        inserted.name,
        inserted.tagline ?? "",
        (inserted.tags as string[]).join(" "),
      ].join("\n"),
      sourceFields: ["name", "tagline", "tags"],
    }),
  )

  revalidateOnAtlasEntryChange({
    id: inserted.id,
    citySlug: section.citySlug,
    sectionSlug: section.slug,
  })
  revalidateDraftQueue()
  revalidateIntakeRun(runId)

  return {
    ok: true,
    kind: "atlas_entry",
    slug: inserted.name,
    redirectUrl: `/atlas/${section.citySlug}#${section.slug}`,
  }
}

/* ── Reject (no publish) ─────────────────────────────────────────────────── */

export async function reject(payloadId: number): Promise<PromoteResult> {
  const db = getDb()
  const [payload] = await db
    .select()
    .from(cleanedPayloads)
    .where(eq(cleanedPayloads.id, payloadId))
    .limit(1)
  if (!payload) return { ok: false, error: "payload_not_found" }
  await db
    .update(cleanedPayloads)
    .set({ status: "rejected", reviewedAt: new Date() })
    .where(eq(cleanedPayloads.id, payloadId))
  revalidateDraftQueue()
  revalidateIntakeRun(payload.runId)
  return { ok: false, error: "rejected" }
}

/* ── Helpers ─────────────────────────────────────────────────────────────── */

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64)
}

function extractDomain(urlish: string): string | null {
  if (!urlish) return null
  try {
    const u = new URL(/^https?:/.test(urlish) ? urlish : `https://${urlish}`)
    return u.host.replace(/^www\./, "")
  } catch {
    return null
  }
}

function cityNameToSlug(name?: string | null): string | null {
  if (!name) return null
  const t = name.toLowerCase()
  if (t.includes("sydney")) return "sydney"
  if (t.includes("melbourne")) return "melbourne"
  if (t.includes("brisbane")) return "brisbane"
  if (t.includes("perth")) return "perth"
  if (t.includes("adelaide")) return "adelaide"
  if (t.includes("canberra")) return "canberra"
  return null
}

function mapEventSource(s: EventPayload["source"]) {
  switch (s) {
    case "lu.ma":
      return "Lu.ma"
    case "eventbrite":
      return "Eventbrite"
    case "meetup":
      return "Meetup"
    default:
      return "Manual"
  }
}

function nextRefreshFor(startsAt: Date): Date | null {
  const now = Date.now()
  const ms = startsAt.getTime() - now
  if (ms <= 0) return null
  const day = 86_400_000
  if (ms > 30 * day) return new Date(now + 7 * day)
  if (ms > 7 * day) return new Date(now + 2 * day)
  if (ms > day) return new Date(now + 12 * 60 * 60_000)
  return new Date(now + 2 * 60 * 60_000)
}

async function safe(fn: () => Promise<unknown>): Promise<void> {
  try {
    await fn()
  } catch (err) {
    console.warn("[promote] non-fatal step failed", err)
  }
}
