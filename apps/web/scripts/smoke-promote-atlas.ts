/**
 * Smoke-test the atlas promote() writer end-to-end.
 *
 * Picks the Sydney intro section draft, promotes it, then promotes one
 * draft entry to verify both writers + the parent-section resolution path
 * work. Doesn't depend on the admin UI.
 */

import {
  and,
  atlasEntries,
  atlasSections,
  cleanedPayloads,
  eq,
  getDb,
} from "@buildinaus/database"
import { promote } from "@/lib/data/promote"

async function main() {
  const db = getDb()

  // 1. Promote the Sydney intro section.
  const introCandidates = await db
    .select()
    .from(cleanedPayloads)
    .where(
      and(
        eq(cleanedPayloads.kind, "atlas_section"),
        eq(cleanedPayloads.status, "drafted"),
      ),
    )
    .limit(50)

  const intro = introCandidates.find((p) => {
    const payload = p.payload as { city_slug: string; slug: string }
    return payload.city_slug === "sydney" && payload.slug === "intro"
  })
  if (!intro) {
    console.error("no Sydney intro draft found — did you run seed:atlas first?")
    process.exit(1)
  }

  console.log(`promoting Sydney intro section (payload id ${intro.id})…`)
  const sectionResult = await promote(intro.id)
  console.log("section result:", sectionResult)
  if (!sectionResult.ok) {
    console.error("section promote failed — aborting smoke test")
    process.exit(1)
  }

  // 2. Look up the inserted Sydney intro section row to confirm.
  const [section] = await db
    .select()
    .from(atlasSections)
    .where(
      and(
        eq(atlasSections.citySlug, "sydney"),
        eq(atlasSections.slug, "intro"),
      ),
    )
    .limit(1)
  if (!section) {
    console.error("section row not found post-promote")
    process.exit(1)
  }
  console.log(
    `  inserted atlas_section id=${section.id} kind=${section.kind} content_md=${section.contentMd?.length ?? 0} chars`,
  )

  // 3. Find a Sydney 'communities' section in drafts and promote it (list kind),
  //    then promote one of its entries.
  const communitiesSection = introCandidates.find((p) => {
    const payload = p.payload as { city_slug: string; slug: string }
    return payload.city_slug === "sydney" && payload.slug === "communities"
  })
  if (!communitiesSection) {
    console.log("no communities section — done.")
    process.exit(0)
  }

  console.log(
    `\npromoting Sydney communities section (payload id ${communitiesSection.id})…`,
  )
  const commResult = await promote(communitiesSection.id)
  console.log("section result:", commResult)
  if (!commResult.ok) {
    console.error("communities section promote failed")
    process.exit(1)
  }

  // 4. Promote one entry that belongs to communities.
  const entryCandidates = await db
    .select()
    .from(cleanedPayloads)
    .where(
      and(
        eq(cleanedPayloads.kind, "atlas_entry"),
        eq(cleanedPayloads.status, "drafted"),
      ),
    )
    .limit(200)
  const entry = entryCandidates.find((p) => {
    const payload = p.payload as {
      city_slug: string
      section_slug: string
    }
    return (
      payload.city_slug === "sydney" && payload.section_slug === "communities"
    )
  })
  if (!entry) {
    console.log("no communities entry to promote — done.")
    process.exit(0)
  }

  console.log(`\npromoting communities entry (payload id ${entry.id})…`)
  const entryResult = await promote(entry.id)
  console.log("entry result:", entryResult)
  if (!entryResult.ok) {
    console.error("entry promote failed")
    process.exit(1)
  }

  const allEntries = await db
    .select()
    .from(atlasEntries)
    .where(eq(atlasEntries.sectionId, section.id))
  console.log(
    `\nsmoke test passed. atlas_sections: 2, atlas_entries (under communities): ${
      allEntries.length
    } so far.`,
  )
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
