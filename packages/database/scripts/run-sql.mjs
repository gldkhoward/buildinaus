// One-shot SQL runner for migration SQL that drizzle-kit can't emit.
// Reads DATABASE_URL from env (loaded by dotenv-cli at the script call site).
// Usage:
//   pnpm exec dotenv -e ../../apps/web/.env.local -- node scripts/run-sql.mjs <file.sql>
//   pnpm exec dotenv -e ../../apps/web/.env.local -- node scripts/run-sql.mjs --inline "SELECT 1"

import { neon } from "@neondatabase/serverless"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"

const url = process.env.DATABASE_URL
if (!url) {
  console.error("DATABASE_URL not set")
  process.exit(1)
}

const sql = neon(url)

const args = process.argv.slice(2)
let body
if (args[0] === "--inline") {
  body = args.slice(1).join(" ")
} else if (args[0]) {
  body = readFileSync(resolve(process.cwd(), args[0]), "utf8")
} else {
  console.error("usage: run-sql.mjs <file.sql> | --inline '<sql>'")
  process.exit(1)
}

// Strip comment lines, then split on `;` (naive but fine for our
// hand-written migration SQL — no PL/pgSQL or string-literal semicolons).
const stripped = body
  .split("\n")
  .filter((line) => !line.trim().startsWith("--"))
  .join("\n")

const statements = stripped
  .split(";")
  .map((s) => s.trim())
  .filter((s) => s.length > 0)

for (const stmt of statements) {
  // Strip trailing semicolon if present
  const normalised = stmt.endsWith(";") ? stmt.slice(0, -1) : stmt
  process.stdout.write(`> ${normalised.split("\n")[0].slice(0, 100)}…\n`)
  // sql.query (not sql.unsafe — that returns a builder, not a promise).
  const result = await sql.query(normalised, [])
  if (Array.isArray(result) && result.length > 0) {
    console.log(JSON.stringify(result, null, 2))
  }
}

console.log(`OK — applied ${statements.length} statement(s).`)
