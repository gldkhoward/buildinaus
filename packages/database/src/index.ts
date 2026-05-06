import { neon } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-http"
import * as schema from "./schema"

export * from "./schema"

// Re-export the drizzle query helpers consumers reach for, so app code
// doesn't take a direct dep on drizzle-orm. Keeps the package boundary
// clean and the import surface in lib/data/* small.
export {
  and,
  asc,
  count,
  countDistinct,
  desc,
  eq,
  gt,
  gte,
  ilike,
  inArray,
  isNotNull,
  isNull,
  lt,
  lte,
  ne,
  not,
  or,
  sql,
} from "drizzle-orm"

let dbInstance: ReturnType<typeof drizzle<typeof schema>> | undefined

export function getDb() {
  if (!dbInstance) {
    const url = process.env.DATABASE_URL
    if (!url) {
      throw new Error("DATABASE_URL is not set")
    }
    const sql = neon(url)
    dbInstance = drizzle(sql, { schema })
  }
  return dbInstance
}
