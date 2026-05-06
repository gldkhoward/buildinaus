/**
 * Bulk-promote every drafted atlas payload, sections first then entries
 * (so parent-section resolution succeeds for entries). One-shot — used
 * to bring the DB to full coverage after `seed:atlas`. The /admin/queue
 * UI is the per-row review path; this is the "approve everything from
 * the editorial seed" shortcut.
 */

import {
  cleanedPayloads,
  desc,
  eq,
  getDb,
} from "@buildinaus/database"
import { promote } from "@/lib/data/promote"

async function main() {
  const db = getDb()

  for (const kind of ["atlas_section", "atlas_entry"] as const) {
    const drafts = await db
      .select({ id: cleanedPayloads.id })
      .from(cleanedPayloads)
      .where(eq(cleanedPayloads.status, "drafted"))
      .orderBy(desc(cleanedPayloads.id))
    const matching = drafts.filter(async () => true) // placeholder; filtered below

    let approved = 0
    let failed = 0
    const errors = new Map<string, number>()

    // Re-query filtered by kind (the where above can't combine status + kind
    // cleanly when the enum requires a cast — a JS filter is fine here).
    const all = await db
      .select()
      .from(cleanedPayloads)
      .where(eq(cleanedPayloads.status, "drafted"))
    const queue = all.filter((p) => p.kind === kind)

    console.log(`\nPromoting ${queue.length} ${kind} draft(s)…`)
    for (const payload of queue) {
      const res = await promote(payload.id)
      if (res.ok) {
        approved++
      } else {
        failed++
        errors.set(res.error, (errors.get(res.error) ?? 0) + 1)
      }
    }
    console.log(`  ${kind}: ${approved} approved, ${failed} failed`)
    if (errors.size > 0) {
      for (const [err, n] of errors) console.log(`    ${err}: ${n}`)
    }
    void matching
  }

  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
