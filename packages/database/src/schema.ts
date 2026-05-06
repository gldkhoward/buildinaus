import { relations } from "drizzle-orm"
import {
  bigserial,
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
  vector,
  type AnyPgColumn,
} from "drizzle-orm/pg-core"

import { provenanceColumns } from "./columns/provenance"

/* ── Enums ────────────────────────────────────────────────────────────── */

export const userRole = pgEnum("user_role", [
  "founder",
  "operator",
  "investor",
  "engineer",
  "researcher",
  "student",
])

export const companyStage = pgEnum("company_stage", [
  "Pre-seed",
  "Seed",
  "Series A",
  "Series B",
  "Series C+",
  "Unknown",
])

export const founderType = pgEnum("founder_type", [
  "ai-infra",
  "devtools",
  "climate",
  "biotech",
  "robotics",
  "consumer",
])

export const jobType = pgEnum("job_type", [
  "Full-time",
  "Contract",
  "Founding",
])

export const eventSource = pgEnum("event_source", [
  "Lu.ma",
  "Eventbrite",
  "Meetup",
  "Manual",
])

export const embeddingEntity = pgEnum("embedding_entity", [
  "company",
  "founder",
  "job",
  "event",
  "atlas_section",
  "atlas_entry",
])

export const atlasSectionKind = pgEnum("atlas_section_kind", [
  "prose",
  "list",
])

export const intakeStatus = pgEnum("intake_status", [
  "running",
  "completed",
  "failed",
  "cancelled",
])

export const intakeOutcome = pgEnum("intake_outcome", [
  "created",
  "drafted",
  "noop",
  "error",
])

export const cleanedPayloadKind = pgEnum("cleaned_payload_kind", [
  "company",
  "founder",
  "event",
  "atlas_section",
  "atlas_entry",
])

export const reviewStatusEnum = pgEnum("review_status_enum", [
  "drafted",
  "approved",
  "rejected",
  "superseded",
])

/* ── 5.1 users ────────────────────────────────────────────────────────── */

export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),

    authSubjectId: text("auth_subject_id").notNull().unique(),

    email: varchar("email", { length: 320 }).notNull().unique(),
    emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),

    slug: varchar("slug", { length: 64 }).notNull().unique(),
    name: text("name").notNull(),

    role: userRole("role").notNull().default("founder"),
    citySlug: varchar("city_slug", { length: 32 }),
    headline: text("headline"),
    linkedinUrl: text("linkedin_url"),

    avatarBlobUrl: text("avatar_blob_url"),
    avatarBlobPathname: text("avatar_blob_pathname"),

    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    byRoleCity: index("users_by_role_city").on(t.role, t.citySlug),
  }),
)

/* ── 5.2 companies ────────────────────────────────────────────────────── */

export const companies = pgTable(
  "companies",
  {
    id: serial("id").primaryKey(),
    slug: varchar("slug", { length: 64 }).notNull().unique(),

    name: text("name").notNull(),
    tagline: text("tagline").notNull(),
    description: text("description").notNull(),
    domain: varchar("domain", { length: 255 }).notNull(),

    citySlug: varchar("city_slug", { length: 32 }).notNull(),
    stage: companyStage("stage").notNull().default("Unknown"),

    industry: jsonb("industry").$type<string[]>().notNull().default([]),

    metricLabel: varchar("metric_label", { length: 64 }),
    metricValue: varchar("metric_value", { length: 32 }),

    trustScore: integer("trust_score").notNull().default(0),
    domainAgeDays: integer("domain_age_days").notNull().default(0),
    verified: boolean("verified").notNull().default(false),

    logoBlobUrl: text("logo_blob_url"),
    logoBlobPathname: text("logo_blob_pathname"),
    coverBlobUrl: text("cover_blob_url"),
    coverBlobPathname: text("cover_blob_pathname"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),

    ...provenanceColumns,
  },
  (t) => ({
    byCity: index("companies_by_city").on(t.citySlug),
    byStage: index("companies_by_stage").on(t.stage),
    byVerifiedPublished: index("companies_by_verified_published").on(
      t.verified,
      t.publishedAt,
    ),
    byReviewPublished: index("companies_by_review_published").on(
      t.reviewStatus,
      t.publishedAt,
    ),
    bySourceRun: index("companies_by_source_run").on(t.sourceRunId),
  }),
)

