import {
  integer,
  jsonb,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core"

export type EnrichmentLogEntry = {
  runId: string
  fieldsChanged: string[]
  at: string
}

export const provenanceColumns = {
  source: varchar("source", { length: 16 }).notNull().default("editorial"),

  sourceRunId: uuid("source_run_id"),

  sourceUrl: text("source_url"),
  extractedAt: timestamp("extracted_at", { withTimezone: true }),
  extractionModel: varchar("extraction_model", { length: 96 }),

  confidence: integer("confidence"),

  reviewStatus: varchar("review_status", { length: 16 })
    .notNull()
    .default("approved"),

  reviewedBy: integer("reviewed_by"),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  lastEnrichedAt: timestamp("last_enriched_at", { withTimezone: true }),

  enrichmentLog: jsonb("enrichment_log")
    .$type<EnrichmentLogEntry[]>()
    .notNull()
    .default([]),
}
