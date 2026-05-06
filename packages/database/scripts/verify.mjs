// Final verification — list tables, key indexes, constraints, extensions.

import { neon } from "@neondatabase/serverless"
const sql = neon(process.env.DATABASE_URL)

const ext = await sql`SELECT extname, extversion FROM pg_extension WHERE extname = 'vector'`
const tables = await sql`
  SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename
`
const enums = await sql`
  SELECT t.typname FROM pg_type t
  JOIN pg_namespace n ON n.oid = t.typnamespace
  WHERE n.nspname = 'public' AND t.typtype = 'e'
  ORDER BY t.typname
`
const indexes = await sql`
  SELECT tablename, indexname FROM pg_indexes
  WHERE schemaname = 'public'
  AND (
    indexname LIKE '%search%' OR indexname LIKE '%hnsw%' OR
    indexname LIKE '%open_only%' OR indexname LIKE '%due_for_refresh%'
  )
  ORDER BY tablename, indexname
`
const checks = await sql`
  SELECT conname, conrelid::regclass::text AS table_name
  FROM pg_constraint
  WHERE contype = 'c' AND connamespace = 'public'::regnamespace
  ORDER BY conname
`
const halfvec = await sql`
  SELECT column_name, data_type, udt_name
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'embeddings'
  ORDER BY ordinal_position
`

console.log("== Extensions ==")
console.log(ext)
console.log("\n== Tables (public) ==")
console.log(tables.map((r) => r.tablename).join(", "))
console.log(`\n  total: ${tables.length}`)
console.log("\n== Enums (public) ==")
console.log(enums.map((r) => r.typname).join(", "))
console.log(`\n  total: ${enums.length}`)
console.log("\n== Custom indexes ==")
for (const r of indexes) console.log(`  ${r.tablename}.${r.indexname}`)
console.log("\n== CHECK constraints ==")
for (const r of checks) console.log(`  ${r.table_name}.${r.conname}`)
console.log("\n== embeddings columns ==")
for (const r of halfvec) console.log(`  ${r.column_name}: ${r.udt_name}`)