/* ── 5.3 founders ─────────────────────────────────────────────────────── */

export const founders = pgTable(
  "founders",
  {
    id: serial("id").primaryKey(),
    slug: varchar("slug", { length: 64 }).notNull().unique(),

    name: text("name").notNull(),
    role: varchar("role", { length: 96 }).notNull(),
    bio: text("bio").notNull(),

    citySlug: varchar("city_slug", { length: 32 }).notNull(),
    type: founderType("type").notNull(),

    linkedinUrl: text("linkedin_url"),
    twitterUrl: text("twitter_url"),
    websiteUrl: text("website_url"),

    avatarBlobUrl: text("avatar_blob_url"),
    avatarBlobPathname: text("avatar_blob_pathname"),

    userId: integer("user_id").references(() => users.id, {
      onDelete: "set null",
    }),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),

    ...provenanceColumns,
  },
  (t) => ({
    byType: index("founders_by_type").on(t.type),
    byCity: index("founders_by_city").on(t.citySlug),
    byUser: index("founders_by_user").on(t.userId),
    byReviewPublished: index("founders_by_review_published").on(
      t.reviewStatus,
      t.publishedAt,
    ),
    bySourceRun: index("founders_by_source_run").on(t.sourceRunId),
  }),
)

/* ── 5.4 company_founders (join) ──────────────────────────────────────── */

export const companyFounders = pgTable(
  "company_founders",
  {
    companyId: integer("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    founderId: integer("founder_id")
      .notNull()
      .references(() => founders.id, { onDelete: "cascade" }),
    role: varchar("role", { length: 64 }).notNull(),
    isPrimary: boolean("is_primary").notNull().default(false),
    sinceYear: integer("since_year"),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.companyId, t.founderId] }),
    byCompany: index("company_founders_by_company").on(t.companyId),
    byFounder: index("company_founders_by_founder").on(t.founderId),
  }),
)

/* ── 5.5 jobs ─────────────────────────────────────────────────────────── */

export const jobs = pgTable(
  "jobs",
  {
    id: serial("id").primaryKey(),
    slug: varchar("slug", { length: 96 }).notNull().unique(),

    title: text("title").notNull(),
    description: text("description").notNull(),

    companyId: integer("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),

    citySlug: varchar("city_slug", { length: 32 }).notNull(),
    salary: varchar("salary", { length: 64 }).notNull(),
    type: jobType("type").notNull(),

    applyUrl: text("apply_url"),

    postedAt: timestamp("posted_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    closedAt: timestamp("closed_at", { withTimezone: true }),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),

    ...provenanceColumns,
  },
  (t) => ({
    byCompany: index("jobs_by_company").on(t.companyId),
    byCity: index("jobs_by_city").on(t.citySlug),
    byPostedAt: index("jobs_by_posted_at").on(t.postedAt),
    byReviewPublished: index("jobs_by_review_published").on(
      t.reviewStatus,
      t.publishedAt,
    ),
  }),
)

/* ── 5.6 events ───────────────────────────────────────────────────────── */

export const events = pgTable(
  "events",
  {
    id: serial("id").primaryKey(),
    slug: varchar("slug", { length: 96 }).notNull().unique(),

    title: text("title").notNull(),
    description: text("description").notNull(),

    citySlug: varchar("city_slug", { length: 32 }).notNull(),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }),

    venue: text("venue").notNull(),
    rsvpCount: integer("rsvp_count").notNull().default(0),
    ticketPrice: text("ticket_price"),

    // Platform the event lives on (Lu.ma / Eventbrite / Meetup / Manual).
    // Renamed from `source` to avoid clashing with the provenance `source`
    // column (which means "how this row got into the DB"). Same applies to
    // platformUrl vs sourceUrl.
    platform: eventSource("platform").notNull(),
    platformUrl: text("platform_url").notNull(),

    tags: jsonb("tags").$type<string[]>().notNull().default([]),

    coverBlobUrl: text("cover_blob_url"),
    coverBlobPathname: text("cover_blob_pathname"),

    nextRefreshAt: timestamp("next_refresh_at", { withTimezone: true }),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),

    ...provenanceColumns,
  },
  (t) => ({
    byCityStarts: index("events_by_city_starts").on(t.citySlug, t.startsAt),
    byStarts: index("events_by_starts").on(t.startsAt),
    byReviewPublished: index("events_by_review_published").on(
      t.reviewStatus,
      t.publishedAt,
    ),
  }),
)

