import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import * as schema from "./schema"

export * from "./schema"

let client: ReturnType<typeof postgres> | undefined
let dbInstance: ReturnType<typeof drizzle<typeof schema>> | undefined

export function getDb() {
  if (!dbInstance) {
    const url = process.env.DATABASE_URL
    if (!url) {
      throw new Error("DATABASE_URL is not set")
    }
    client = postgres(url, { prepare: false })
    dbInstance = drizzle(client, { schema })
  }
  return dbInstance
}
