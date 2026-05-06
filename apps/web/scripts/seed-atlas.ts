/**
 * Atlas seed parser.
 *
 * Reads the static editorial blob in `apps/web/lib/atlas.ts` and queues
 * each section / entry as a `cleaned_payloads` draft of kind
 * `atlas_section` / `atlas_entry`. A synthetic `intake_runs` row anchors
 * the batch so /admin/queue can group them by run.
 *
 * Once approved through the queue, `promote()` writes them to
 * `atlas_sections` / `atlas_entries`. This script is **idempotent on
 * (run_id)** — re-running creates a NEW run; old drafts stay queued
 * until reviewed or rejected.
 *
 * Usage:
 *   pnpm --filter @buildinaus/web seed:atlas
 */

import { randomUUID } from "node:crypto"
import {
  cleanedPayloads,
  getDb,
  intakeRuns,
} from "@buildinaus/database"
import { ATLAS, type AtlasCity } from "@/lib/atlas"

const SEED_MODEL = "editorial/seed"

interface AtlasSectionDraft {
  city_slug: string
  slug: string
  kind: "prose" | "list"
  title: string
  summary: string
  content_md?: string
  tags?: string[]
  order_index?: number
}

interface AtlasEntryDraft {
  city_slug: string
  section_slug: string
  name: string
  tagline?: string
  href?: string
  metadata?: Record<string, unknown>
  tags?: string[]
  order_index?: number
}

function buildDrafts(city: AtlasCity): {
  sections: AtlasSectionDraft[]
  entries: AtlasEntryDraft[]
} {
  const sections: AtlasSectionDraft[] = []
  const entries: AtlasEntryDraft[] = []
  let sectionOrder = 0

  // Intro → prose section
  if (city.intro.length > 0) {
    sections.push({
      city_slug: city.slug,
      slug: "intro",
      kind: "prose",
      title: city.tagline,
      summary: city.intro[0]!.slice(0, 240),
      content_md: city.intro.map((p) => p).join("\n\n"),
      order_index: sectionOrder++,
    })
  }

  // Stats → list section
  if (city.stats.length > 0) {
    sections.push({
      city_slug: city.slug,
      slug: "stats",
      kind: "list",
      title: "By the numbers",
      summary: "Quick stats on the local ecosystem.",
      order_index: sectionOrder++,
    })
    city.stats.forEach((s, i) => {
      entries.push({
        city_slug: city.slug,
        section_slug: "stats",
        name: s.label,
        tagline: s.value,
        metadata: { stat_value: s.value },
        order_index: i,
      })
    })
  }

  // Sections → list sections; groups flatten into entries with group label
  // preserved in metadata so the renderer can re-group later if wanted.
  for (const section of city.sections) {
    sections.push({
      city_slug: city.slug,
      slug: section.id,
      kind: "list",
      title: section.title,
      summary: section.blurb ?? "",
      order_index: sectionOrder++,
    })

    let entryOrder = 0
    for (const group of section.groups) {
      for (const item of group.items) {
        entries.push({
          city_slug: city.slug,
          section_slug: section.id,
          name: item.label,
          tagline: item.description,
          href: item.href,
          metadata: group.label
            ? { group_label: group.label, group_blurb: group.blurb ?? null }
            : {},
          order_index: entryOrder++,
        })
      }
    }
  }

  return { sections, entries }
}

async function main() {
  const db = getDb()

  // Anchor row — one run per seed batch.
  const runId = randomUUID()
  await db.insert(intakeRuns).values({
    id: runId,
    initialInput: "atlas:seed",
    status: "completed",
    outcome: "drafted",
    modelId: SEED_MODEL,
    finishedAt: new Date(),
  })
  console.log(`atlas seed run: ${runId}`)

  let sectionCount = 0
  let entryCount = 0

  for (const city of Object.values(ATLAS)) {
    const { sections, entries } = buildDrafts(city)

    if (sections.length > 0) {
      await db.insert(cleanedPayloads).values(
        sections.map((s) => ({
          runId,
          kind: "atlas_section" as const,
          payload: s,
          status: "drafted" as const,
          confidence: 100,
        })),
      )
      sectionCount += sections.length
    }

    if (entries.length > 0) {
      await db.insert(cleanedPayloads).values(
        entries.map((e) => ({
          runId,
          kind: "atlas_entry" as const,
          payload: e,
          status: "drafted" as const,
          confidence: 100,
        })),
      )
      entryCount += entries.length
    }

    console.log(
      `  ${city.city}: ${sections.length} section drafts, ${entries.length} entry drafts`,
    )
  }

  console.log(
    `\nseeded ${sectionCount} section draft(s) and ${entryCount} entry draft(s).`,
  )
  console.log(`approve via /admin/queue — promote() writers handle the rest.`)
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