/* ── 5.7 trust_signals ────────────────────────────────────────────────── */

export const trustSignals = pgTable("trust_signals", {
  companyId: integer("company_id")
    .primaryKey()
    .references(() => companies.id, { onDelete: "cascade" }),

  domain: varchar("domain", { length: 255 }).notNull(),
  domainAgeDays: integer("domain_age_days").notNull(),
  hasMx: boolean("has_mx").notNull(),
  hasHttps: boolean("has_https").notNull(),
  publicMentions: integer("public_mentions").notNull().default(0),

  score: integer("score").notNull(),
  reasons: jsonb("reasons").$type<string[]>().notNull().default([]),

  rawSignals: jsonb("raw_signals"),

  recomputedAt: timestamp("recomputed_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
})

/* ── 5.8 embeddings (pgvector) ────────────────────────────────────────── */

export const embeddings = pgTable(
  "embeddings",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),

    entityKind: embeddingEntity("entity_kind").notNull(),
    entityId: integer("entity_id").notNull(),

    embedding: vector("embedding", { dimensions: 3072 }).notNull(),

    sourceText: text("source_text").notNull(),
    sourceFields: jsonb("source_fields").$type<string[]>().notNull(),

    model: varchar("model", { length: 64 }).notNull(),
    generatedAt: timestamp("generated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    byEntity: uniqueIndex("embeddings_by_entity").on(
      t.entityKind,
      t.entityId,
    ),
  }),
)

/* ── 5.9 tailored_pages ───────────────────────────────────────────────── */

export const tailoredPages = pgTable("tailored_pages", {
  fingerprint: varchar("fingerprint", { length: 96 }).primaryKey(),

  blocks: jsonb("blocks").notNull(),

  modelHint: varchar("model_hint", { length: 96 }).notNull(),
  generationMs: integer("generation_ms").notNull(),
  totalTokens: integer("total_tokens"),
  totalCostUsd: numeric("total_cost_usd", { precision: 10, scale: 4 }),

  generatedAt: timestamp("generated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),

  cacheTags: jsonb("cache_tags").$type<string[]>().notNull().default([]),
})

/* ── 5.10 curated_configs ─────────────────────────────────────────────── */

export const curatedConfigs = pgTable("curated_configs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),

  blocks: jsonb("blocks").$type<string[]>().notNull().default([]),
  layout: varchar("layout", { length: 16 }).notNull().default("grid"),

  autoCurated: boolean("auto_curated").notNull().default(false),

  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
})

/* ── 5.11 intake_runs ─────────────────────────────────────────────────── */

export const intakeRuns = pgTable(
  "intake_runs",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    workflowRunId: text("workflow_run_id").unique(),
    workflowAttempt: integer("workflow_attempt").notNull().default(1),

    userId: integer("user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    sessionToken: text("session_token"),
    ipHash: varchar("ip_hash", { length: 64 }),

    region: varchar("region", { length: 32 }),

    initialInput: text("initial_input").notNull(),
    intent: varchar("intent", { length: 24 }),

    status: intakeStatus("status").notNull().default("running"),
    outcome: intakeOutcome("outcome"),

    resourceCompanyId: integer("resource_company_id").references(
      () => companies.id,
      { onDelete: "set null" },
    ),
    resourceFounderId: integer("resource_founder_id").references(
      () => founders.id,
      { onDelete: "set null" },
    ),
    resourceEventId: integer("resource_event_id").references(
      () => events.id,
      { onDelete: "set null" },
    ),

    redirectUrl: text("redirect_url"),
    summaryMarkdown: text("summary_markdown"),
    transcriptBlobUrl: text("transcript_blob_url"),
    transcriptBlobPathname: text("transcript_blob_pathname"),

    modelId: varchar("model_id", { length: 64 }),
    gatewayRequestId: text("gateway_request_id"),
    totalTokens: integer("total_tokens"),
    totalCostUsd: numeric("total_cost_usd", { precision: 10, scale: 4 }),

    rateLimitBucket: varchar("rate_limit_bucket", { length: 32 }),

    startedAt: timestamp("started_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
  },
  (t) => ({
    byUser: index("intake_runs_by_user").on(t.userId, t.startedAt),
    bySession: index("intake_runs_by_session").on(t.sessionToken),
    byStatus: index("intake_runs_by_status").on(t.status, t.startedAt),
  }),
)

/* ── 5.12 intake_messages ─────────────────────────────────────────────── */

export const intakeMessages = pgTable(
  "intake_messages",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),

    runId: uuid("run_id")
      .notNull()
      .references(() => intakeRuns.id, { onDelete: "cascade" }),

    role: varchar("role", { length: 16 }).notNull(),

    parts: jsonb("parts").notNull(),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    byRun: index("intake_messages_by_run").on(t.runId, t.id),
  }),
)

