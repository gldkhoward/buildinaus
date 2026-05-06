// Drop everything in the `public` schema and re-prepare for a fresh
// drizzle-kit push. Used when the schema is in flux and pre-existing
// placeholder tables prevent a clean push.
//
// Safe today because no environment has real data.
// Run with: pnpm exec dotenv -e ../../apps/web/.env.local -- node scripts/reset-public.mjs

import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL)

const tables = await sql`
  SELECT tablename FROM pg_tables WHERE schemaname = 'public'
`
const enums = await sql`
  SELECT t.typname
  FROM pg_type t
  JOIN pg_namespace n ON n.oid = t.typnamespace
  WHERE n.nspname = 'public' AND t.typtype = 'e'
`

console.log(`dropping ${tables.length} table(s) and ${enums.length} enum(s) in public…`)

for (const { tablename } of tables) {
  await sql.query(`DROP TABLE IF EXISTS public."${tablename}" CASCADE`, [])
}
for (const { typname } of enums) {
  await sql.query(`DROP TYPE IF EXISTS public."${typname}" CASCADE`, [])
}

const left = await sql`
  SELECT count(*)::int AS n FROM information_schema.tables WHERE table_schema = 'public'
`
console.log(`done. public tables remaining: ${left[0].n}`)
