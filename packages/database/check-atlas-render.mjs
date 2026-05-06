import { neon } from "@neondatabase/serverless"
const sql = neon(process.env.DATABASE_URL)

const sections = await sql`
  SELECT id, slug, title FROM atlas_sections
  WHERE city_slug = 'sydney' AND review_status = 'approved'
    AND slug NOT IN ('intro','stats')
  ORDER BY order_index
`

console.log("Sydney sections + entry counts (DB-side, what the UI receives):\n")
for (const s of sections) {
  const totalRows = await sql`
    SELECT COUNT(*)::int AS n FROM atlas_entries
    WHERE section_id = ${s.id} AND review_status = 'approved'
  `
  const distinctNames = await sql`
    SELECT COUNT(DISTINCT name)::int AS n FROM atlas_entries
    WHERE section_id = ${s.id} AND review_status = 'approved'
  `
  console.log(
    `  ${s.slug.padEnd(24)} (${s.title.slice(0, 30).padEnd(30)})  total=${String(totalRows[0].n).padStart(4)}  distinct=${distinctNames[0].n}`,
  )
}