/* ── 5.13 intake_steps (audit-only mirror of WDK) ─────────────────────── */

export const intakeSteps = pgTable(
  "intake_steps",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),

    runId: uuid("run_id")
      .notNull()
      .references(() => intakeRuns.id, { onDelete: "cascade" }),

    stepName: varchar("step_name", { length: 32 }).notNull(),
    attempt: integer("attempt").notNull().default(1),
    status: varchar("status", { length: 16 }).notNull(),

    modelId: varchar("model_id", { length: 64 }),
    gatewayRequestId: text("gateway_request_id"),
    inputTokens: integer("input_tokens"),
    outputTokens: integer("output_tokens"),
    costUsd: numeric("cost_usd", { precision: 10, scale: 4 }),

    errorText: text("error_text"),

    startedAt: timestamp("started_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
  },
  (t) => ({
    byRun: index("intake_steps_by_run").on(t.runId, t.startedAt),
    byStepName: index("intake_steps_by_step").on(t.stepName, t.startedAt),
  }),
)

/* ── 5.14 cleaned_payloads ────────────────────────────────────────────── */

export const cleanedPayloads = pgTable(
  "cleaned_payloads",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),

    runId: uuid("run_id")
      .notNull()
      .references(() => intakeRuns.id, { onDelete: "cascade" }),

    kind: cleanedPayloadKind("kind").notNull(),
    payload: jsonb("payload").notNull(),

    sourceUrl: text("source_url"),
    confidence: integer("confidence"),

    status: reviewStatusEnum("status").notNull().default("drafted"),

    appliedCompanyId: integer("applied_company_id").references(
      () => companies.id,
      { onDelete: "set null" },
    ),
    appliedFounderId: integer("applied_founder_id").references(
      () => founders.id,
      { onDelete: "set null" },
    ),
    appliedEventId: integer("applied_event_id").references(
      () => events.id,
      { onDelete: "set null" },
    ),
    // Atlas applied targets — populated when the cleaned_payload promotes
    // to an atlas section / entry row. CHECK constraint (in custom SQL)
    // enforces at most one applied_*_id is set across all five FKs.
    appliedAtlasSectionId: integer("applied_atlas_section_id").references(
      (): AnyPgColumn => atlasSections.id,
      { onDelete: "set null" },
    ),
    appliedAtlasEntryId: integer("applied_atlas_entry_id").references(
      (): AnyPgColumn => atlasEntries.id,
      { onDelete: "set null" },
    ),

    reviewedBy: integer("reviewed_by").references(() => users.id, {
      onDelete: "set null",
    }),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    byStatus: index("cleaned_payloads_by_status").on(
      t.status,
      t.kind,
      t.createdAt,
    ),
    byRun: index("cleaned_payloads_by_run").on(t.runId),
  }),
)

/* ── 5.15 scrape_provenance ───────────────────────────────────────────── */

export const scrapeProvenance = pgTable(
  "scrape_provenance",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),

    runId: uuid("run_id")
      .notNull()
      .references(() => intakeRuns.id, { onDelete: "cascade" }),

    url: text("url").notNull(),
    provider: varchar("provider", { length: 16 }).notNull(),

    status: integer("status"),
    contentHash: varchar("content_hash", { length: 64 }).notNull(),

    cacheHit: boolean("cache_hit").notNull(),

    htmlBlobUrl: text("html_blob_url"),
    htmlBlobPathname: text("html_blob_pathname"),

    fetchedAt: timestamp("fetched_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    byRun: index("scrape_provenance_by_run").on(t.runId),
    byUrl: index("scrape_provenance_by_url").on(t.url, t.fetchedAt),
    byHash: index("scrape_provenance_by_hash").on(t.contentHash),
  }),
)

/* ── 5.16 atlas_sections ──────────────────────────────────────────────── */

export const atlasSections = pgTable(
  "atlas_sections",
  {
    id: serial("id").primaryKey(),

    citySlug: varchar("city_slug", { length: 32 }).notNull(),
    slug: varchar("slug", { length: 64 }).notNull(),

    kind: atlasSectionKind("kind").notNull(),
    title: text("title").notNull(),
    summary: text("summary").notNull(),

    // Populated only when kind = 'prose'. List sections render from
    // atlas_entries rather than markdown.
    contentMd: text("content_md"),

    tags: jsonb("tags").$type<string[]>().notNull().default([]),
    orderIndex: integer("order_index").notNull().default(0),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),

    ...provenanceColumns,
  },
  (t) => ({
    byCitySlug: uniqueIndex("atlas_sections_by_city_slug").on(
      t.citySlug,
      t.slug,
    ),
    byCityOrder: index("atlas_sections_by_city_order").on(
      t.citySlug,
      t.orderIndex,
    ),
    byReviewPublished: index("atlas_sections_by_review_published").on(
      t.reviewStatus,
      t.publishedAt,
    ),
  }),
)

/* ── 5.17 atlas_entries ───────────────────────────────────────────────── */

export const atlasEntries = pgTable(
  "atlas_entries",
  {
    id: serial("id").primaryKey(),
    sectionId: integer("section_id")
      .notNull()
      .references(() => atlasSections.id, { onDelete: "cascade" }),

    name: text("name").notNull(),
    tagline: text("tagline"),
    href: text("href"),

    // Optional bridge to a real entity if the atlas item is also a company /
    // founder / event in our DB. Polymorphic by (kind, id) since the FK
    // could point at any of three tables; the atlas page renders a
    // canonical link when set.
    linkedKind: varchar("linked_kind", { length: 16 }),
    linkedId: integer("linked_id"),

    metadata: jsonb("metadata").$type<Record<string, unknown>>()
      .notNull()
      .default({}),
    tags: jsonb("tags").$type<string[]>().notNull().default([]),
    orderIndex: integer("order_index").notNull().default(0),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),

    ...provenanceColumns,
  },
  (t) => ({
    bySectionOrder: index("atlas_entries_by_section_order").on(
      t.sectionId,
      t.orderIndex,
    ),
    byLinked: index("atlas_entries_by_linked").on(t.linkedKind, t.linkedId),
    byReviewPublished: index("atlas_entries_by_review_published").on(
      t.reviewStatus,
      t.publishedAt,
    ),
  }),
)

/* ── Relations (Drizzle typed joins) ──────────────────────────────────── */

export const usersRelations = relations(users, ({ one, many }) => ({
  curatedConfig: one(curatedConfigs, {
    fields: [users.id],
    references: [curatedConfigs.userId],
  }),
  founderProfiles: many(founders),
}))

export const companiesRelations = relations(companies, ({ many, one }) => ({
  founders: many(companyFounders),
  jobs: many(jobs),
  trustSignals: one(trustSignals, {
    fields: [companies.id],
    references: [trustSignals.companyId],
  }),
}))

export const foundersRelations = relations(founders, ({ many, one }) => ({
  companies: many(companyFounders),
  user: one(users, {
    fields: [founders.userId],
    references: [users.id],
  }),
}))

export const companyFoundersRelations = relations(
  companyFounders,
  ({ one }) => ({
    company: one(companies, {
      fields: [companyFounders.companyId],
      references: [companies.id],
    }),
    founder: one(founders, {
      fields: [companyFounders.founderId],
      references: [founders.id],
    }),
  }),
)

export const jobsRelations = relations(jobs, ({ one }) => ({
  company: one(companies, {
    fields: [jobs.companyId],
    references: [companies.id],
  }),
}))

export const intakeRunsRelations = relations(intakeRuns, ({ one, many }) => ({
  user: one(users, {
    fields: [intakeRuns.userId],
    references: [users.id],
  }),
  resourceCompany: one(companies, {
    fields: [intakeRuns.resourceCompanyId],
    references: [companies.id],
  }),
  resourceFounder: one(founders, {
    fields: [intakeRuns.resourceFounderId],
    references: [founders.id],
  }),
  resourceEvent: one(events, {
    fields: [intakeRuns.resourceEventId],
    references: [events.id],
  }),
  messages: many(intakeMessages),
  steps: many(intakeSteps),
  cleanedPayloads: many(cleanedPayloads),
  scrapes: many(scrapeProvenance),
}))

export const intakeMessagesRelations = relations(intakeMessages, ({ one }) => ({
  run: one(intakeRuns, {
    fields: [intakeMessages.runId],
    references: [intakeRuns.id],
  }),
}))

export const intakeStepsRelations = relations(intakeSteps, ({ one }) => ({
  run: one(intakeRuns, {
    fields: [intakeSteps.runId],
    references: [intakeRuns.id],
  }),
}))

export const cleanedPayloadsRelations = relations(
  cleanedPayloads,
  ({ one }) => ({
    run: one(intakeRuns, {
      fields: [cleanedPayloads.runId],
      references: [intakeRuns.id],
    }),
    appliedCompany: one(companies, {
      fields: [cleanedPayloads.appliedCompanyId],
      references: [companies.id],
    }),
    appliedFounder: one(founders, {
      fields: [cleanedPayloads.appliedFounderId],
      references: [founders.id],
    }),
    appliedEvent: one(events, {
      fields: [cleanedPayloads.appliedEventId],
      references: [events.id],
    }),
    appliedAtlasSection: one(atlasSections, {
      fields: [cleanedPayloads.appliedAtlasSectionId],
      references: [atlasSections.id],
    }),
    appliedAtlasEntry: one(atlasEntries, {
      fields: [cleanedPayloads.appliedAtlasEntryId],
      references: [atlasEntries.id],
    }),
    reviewer: one(users, {
      fields: [cleanedPayloads.reviewedBy],
      references: [users.id],
    }),
  }),
)

export const atlasSectionsRelations = relations(atlasSections, ({ many }) => ({
  entries: many(atlasEntries),
}))

export const atlasEntriesRelations = relations(atlasEntries, ({ one }) => ({
  section: one(atlasSections, {
    fields: [atlasEntries.sectionId],
    references: [atlasSections.id],
  }),
}))

/* ── Inferred types ───────────────────────────────────────────────────── */

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Company = typeof companies.$inferSelect
export type NewCompany = typeof companies.$inferInsert
export type Founder = typeof founders.$inferSelect
export type NewFounder = typeof founders.$inferInsert
export type Job = typeof jobs.$inferSelect
export type NewJob = typeof jobs.$inferInsert
export type Event = typeof events.$inferSelect
export type NewEvent = typeof events.$inferInsert
export type CompanyFounder = typeof companyFounders.$inferSelect
export type TrustSignals = typeof trustSignals.$inferSelect
export type Embedding = typeof embeddings.$inferSelect
export type TailoredPage = typeof tailoredPages.$inferSelect
export type CuratedConfig = typeof curatedConfigs.$inferSelect
export type IntakeRun = typeof intakeRuns.$inferSelect
export type NewIntakeRun = typeof intakeRuns.$inferInsert
export type IntakeMessage = typeof intakeMessages.$inferSelect
export type IntakeStep = typeof intakeSteps.$inferSelect
export type CleanedPayload = typeof cleanedPayloads.$inferSelect
export type ScrapeProvenance = typeof scrapeProvenance.$inferSelect
export type AtlasSection = typeof atlasSections.$inferSelect
export type NewAtlasSection = typeof atlasSections.$inferInsert
export type AtlasEntry = typeof atlasEntries.$inferSelect
export type NewAtlasEntry = typeof atlasEntries.$inferInsert
