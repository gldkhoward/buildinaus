# BuildinAus — schema, runtime, and Vercel showcase architecture

This document is the single source of truth for the persistence layer and how
it cooperates with the Vercel platform. It supersedes the earlier drafts in
`docs/database-schema.md` (UI-driven) and `ai_schema_requirements/README.md`
(intake-driven), folding both into one spec that's been deliberately shaped to
showcase Vercel + Next.js features.

> **Source of truth at runtime:** `packages/database/src/schema.ts` (Drizzle).
> **Source of truth for cross-package interfaces:** `packages/types/src/index.ts`.
> **Source of truth for AI-internal shapes:** `packages/agent-engine/src/schemas.ts`.

---

## 1. Goals

1. **Showcase the Vercel platform.** The architecture must visibly use AI SDK,
   AI Gateway, Vercel Workflow (WDK), Cache Components / PPR, Runtime Cache,
   Blob, and Marketplace integrations (Neon Postgres, Upstash). Each feature
   maps to a concrete table or surface — no purely-decorative dependencies.
2. **Every page in `apps/web` resolves with at most one round-trip per
   logical entity.** No N+1s when rendering a company's founders + jobs.
3. **Single source of truth.** Drizzle schema in `packages/database` is
   authoritative; `apps/web/lib/data/*` is the only call site that touches
   the DB; `@buildinaus/types` mirrors only the read interface.
4. **Agent-friendly.** The intake agent writes drafts that are reviewable
   before they hit public surfaces. Drafts and audited rows share a uniform
   provenance tail (§4) so the UI can render a "draft" badge consistently.
5. **Cohort-cacheable.** The tailored one-pager keys on a coarse fingerprint
   so a single generation serves an entire cohort (e.g. every climate
   founder in Sydney). DB cache + Cache Components + tag-based invalidation,
   layered.
6. **Recommendable.** "Find climate founders" / "find devtools companies in
   Melbourne" works from text query → embedding → vector similarity search
   without a separate search service.

---

## 2. Vercel features showcased

Every feature below is load-bearing for at least one user-visible surface.

| Feature | Where it shows up | Tables / surfaces involved |
|---|---|---|
| **AI SDK** (`streamText`, `ToolLoopAgent`, `useChat`, `streamObject`, `embed`) | `/intake` chat, tailored page generation, search | `intake_runs`, `intake_messages`, `cleaned_payloads`, `tailored_pages`, `embeddings` |
| **AI Gateway** | Every model call (provider routing, cost) | `intake_runs.total_cost_usd`, `intake_runs.model_id`, `tailored_pages.model_hint` |
| **Vercel Workflow (WDK)** | Intake agent run orchestration | `intake_runs.workflow_run_id` + `workflow_status` + `workflow_attempt`; `intake_steps` mirror table (§5.15) |
| **Cache Components / PPR** (`use cache`, `cacheTag`, `revalidateTag`) | `/companies`, `/founders`, `/events`, `/p/[slug]`, `/atlas/[city]` | All public read paths; tag taxonomy in §7 |
| **Runtime Cache API** (`@vercel/functions` `getCache()` / `'use cache: remote'`) | Scrape result cache (cross-function, per region) | `scrape_provenance` (audit only — hot data is in Runtime Cache) |
| **Vercel Blob** | Company logos, founder avatars, event covers, raw scraped HTML | `companies.logo_blob_url/pathname`, `founders.avatar_blob_url/pathname`, `events.cover_blob_url/pathname`, `scrape_provenance.html_blob_url/pathname` |
| **Edge Config** | Block registry, feature flags, scrape allow/deny lists, city display map | **No DB tables** — see §17 |
| **Vercel Cron Jobs** | Trust recompute, event refresh, job-posting checks | Triggers (`vercel.json`) — see §11 |
| **AI Gateway observability** | Per-step cost, model fallbacks, deep-link to dashboard | `intake_runs.gateway_request_id`, `intake_steps.gateway_request_id`, `model_fallbacks_used` |
| **Vercel Sandbox** | Future user-supplied scrape recipes (deferred) | §14 — `scrape_recipes` is the planned table |
| **Neon (Marketplace)** | Postgres + branching for preview deployments | All tables |
| **Neon Auth** | Passwordless email-OTP sign-in | `users.auth_subject_id` bridge |
| **BotID** | Anti-bot check on `POST /api/intake` | No DB table — verdict checked pre-rate-limit; bot rejections logged via Vercel Observability |
| **Upstash Redis (Marketplace)** | Anonymous intake rate limiting | No DB table — `@upstash/ratelimit` sliding window; `intake_runs.rate_limit_bucket` records the bucket used |
| **pgvector** (Neon) | Semantic search ("climate founders") | `embeddings` |
| **Edge / Fluid Compute** | Public read paths | All `lib/data/*` reads default to streaming where useful; region recorded in `intake_runs.region` |

---

## 3. Decisions

These are settled. Anything still open lives in §15.

1. **Auth provider.** Neon Auth (email-OTP, passwordless). `users.auth_subject_id`
   bridges to `neon_auth.user.id`. The `neon_auth.*` schema is owned by the
   provider; we do not introspect it into Drizzle.
2. **WDK is mandatory, not deferred.** The intake agent runs as a Vercel
   Workflow. Per-step state lives in WDK; only run-level metadata, the chat
   transcript, and reviewable artifacts persist in Postgres. Every "scrape
   step / clean step / finalize step" the older drafts proposed as a DB row
   is replaced by a WDK step.
3. **pgvector for semantic search across every authored entity.** "Find
   climate founders" / "robotics labs near uni" / "AI infra events this
   month" all run as vector queries against `embeddings`. Every entity that
   could appear in a search result — companies, founders, jobs, events —
   gets an embedding row, generated via AI SDK `embed()` on entity
   create / publish / material update. The embedding model is
   `SCRAPER_MODELS.embed` from `packages/agent-engine/src/gateway.ts` (one
   place to upgrade). Today's choice is a 3072-dim model — picked over
   smaller variants for recall on thematic queries; the cost difference is
   negligible at our row counts. Cross-entity ranking is a single query
   plan.
4. **Vercel Blob for assets, day one.** `*_blob_url` columns land in the
   initial schema so we don't migrate later. Seed data uses real Blob URLs.
5. **Polymorphic resource references = per-kind nullable FKs.** On
   `intake_runs` we use `resource_company_id`, `resource_founder_id`,
   `resource_event_id` (each nullable, at most one set, enforced by CHECK).
   This gives Drizzle typed relations and referential integrity for free —
   the cleanest showcase of Drizzle's relations API on top of Neon.
6. **Anonymous intake = yes, capped at 2 runs per IP per hour.** Rate
   limiting is Upstash Redis via `@upstash/ratelimit` (sliding window). No
   DB table. Anonymous runs attach to a session cookie so the user can
   return to `/intake/<run_id>`. Authenticated users are uncapped (subject
   to AI Gateway spend).
7. **`cleaned_payloads` is the review queue.** Promotion to `companies` /
   `founders` / `events` is a discrete `promote(id)` action; drafts are
   listable, badged, but not on public surfaces by default.
8. **Cities stay as `varchar(32)`** for v1 (matches `CitySlug` in types).
   The `cities` lookup table from the older draft is deferred — bring it in
   when we need timezone metadata or per-city feature flags.
9. **Atlas is decomposed (§5.16 / §5.17).** Two-table schema with a
   `kind` discriminator (`prose` | `list`). Prose sections store
   Markdown; the agent emits standard MD that the component catalog in
   `packages/dashboard-blocks/src/atlas/` styles via `@mdx-js/mdx
   evaluate()` at the Cache Components boundary. List sections store
   `atlas_entries` rows so filterable queries ("VCs that backed
   robotics") work natively. Atlas content has no scheduled refresh —
   updates flow through the review queue.
10. **Audit log is deferred.** AI provenance columns (§4) cover the "who/what
    drafted this" need for v1. Full audit log lands when editorial volume
    warrants it.
11. **Vercel Cron Jobs handle periodic refresh.** Different data has
    different freshness needs — events drift (date moves, cancellations),
    job posts close, company trust signals decay, tailored-page caches
    expire. Each gets its own cron entry in `vercel.json` pointing at a
    route under `/api/cron/*`. Where rows have varying urgency (events
    next week vs next month), an indexed `next_refresh_at` column lets
    the cron sweep query "rows due now" instead of full-scanning. See §11.
12. **Edge Config is the home for non-relational platform config** —
    block-id allow-list, feature flags (intake on/off, anonymous-allowed,
    hybrid-search on), scrape allow/deny domains, city slug → display
    name, per-cron enabled flags. None of this gets a DB table; it lives
    in Edge Config so reads are sub-millisecond and edits don't ship a
    migration. See §17 for the catalogue.
13. **Audit-only `intake_steps` mirror.** WDK owns per-step state at
    runtime, but a thin Drizzle table mirrors `(run_id, step_name,
    attempt, gateway_request_id, model_id, tokens, cost_usd)` so
    SQL-joinable per-step cost survives WDK retention windows. See §5.15.

---

## 4. AI provenance columns (mixin)

Every authored entity (`companies`, `founders`, `jobs`, `events`) gets this
uniform 12-column tail. They are how the UI distinguishes "agent-drafted,
awaiting review" from "human-confirmed", and how a single `WHERE
review_status IN ('approved','editorial')` filter cleans every public list.

```ts
// packages/database/src/columns/provenance.ts
import {
  varchar,
  text,
  integer,
  timestamp,
  jsonb,
  uuid,
} from "drizzle-orm/pg-core"

export const provenanceColumns = {
  source: varchar("source", { length: 16 })
    .notNull()
    .default("editorial"), // 'agent' | 'user' | 'editorial'

  sourceRunId: uuid("source_run_id"),
  // FK added per-table to avoid circular module import:
  //   .references(() => intakeRuns.id, { onDelete: "set null" })

  sourceUrl: text("source_url"),
  extractedAt: timestamp("extracted_at", { withTimezone: true }),
  extractionModel: varchar("extraction_model", { length: 96 }),

  confidence: integer("confidence"), // 0..100, emitted by the cleaner

  reviewStatus: varchar("review_status", { length: 16 })
    .notNull()
    .default("approved"), // 'drafted' | 'approved' | 'rejected' | 'superseded'

  reviewedBy: integer("reviewed_by"),
  // .references(() => users.id, { onDelete: "set null" })

  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  lastEnrichedAt: timestamp("last_enriched_at", { withTimezone: true }),

  enrichmentLog: jsonb("enrichment_log")
    .$type<Array<{ runId: string; fieldsChanged: string[]; at: string }>>()
    .notNull()
    .default([]),
}
```

**Index pattern (applied per entity table):**

- `(review_status, published_at DESC)` — public list filter
- `(source_run_id)` — "what got created in this run" view
- `(review_status) WHERE review_status = 'drafted'` — moderation queue

---

## 5. Schema

### 5.1 Identity — `users`

The `users` row mirrors the minimum we need to render and link to a profile.
Auth identity lives in `neon_auth.user`; we only carry the bridge column and
a few cached fields.

```ts
export const userRole = pgEnum("user_role", [
  "founder", "operator", "investor", "engineer", "researcher", "student",
])

export const users = pgTable("users", {
  id: serial("id").primaryKey(),

  // Bridge to neon_auth.user.id. Set on first authenticated request via
  // getOrCreateProfile() in lib/auth/session.ts.
  authSubjectId: text("auth_subject_id").notNull().unique(),

  // Cached from neon_auth.user.email at profile creation; resynced on demand.
  email: varchar("email", { length: 320 }).notNull().unique(),
  emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),

  slug: varchar("slug", { length: 64 }).notNull().unique(),
  name: text("name").notNull(), // defaults to email-prefix on create

  role: userRole("role").notNull().default("founder"),
  citySlug: varchar("city_slug", { length: 32 }),
  headline: text("headline"),
  linkedinUrl: text("linkedin_url"),

  avatarBlobUrl: text("avatar_blob_url"),

  lastSeenAt: timestamp("last_seen_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
})
```

**Indexes:** `(slug)` unique, `(auth_subject_id)` unique, `(email)` unique,
`(role, city_slug)` for "founders in Sydney" leaderboards.

**Used by:**
- `apps/web/lib/auth/session.ts → getCurrentUser()` — joins session →
  profile via `auth_subject_id`.
- `/founders/[slug]` if `users` is linked from a `founders` row (claimed
  profile).
- Tailored page personalisation (`role` + `citySlug` feed the fingerprint).

---

### 5.2 `companies` (renamed from `startups`)

The permanent URL surface is `/companies/[slug]`. This rename is a one-time
migration; future schema changes are additive.

```ts
export const companyStage = pgEnum("company_stage", [
  "Pre-seed", "Seed", "Series A", "Series B", "Series C+", "Unknown",
])

export const companies = pgTable("companies", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 64 }).notNull().unique(),

  name: text("name").notNull(),
  tagline: text("tagline").notNull(),
  description: text("description").notNull(),
  domain: varchar("domain", { length: 255 }).notNull(),

  citySlug: varchar("city_slug", { length: 32 }).notNull(),
  stage: companyStage("stage").notNull().default("Unknown"),

  industry: jsonb("industry").$type<string[]>().notNull().default([]),

  // Bento card metric strip
  metricLabel: varchar("metric_label", { length: 64 }),
  metricValue: varchar("metric_value", { length: 32 }),

  // Cached from trust_signals.score for fast list rendering
  trustScore: integer("trust_score").notNull().default(0),
  domainAgeDays: integer("domain_age_days").notNull().default(0),
  verified: boolean("verified").notNull().default(false),

  logoBlobUrl: text("logo_blob_url"),
  coverBlobUrl: text("cover_blob_url"),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),

  ...provenanceColumns,
})
```

**Indexes:** `(slug)` unique, `(city_slug)`, `(stage)`,
`(verified, published_at DESC)` for "verified, recent" feeds, plus the
provenance indexes from §4.

**Used by:** `/companies` list, `/companies/[slug]` detail, atlas city
groupings, tailored page blocks, command-bar search.

**Cache tags (Cache Components):**
- `companies:list`
- `company:${slug}`
- `city:${citySlug}`, `stage:${stage}`, `industry:${tag}` per item
  (used by tailored-page invalidation)

---

### 5.3 `founders`

Distinct from `users`. A founder profile may exist without anyone signing in —
the agent can scrape one from a company website. A `users` row links to a
`founders` row when the user claims it.

```ts
export const founderType = pgEnum("founder_type", [
  "ai-infra", "devtools", "climate", "biotech", "robotics", "consumer",
])

export const founders = pgTable("founders", {
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

  // null until claimed by a logged-in user
  userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),

  ...provenanceColumns,
})
```

**Indexes:** `(slug)` unique, `(type)`, `(city_slug)`, `(user_id)`, plus
provenance.

**Used by:** `/founders`, `/founders/[slug]`, founder leaderboard block,
"find climate founders" semantic search (§10).

---

### 5.4 `company_founders` (join)

Many-to-many — a founder can be on multiple companies, a company has multiple
co-founders.

```ts
export const companyFounders = pgTable(
  "company_founders",
  {
    companyId: integer("company_id").notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    founderId: integer("founder_id").notNull()
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
```

The current UI shows "founders for this company" and "company for this
founder". With this join + indexes, both directions are O(1) lookups.

---

### 5.5 `jobs`

```ts
export const jobType = pgEnum("job_type", ["Full-time", "Contract", "Founding"])

export const jobs = pgTable("jobs", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 96 }).notNull().unique(),

  title: text("title").notNull(),
  description: text("description").notNull(),

  companyId: integer("company_id").notNull()
    .references(() => companies.id, { onDelete: "cascade" }),

  citySlug: varchar("city_slug", { length: 32 }).notNull(),
  salary: varchar("salary", { length: 64 }).notNull(),
  type: jobType("type").notNull(),

  applyUrl: text("apply_url"),

  postedAt: timestamp("posted_at", { withTimezone: true }).defaultNow().notNull(),
  closedAt: timestamp("closed_at", { withTimezone: true }), // null = open

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),

  ...provenanceColumns,
})
```

**Indexes:** `(slug)` unique, `(company_id)`, `(city_slug)`, `(posted_at)`,
plus a partial index `WHERE closed_at IS NULL` for "open jobs only".

> Never store relative strings like "2 days ago". Compute at render from
> `posted_at`.

---

### 5.6 `events`

```ts
export const eventSource = pgEnum("event_source", [
  "Lu.ma", "Eventbrite", "Meetup", "Manual",
])

export const events = pgTable("events", {
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

  // Platform the event lives on. Named `platform` (not `source`) so it
  // doesn't collide with the provenance mixin's `source` column ("how this
  // row got into the DB"). Same reasoning for `platform_url`.
  platform: eventSource("platform").notNull(),
  platformUrl: text("platform_url").notNull(),

  tags: jsonb("tags").$type<string[]>().notNull().default([]),

  coverBlobUrl: text("cover_blob_url"),

  // Driven by the events refresh cron (§11). Set on insert / re-fetch based
  // on time-to-event: closer events refresh more often. Null once
  // `starts_at` is in the past — no point re-checking past events.
  nextRefreshAt: timestamp("next_refresh_at", { withTimezone: true }),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),

  ...provenanceColumns,
})
```

**Indexes:** `(slug)` unique, `(city_slug, starts_at)` composite (fastest path
for "next events in Sydney"), `(starts_at)` for cross-city feed, partial
`(next_refresh_at) WHERE next_refresh_at IS NOT NULL` for the refresh cron
sweep.

**Refresh cadence** (set by the cron at refresh time):

| Time until `starts_at` | Refresh interval |
|---|---|
| > 30 days | every 7 days |
| 7–30 days | every 2 days |
| 1–7 days | every 12 hours |
| < 24 hours | every 2 hours |
| past | `next_refresh_at = NULL` (stop refreshing) |

---

### 5.7 `trust_signals`

Per-domain signals that feed `companies.trust_score`. Stored separately so
we can recompute without touching the company row.

```ts
export const trustSignals = pgTable("trust_signals", {
  companyId: integer("company_id").primaryKey()
    .references(() => companies.id, { onDelete: "cascade" }),

  domain: varchar("domain", { length: 255 }).notNull(),
  domainAgeDays: integer("domain_age_days").notNull(),
  hasMx: boolean("has_mx").notNull(),
  hasHttps: boolean("has_https").notNull(),
  publicMentions: integer("public_mentions").notNull().default(0),

  score: integer("score").notNull(),
  reasons: jsonb("reasons").$type<string[]>().notNull().default([]),

  rawSignals: jsonb("raw_signals"), // RDAP / scraper raw payload

  recomputedAt: timestamp("recomputed_at", { withTimezone: true })
    .defaultNow().notNull(),
})
```

`companies.trust_score` mirrors `trust_signals.score` for fast list rendering.
A nightly Cron job (or a step at the end of an intake run) recomputes from
raw signals.

---

### 5.8 `embeddings` (pgvector)

Single uniform table keyed by `(entityKind, entityId)` so cross-entity search
is one query. Generated via AI SDK `embed()` on entity create / publish /
material update.

> **Prerequisite:** `CREATE EXTENSION IF NOT EXISTS vector;` on the Neon
> branch. Run once via the Neon Console SQL editor or in the first migration.

```ts
import { vector } from "drizzle-orm/pg-core"

export const embeddingEntity = pgEnum("embedding_entity", [
  "company", "founder", "job", "event",
])

export const embeddings = pgTable(
  "embeddings",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),

    entityKind: embeddingEntity("entity_kind").notNull(),
    entityId: integer("entity_id").notNull(),

    // 3072 dims matches the model exported as SCRAPER_MODELS.embed. We
    // pick a higher-recall model for thematic queries ("climate founders",
    // "robotics labs near uni"); the embed cost premium is negligible at
    // our row counts. Cross-entity semantic search is one query plan.
    embedding: vector("embedding", { dimensions: 3072 }).notNull(),

    // The text that was embedded (kept for debugging + re-embed on model swap)
    sourceText: text("source_text").notNull(),
    sourceFields: jsonb("source_fields").$type<string[]>().notNull(),
    // ^ which entity columns were concatenated, e.g. ["name","tagline","description"]

    // The exact gateway model id at write time. Captured here (not just in
    // SCRAPER_MODELS) so a re-embed sweep can detect rows on the old model.
    model: varchar("model", { length: 64 }).notNull(),
    generatedAt: timestamp("generated_at", { withTimezone: true })
      .defaultNow().notNull(),
  },
  (t) => ({
    byEntity: uniqueIndex("embeddings_by_entity").on(t.entityKind, t.entityId),
    // HNSW index on a halfvec shadow column — created in migration SQL
    // since drizzle-kit doesn't emit pgvector index syntax (and Drizzle
    // 0.36 has no halfvec type). pgvector caps both ivfflat and hnsw at
    // 2000 dim on the indexed column; -large is 3072. Halfvec
    // (half-precision) lifts that to 4000 dim with ~99% recall, so we keep
    // the full-precision `embedding` for storage / re-ranking and index
    // a generated halfvec shadow:
    //
    //   ALTER TABLE embeddings
    //     ADD COLUMN embedding_half halfvec(3072)
    //     GENERATED ALWAYS AS (embedding::halfvec(3072)) STORED;
    //   CREATE INDEX embeddings_cosine_hnsw
    //     ON embeddings USING hnsw (embedding_half halfvec_cosine_ops)
    //     WITH (m = 16, ef_construction = 64);
    //
    // Queries use `embedding_half <=> $1::halfvec(3072)` for the indexed
    // ANN lookup; if exact distance is ever needed (re-ranking the top-K),
    // re-score against the full `embedding` column.
  }),
)
```

**Read path** (search / "find climate founders"):

```ts
// apps/web/lib/data/search.ts
import { embed } from "ai"
import { sql } from "drizzle-orm"
import { db, embeddings } from "@buildinaus/database"
import { SCRAPER_MODELS } from "@buildinaus/agent-engine"

export async function semanticSearch(query: string, kinds: EmbeddingKind[]) {
  const { embedding } = await embed({
    model: SCRAPER_MODELS.embed,   // resolves via AI Gateway
    value: query,
  })

  return db.execute(sql`
    SELECT entity_kind, entity_id,
           1 - (embedding <=> ${embedding}::vector) AS score
    FROM   embeddings
    WHERE  entity_kind = ANY(${kinds})
    ORDER  BY embedding <=> ${embedding}::vector
    LIMIT  20
  `)
}
```

**Write path:** triggered from the intake run (after `cleaned_payloads` is
promoted) and from any manual edit. The embed call is a WDK step so it's
durable and retryable.

**Used by:**
- Command bar suggestion ranking ("climate founders" → top-N matches)
- Tailored page block selection (cohort fingerprint queries embeddings to
  pick relevant companies)
- "Similar to this" rails on detail pages

---

### 5.9 `tailored_pages` (cohort cache, durable layer)

`/p/[slug]` keys on a coarse fingerprint (`${role}::${city}::${type}`) so a
single generation serves every founder in a cohort. This table is the
durable layer; **Cache Components / PPR sits in front** with `cacheTag` +
`revalidateTag` for sub-millisecond hits.

```ts
export const tailoredPages = pgTable("tailored_pages", {
  fingerprint: varchar("fingerprint", { length: 96 }).primaryKey(),
  // ^ e.g. "founder::sydney::climate"

  blocks: jsonb("blocks").notNull(), // TailoredBlock[]

  modelHint: varchar("model_hint", { length: 96 }).notNull(),
  generationMs: integer("generation_ms").notNull(),
  totalTokens: integer("total_tokens"),
  totalCostUsd: numeric("total_cost_usd", { precision: 10, scale: 4 }),

  generatedAt: timestamp("generated_at", { withTimezone: true })
    .defaultNow().notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),

  cacheTags: jsonb("cache_tags").$type<string[]>().notNull().default([]),
  // ^ used by revalidateTag() to invalidate selectively. Always includes:
  //   ["tailored:fingerprint:<fp>", "city:<slug>", "type:<slug>"]
})
```

**Two-tier cache flow:**

```
[Browser]
    │
    ▼
[Cache Components]   ── HIT (sub-ms) ──▶ rendered HTML
    │ MISS
    ▼
[lib/data/tailored.ts (use cache)]   ── HIT ──▶ blocks
    │ MISS
    ▼
[SELECT FROM tailored_pages WHERE fingerprint=$1 AND expires_at > now()]
    │ HIT  ───▶ return + warm Cache Components
    │ MISS
    ▼
[AI SDK streamObject via Gateway → blocks]
    │
    ▼
[INSERT/UPSERT tailored_pages]   ── then return
```

**Invalidation:** when a company in Sydney publishes,
`revalidateTag('city:sydney', 'max')` invalidates every Cache Components
entry whose tags include it. The DB row stays (it's a TTL cache); Cache
Components
re-reads on next request and may re-generate if expired.

---

### 5.10 `curated_configs`

A signed-in user's customisation of the tailored page (block ordering, hidden
blocks, layout).

```ts
export const curatedConfigs = pgTable("curated_configs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique()
    .references(() => users.id, { onDelete: "cascade" }),

  blocks: jsonb("blocks").$type<string[]>().notNull().default([]), // BlockId[]
  layout: varchar("layout", { length: 16 }).notNull().default("grid"),
  // 'grid' | 'feed' | 'kanban'

  // Set when the curation agent suggests a layout; flipped to false on user edit.
  autoCurated: boolean("auto_curated").notNull().default(false),

  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow().notNull(),
})
```

---

### 5.11 `intake_runs`

One row per `useChat` session against `/api/intake`. We generate
`intake_runs.id` ourselves (uuid, server-side) **before** `start()`-ing
the workflow, so the row exists for `/intake/<run_id>` to resolve even
during the brief window before the workflow registers.

The WDK run id is captured into `workflow_run_id` once `start()` returns —
they are deliberately **separate identifiers**. Decoupling means: (a) the
schema doesn't depend on WDK's id format, (b) preview and prod can run
against different WDK backends, (c) we can re-run the workflow against
the same `intake_runs.id` without colliding (rare, but useful for
debugging).

```ts
export const intakeStatus = pgEnum("intake_status", [
  "running", "completed", "failed", "cancelled",
])

export const intakeOutcome = pgEnum("intake_outcome", [
  "created", "drafted", "noop", "error",
])

export const intakeRuns = pgTable(
  "intake_runs",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    // Set after start() returns. Distinct from intake_runs.id — see §6.5.
    // Used only to deep-link to the WDK dashboard.
    workflowRunId: text("workflow_run_id").unique(),

    // WDK lifecycle mirror (distinct from app-level `status`). Lets the UI
    // render "suspended waiting on retry" without polling WDK.
    workflowStatus: varchar("workflow_status", { length: 24 }),
    // 'queued' | 'running' | 'suspended' | 'succeeded' | 'failed' | 'cancelled'

    workflowAttempt: integer("workflow_attempt").notNull().default(1),
    lastStepName: varchar("last_step_name", { length: 64 }),
    // ^ enables "resumed from step X, attempt Y" UI

    // Fluid Compute region the workflow executed in. Useful for cohort
    // latency analysis and proves the multi-region story in demos.
    region: varchar("region", { length: 8 }),

    // Authenticated user, OR null + sessionToken for anonymous runs.
    userId: integer("user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    sessionToken: text("session_token"),
    // ^ opaque cookie token for anonymous users; lets them return to
    //   /intake/<run_id> within the cookie's lifetime.

    ipHash: varchar("ip_hash", { length: 64 }),
    // ^ sha256 of client IP, used for analytics + post-hoc abuse review.
    //   Live rate limiting happens in Upstash, not here (§8).

    rateLimitBucket: varchar("rate_limit_bucket", { length: 32 }),
    // ^ 'anon' | 'user' | 'trusted' — the Upstash bucket the run was
    //   counted against. Lets analytics segment without re-deriving.

    initialInput: text("initial_input").notNull(),
    intent: varchar("intent", { length: 24 }), // from Plan.intent

    status: intakeStatus("status").notNull().default("running"),
    outcome: intakeOutcome("outcome"),

    // Per-kind FK columns (decision §3.5). At most one is set; CHECK constraint
    // enforces. Drizzle relations on each give us typed joins for free.
    resourceCompanyId: integer("resource_company_id")
      .references(() => companies.id, { onDelete: "set null" }),
    resourceFounderId: integer("resource_founder_id")
      .references(() => founders.id, { onDelete: "set null" }),
    resourceEventId: integer("resource_event_id")
      .references(() => events.id, { onDelete: "set null" }),

    redirectUrl: text("redirect_url"),
    summaryMarkdown: text("summary_markdown"),

    // AI Gateway observability — deep-link a run to the Gateway dashboard
    // without joining anywhere. Per-step ids live on `intake_steps` (§5.15).
    gatewayRequestId: text("gateway_request_id"),
    gatewaySessionId: text("gateway_session_id"),
    modelId: varchar("model_id", { length: 64 }), // root gateway model id

    // Records each provider fallback the Gateway performed during the run —
    // proves routing is doing its job in demos.
    modelFallbacksUsed: jsonb("model_fallbacks_used")
      .$type<Array<{ from: string; to: string; reason: string; at: string }>>()
      .notNull()
      .default([]),

    totalTokens: integer("total_tokens"),
    totalCostUsd: numeric("total_cost_usd", { precision: 10, scale: 4 }),

    // Optional: offload very large transcripts to Blob and clear
    // `intake_messages` rows older than N days. Null in the common case.
    transcriptBlobUrl: text("transcript_blob_url"),
    transcriptBlobPathname: text("transcript_blob_pathname"),

    startedAt: timestamp("started_at", { withTimezone: true })
      .defaultNow().notNull(),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
  },
  (t) => ({
    byUser: index("intake_runs_by_user").on(t.userId, t.startedAt),
    bySession: index("intake_runs_by_session").on(t.sessionToken),
    byStatus: index("intake_runs_by_status").on(t.status, t.startedAt),
    // CHECK constraint: at most one resource_*_id is non-null.
    // Drizzle doesn't generate CHECKs cleanly for compound conditions —
    // emit in a custom migration:
    //
    //   ALTER TABLE intake_runs ADD CONSTRAINT intake_runs_one_resource
    //   CHECK (
    //     (resource_company_id IS NOT NULL)::int +
    //     (resource_founder_id IS NOT NULL)::int +
    //     (resource_event_id  IS NOT NULL)::int <= 1
    //   );
  }),
)
```

**Drizzle relations** (typed joins for free):

```ts
export const intakeRunsRelations = relations(intakeRuns, ({ one }) => ({
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
}))
```

This is the Drizzle showcase moment: a single `db.query.intakeRuns.findFirst({
where, with: { user: true, resourceCompany: true } })` returns a fully typed
nested object with no manual join logic.

---

### 5.12 `intake_messages`

The chat transcript — both user pastes and assistant replies — persisted so
`/intake/<run_id>` can rehydrate without replaying the workflow.

```ts
export const intakeMessages = pgTable(
  "intake_messages",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),

    runId: uuid("run_id").notNull()
      .references(() => intakeRuns.id, { onDelete: "cascade" }),

    role: varchar("role", { length: 16 }).notNull(),
    // 'user' | 'assistant' | 'system'

    parts: jsonb("parts").notNull(),
    // ^ verbatim UIMessagePart[] from useChat. The renderer in
    //   intake-chat.tsx already understands every variant.

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow().notNull(),
  },
  (t) => ({
    byRun: index("intake_messages_by_run").on(t.runId, t.id),
  }),
)
```

> No `intake_steps` / `intake_plans` tables. Per-step state is owned by WDK
> (§6). The WDK dashboard is the operator-facing trace; `intake_messages` is
> the user-facing transcript.

---

### 5.13 `cleaned_payloads`

The output of the `clean` tool, awaiting promotion. This is the **review
queue** — the artifact that survives the agent run and feeds `/admin/queue`.

```ts
export const cleanedPayloadKind = pgEnum("cleaned_payload_kind", [
  "company", "founder", "event",
])

export const reviewStatus = pgEnum("review_status", [
  "drafted", "approved", "rejected", "superseded",
])

export const cleanedPayloads = pgTable(
  "cleaned_payloads",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),

    runId: uuid("run_id").notNull()
      .references(() => intakeRuns.id, { onDelete: "cascade" }),

    kind: cleanedPayloadKind("kind").notNull(),
    payload: jsonb("payload").notNull(),
    // ^ matches Cleaned{Company,Founder,Event}Schema in agent-engine

    sourceUrl: text("source_url"),
    confidence: integer("confidence"), // 0..100

    status: reviewStatus("status").notNull().default("drafted"),

    // Set when promoted: links to the published row.
    appliedCompanyId: integer("applied_company_id")
      .references(() => companies.id, { onDelete: "set null" }),
    appliedFounderId: integer("applied_founder_id")
      .references(() => founders.id, { onDelete: "set null" }),
    appliedEventId: integer("applied_event_id")
      .references(() => events.id, { onDelete: "set null" }),

    reviewedBy: integer("reviewed_by")
      .references(() => users.id, { onDelete: "set null" }),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow().notNull(),
  },
  (t) => ({
    byStatus: index("cleaned_payloads_by_status")
      .on(t.status, t.kind, t.createdAt),
    byRun: index("cleaned_payloads_by_run").on(t.runId),
  }),
)
```

**`promote(payloadId)` flow** lives in `apps/web/lib/data/promote.ts`:
1. SELECT the payload, switch on `kind`.
2. INSERT into `companies` / `founders` / `events` with `source = 'agent'`,
   `source_run_id = payload.runId`, `confidence = payload.confidence`,
   `review_status = 'approved'`.
3. UPDATE the payload: `status = 'approved'`, `applied_*_id`, `reviewedBy`,
   `reviewedAt`.
4. Enqueue an embed job (WDK step) for the new entity.
5. `revalidateTag(tag, 'max')` on relevant cache tags (see §7.4).

---

### 5.14 `scrape_provenance`

Lightweight audit-only table. Hot cache lives in **Vercel Runtime Cache**
(`getCache()` namespace `scrape`, keyed by URL hash, TTL 1h). This table records *that* a scrape
happened and links it to a run, but does not store the full markdown blob.

```ts
export const scrapeProvenance = pgTable(
  "scrape_provenance",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),

    runId: uuid("run_id").notNull()
      .references(() => intakeRuns.id, { onDelete: "cascade" }),

    url: text("url").notNull(),
    provider: varchar("provider", { length: 16 }).notNull(),
    // 'firecrawl' | 'fetch'

    status: integer("status"),
    contentHash: varchar("content_hash", { length: 64 }).notNull(),
    // ^ sha256 of normalised markdown — proves what the agent saw

    cacheHit: boolean("cache_hit").notNull(),
    // ^ true if served from Runtime Cache, false if a fresh fetch

    // Raw HTML offloaded to Vercel Blob for "what did the agent actually
    // see" debugging. Markdown stays in Runtime Cache for query/replay; raw
    // HTML in Blob keeps Postgres + Runtime Cache lean and gives us a
    // forensic snapshot.
    htmlBlobUrl: text("html_blob_url"),
    htmlBlobPathname: text("html_blob_pathname"),
    // Convention: `scrapes/<sha256(url)>/raw.html`

    fetchedAt: timestamp("fetched_at", { withTimezone: true })
      .defaultNow().notNull(),
  },
  (t) => ({
    byRun: index("scrape_provenance_by_run").on(t.runId),
    byUrl: index("scrape_provenance_by_url").on(t.url, t.fetchedAt),
    byHash: index("scrape_provenance_by_hash").on(t.contentHash),
  }),
)
```

Markdown is keyed in Runtime Cache by `scrape:v1:<sha256(url)>` (TTL ladder
in §7.2). If we need the markdown later for a re-clean, the cache hit serves
it; on a cache miss, the WDK step re-scrapes (and records a new provenance
row + Blob upload).

---

### 5.15 `intake_steps` (audit-only mirror of WDK steps)

WDK owns per-step state at runtime. This table is a **thin, append-only
mirror** written from inside each tool's `execute` (or a workflow `onStep`
hook) so per-step cost is SQL-joinable and survives if WDK retention
expires. It is not the source of truth — the WDK dashboard is — but it lets
us answer "show me total cost by step name across the last 7 days" in one
SELECT.

```ts
export const intakeSteps = pgTable(
  "intake_steps",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),

    runId: uuid("run_id").notNull()
      .references(() => intakeRuns.id, { onDelete: "cascade" }),

    stepName: varchar("step_name", { length: 64 }).notNull(),
    // 'plan' | 'scout' | 'deepDive' | 'luma' | 'eventbrite' | 'clean' |
    // 'finalize' | 'promote' | 'embed'

    attempt: integer("attempt").notNull().default(1),
    // ^ WDK retry counter; 1 == first try

    status: varchar("status", { length: 16 }).notNull(),
    // 'succeeded' | 'failed' | 'skipped'

    // AI Gateway observability — these correlate to a single Gateway log
    // entry per step. Populated for steps that hit a model; null otherwise
    // (e.g. plain `scout` is fetch-only).
    gatewayRequestId: text("gateway_request_id"),
    modelId: varchar("model_id", { length: 64 }),
    inputTokens: integer("input_tokens"),
    outputTokens: integer("output_tokens"),
    costUsd: numeric("cost_usd", { precision: 10, scale: 4 }),

    startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
    durationMs: integer("duration_ms"),

    errorText: text("error_text"),
  },
  (t) => ({
    byRun: index("intake_steps_by_run").on(t.runId, t.startedAt),
    byStepName: index("intake_steps_by_step").on(t.stepName, t.startedAt),
  }),
)
```

**Read path** — "step cost over the last 7 days":

```sql
SELECT step_name,
       count(*)              AS calls,
       sum(cost_usd)         AS spend,
       avg(duration_ms)::int AS p50_ms
FROM   intake_steps
WHERE  started_at > now() - interval '7 days'
GROUP  BY step_name
ORDER  BY spend DESC;
```

The WDK dashboard remains the operator-facing trace; this is the analyst /
finance view.

---

### 5.16 `atlas_sections`

Decomposed atlas content. Each row is a section of a city's atlas page;
rows flow through the same `cleaned_payloads` review queue as every other
authored entity and inherit the AI provenance tail.

**Two kinds, one source of truth per row** (per the discriminator):

- **`prose`** — `content_md` is the canonical source; no `atlas_entries`
  attached. Rendered via `apps/web/lib/atlas/compile.tsx` which uses
  `@mdx-js/mdx evaluate()` with `atlasComponents` from
  `@buildinaus/dashboard-blocks`. Compilation is cached at the Cache
  Components layer (`cacheLife('weeks')`) — the agent emits Markdown
  once, the component layer styles every render.
- **`list`** — `content_md` is `null`; `atlas_entries` rows attached via
  `section_id` are the canonical items. Filterable, joinable, embeddable.

Hybrid layouts (e.g. "intro paragraph + list") become a `prose` section
followed by a `list` section. One source of truth per row, no
duplication.

```ts
export const atlasSectionKind = pgEnum("atlas_section_kind", ["prose", "list"])

export const atlasSections = pgTable(
  "atlas_sections",
  {
    id: serial("id").primaryKey(),
    citySlug: varchar("city_slug", { length: 32 }).notNull(),
    slug: varchar("slug", { length: 64 }).notNull(),
    kind: atlasSectionKind("kind").notNull(),
    title: text("title").notNull(),
    summary: text("summary").notNull(),
    contentMd: text("content_md"),
    tags: jsonb("tags").$type<string[]>().notNull().default([]),
    orderIndex: integer("order_index").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow().notNull(),
    ...provenanceColumns,
  },
  (t) => ({
    byCitySlug: uniqueIndex("atlas_sections_by_city_slug")
      .on(t.citySlug, t.slug),
    byCityOrder: index("atlas_sections_by_city_order")
      .on(t.citySlug, t.orderIndex),
    byReviewPublished: index("atlas_sections_by_review_published")
      .on(t.reviewStatus, t.publishedAt),
    // tsvector + GIN for keyword search (custom SQL — see migrations/0002_atlas.sql)
  }),
)
```

**Rendering pattern** (city atlas page is statically pre-generated for all
city slugs at build time; per-section render is cached for weeks; the
personalised filter slot streams via Suspense):

```tsx
// apps/web/app/atlas/[city]/page.tsx
export async function generateStaticParams() {
  return [{ city: "sydney" }, { city: "melbourne" }, { city: "brisbane" }]
}

export default async function CityAtlasPage({ params }) {
  const { city } = await params
  return (
    <PageShell>
      <CityHeader city={city} />
      <AtlasSections city={city} />
      <Suspense fallback={<PersonaliseSkeleton />}>
        <PersonalisedFilter city={city} />
      </Suspense>
    </PageShell>
  )
}

async function AtlasSections({ city }: { city: string }) {
  "use cache"
  cacheLife("weeks")
  cacheTag("atlas", `atlas:${city}`)

  const sections = await db
    .select()
    .from(atlasSections)
    .where(and(
      eq(atlasSections.citySlug, city),
      eq(atlasSections.reviewStatus, "approved"),
    ))
    .orderBy(atlasSections.orderIndex)

  return sections.map((s) =>
    s.kind === "prose"
      ? <ProseSection key={s.id} section={s} />
      : <ListSection key={s.id} section={s} />
  )
}
```

### 5.17 `atlas_entries`

Items inside `kind = 'list'` sections. Each entry is a queryable row, so
"Sydney VCs that backed robotics" works via tsvector + pgvector hybrid
(§10.3). Entries can optionally bridge to a real `companies` /
`founders` / `events` row via `(linked_kind, linked_id)`.

```ts
export const atlasEntries = pgTable(
  "atlas_entries",
  {
    id: serial("id").primaryKey(),
    sectionId: integer("section_id").notNull()
      .references(() => atlasSections.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    tagline: text("tagline"),
    href: text("href"),
    linkedKind: varchar("linked_kind", { length: 16 }),
    linkedId: integer("linked_id"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>()
      .notNull().default({}),
    tags: jsonb("tags").$type<string[]>().notNull().default([]),
    orderIndex: integer("order_index").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow().notNull(),
    ...provenanceColumns,
  },
  (t) => ({
    bySectionOrder: index("atlas_entries_by_section_order")
      .on(t.sectionId, t.orderIndex),
    byLinked: index("atlas_entries_by_linked")
      .on(t.linkedKind, t.linkedId),
    byReviewPublished: index("atlas_entries_by_review_published")
      .on(t.reviewStatus, t.publishedAt),
  }),
)
```

**Component catalog** (`packages/dashboard-blocks/src/atlas/`): the agent
emits standard Markdown for prose; the component layer maps `h1-h3`, `p`,
`ul`, `li`, `blockquote`, `a`, `strong` to atlas-styled components and
exposes `<AtlasGrid>` / `<AtlasFeatureCard>` / `<AtlasStat>` for inline
MDX use. Adding a component is non-breaking — no DB migration needed
since content is stored as Markdown source.

**Refresh cadence:** atlas content has **no scheduled refresh**. Updates
land via the review queue (editor edit → server action `updateTag`) or a
one-off agent run. Most sections are mostly static editorial content; the
cost of running a weekly agent over them isn't justified.

**Enum extensions** (already in `packages/database/src/schema.ts`):
- `cleaned_payload_kind` adds `'atlas_section'`, `'atlas_entry'` so atlas
  drafts flow through the same review queue.
- `embedding_entity` adds `'atlas_section'`, `'atlas_entry'` so atlas
  content participates in semantic search.

---

## 6. Workflow / WDK orchestration

The intake agent runs as a **Vercel Workflow**. The user-facing chat
(`/intake`) calls `start()` from a route handler; the workflow streams
output back through `getWritable<UIMessageChunk>()` so `useChat` consumes
it the same way it would consume a plain `streamText` response.

### 6.1 Workflow shape

`"use workflow"` functions run in a sandboxed VM; `"use step"` functions
have full Node.js access. Logic lives in steps; the workflow only
orchestrates.

```
workflow intake(input, intakeRunId, userId, sessionToken)
  step 1  plan         → Plan                              ("use step")
  step 2  scout|deep|luma|eventbrite (parallel where possible) → ScrapedPages
  step 3  clean(plan, scrapes)   → CleanedPayload[]        ("use step")
  step 4  finalize(plan, cleaned)→ Finalize { outcome, redirect }
  step 5  promote (optional)     → INSERT companies|founders|events
  step 6  embed (per promoted)   → embeddings
  step 7  finalise run row       → UPDATE intake_runs SET status, outcome,…
```

The same `clean` / `scout` step functions are imported by the cron
handlers in §11 — workflow, intake API, and admin all share one path.

### 6.2 DurableAgent + streaming to `useChat`

The intake agent is a `DurableAgent` from `@workflow/ai/agent`. It handles
the workflow sandbox automatically (no manual `globalThis.fetch` swap)
and integrates the AI SDK + tool calls inside the workflow.

```ts
// apps/web/app/api/intake/workflows/intake.ts
import { DurableAgent } from "@workflow/ai/agent"
import { getWritable } from "workflow"
import { z } from "zod"
import type { UIMessageChunk } from "ai"
import { SCRAPER_MODELS } from "@buildinaus/agent-engine"
import { scout, deepDive, clean, finalize } from "./steps"

export async function intakeWorkflow(
  input: string,
  intakeRunId: string,
  userId: number | null,
) {
  "use workflow"

  const agent = new DurableAgent({
    model: SCRAPER_MODELS.intake,
    system: "You are the BuildinAus intake agent…",
    tools: {
      scout:    { description: "Fetch a single URL",        inputSchema: z.object({ url: z.string() }), execute: scout },
      deepDive: { description: "Crawl same-origin pages",   inputSchema: z.object({ url: z.string() }), execute: deepDive },
      clean:    { description: "Sanitise into a payload",   inputSchema: z.object({ runId: z.string() }), execute: clean },
      finalize: { description: "Finalise + redirect",       inputSchema: z.object({ runId: z.string() }), execute: finalize },
    },
  })

  const result = await agent.stream({
    messages: [{ role: "user", content: input }],
    writable: getWritable<UIMessageChunk>(), // streams to the run's default stream
    maxSteps: 12,
  })

  // result.messages is the full transcript — persist for rehydration.
  return result.messages
}
```

The route handler reads the workflow's stream and pipes it straight to the
client — `useChat` consumes it as a normal AI SDK message stream:

```ts
// apps/web/app/api/intake/route.ts
import { start } from "workflow/api"
import { intakeWorkflow } from "./workflows/intake"

export async function POST(req: Request) {
  const { input } = await req.json()
  // … rate limit, create intake_runs row …
  const run = await start(intakeWorkflow, [input, intakeRun.id, user?.id ?? null])

  // Persist the workflow id on the run row, then stream back.
  await db.update(intakeRuns)
    .set({ workflowRunId: run.runId })
    .where(eq(intakeRuns.id, intakeRun.id))

  return new Response(run.getReadable(), {
    headers: { "Content-Type": "text/event-stream" },
  })
}
```

### 6.3 Multi-turn chat — `createHook`

For an ongoing conversation in the same run (user asks a follow-up after
the first scrape lands), the workflow stays alive on a hook:

```ts
import { createHook } from "workflow"

const hook = createHook<{ text: string; done?: boolean }>({
  token: `intake:${intakeRunId}`,
})

for await (const turn of hook) {
  const followup = await agent.stream({
    messages: [...result.messages, { role: "user", content: turn.text }],
    writable: getWritable<UIMessageChunk>(),
  })
  if (turn.done) break
}
```

The `/intake/<run_id>` POST handler resumes the hook with the user's next
turn — `resumeHook("intake:<id>", { text })`. One workflow per run handles
arbitrarily many turns without re-planning from scratch.

### 6.4 Why WDK and not just `streamText`

- **Durability across function invocations.** Fluid Compute defaults to
  300s per function (Pro/Enterprise can extend to 800s), but a multi-step
  intake run can exceed even that once we add hooks for human follow-up
  turns. WDK persists progress across invocations, so a run that takes
  minutes of model-bound time and then sits idle on a hook for an hour
  resumes without losing state. `streamText` alone has no such durability.
- **Automatic retry with `"use step"`.** Transient `firecrawl` failures
  retry inside the platform; the workflow doesn't have to re-plan. Failed
  attempts surface as `intake_steps.status = 'errored'` plus a
  `workflow_attempt` increment on the run.
- **Operator observability for free.** The WDK dashboard shows per-step
  duration, retries, payload sizes, and stack traces without us building
  any of it. Pair with `intake_steps` for SQL-queryable rollups (cost by
  step, p95 latency by tool) — see §5.15.
- **Live transport is the workflow's default stream.** `useChat` reads the
  workflow's `getReadable()` directly via the route handler — no extra
  buffering or proxying. `intake_messages` is the **durable transcript**
  for rehydration after the workflow finishes, written from step 7.

### 6.5 Linking back to the run

- `intake_runs.id` is a uuid we generate before `start()`. The workflow
  receives it as an argument and stamps it on every row it writes.
- `intake_runs.workflow_run_id` is set after `start()` returns and is a
  separate column (text). They are **not** the same value — keeping them
  distinct means the schema doesn't depend on WDK's id format and
  preview/prod can run different WDK backends.
- `/intake/<run_id>` resolves on `intake_runs.id` only. The
  `workflow_run_id` is used to deep-link to the WDK dashboard.

---

## 7. Caching tiers

Three layers, each with a clear job:

### 7.1 Cache Components (Next.js 16, request-time)

`use cache` directive on every public read function in `apps/web/lib/data/*`.
Keyed by URL + Cache Components fingerprint, tagged with the entity tags
below. Sub-millisecond hits, automatic per-deployment invalidation.

> **Place `'use cache'` at the function level, not the file top.**
> File-level caches every export — if a `lib/data/*` file ever grows a
> write helper, that helper would silently get cached too. Function-level
> is opt-in per query.

```ts
// apps/web/lib/data/companies.ts
import { cacheLife, cacheTag } from "next/cache"
import { db, companies } from "@buildinaus/database"
import { eq } from "drizzle-orm"

export async function listCompanies({ city }: { city?: string } = {}) {
  "use cache"
  cacheLife("hours")
  cacheTag("companies:list")
  if (city) cacheTag(`city:${city}`)

  return db
    .select()
    .from(companies)
    .where(eq(companies.reviewStatus, "approved"))
}

export async function getCompany(slug: string) {
  "use cache"
  cacheLife("hours")
  cacheTag(`company:${slug}`)
  return db.select().from(companies).where(eq(companies.slug, slug)).limit(1)
}
```

### 7.2 Runtime Cache API (cross-function, per region)

Used by the agent runtime for scrape results and any other cross-function
ephemeral state. Per-region KV with tag-based invalidation that survives
function cold starts.

> **Not `unstable_cache`.** That import is the legacy Next.js Data Cache,
> which Next 16 replaces with the `'use cache'` directive. The Vercel
> Runtime Cache is a different product. Two ways in:
>
> - **`'use cache: remote'`** — Next 16 directive that backs onto Runtime
>   Cache. Use from React server components / server functions where
>   `'use cache'` already applies (see §7.1).
> - **`getCache()` from `@vercel/functions`** — raw API for non-React
>   contexts: workflow steps, cron handlers, plain functions.
>   `packages/agent-engine` ships outside Next's render cycle, so it uses
>   this form.

```ts
// packages/agent-engine/src/fetchers/scout.ts
import { getCache } from "@vercel/functions"
import { sha256 } from "@/lib/hash"

const KEY_VERSION = "v1"
// Bump when the scrape contract changes (e.g. we add a new field to the
// cached value). Old keys age out via TTL — no mass invalidation needed.

const cache = getCache({ namespace: "scrape" })

export async function cachedScout(url: string) {
  const key = `${KEY_VERSION}:${sha256(url)}`
  const hit = await cache.get<ScoutOutput>(key)
  if (hit) return { value: hit, fromCache: true }

  const fresh = await firecrawl.scrape(url)
  const host = new URL(url).host
  await cache.set(key, fresh, {
    ttl: 3600, // see ladder below
    tags: [`scrape:url:${sha256(url)}`, `scrape:domain:${host}`],
  })
  return { value: fresh, fromCache: false }
}
```

**Key format:** keys are namespaced (`scrape:<version>:<sha256(url)>` once
the namespace is applied). Version bumps replace the entire shape; per-URL
purges go through the URL-tag.

**TTL ladder** (set per call site, not globally):

| Surface | TTL | Why |
|---|---|---|
| `scout` (homepage / generic) | 1 h | Tagline / hero copy moves rarely |
| `deepDive` (about/team subpages) | 6 h | Even slower-moving than home |
| `luma` event page | 30 min | Date / RSVP count drift |
| `eventbrite` event page | 30 min | Same |
| favicon / og:image | 7 d | Effectively immutable |

**Tag taxonomy for Runtime Cache:**

| Tag | Purges |
|---|---|
| `scrape:url:<sha256(url)>` | Single URL (e.g. user re-scraped the page) |
| `scrape:domain:<host>` | Everything from `acme.com` (e.g. `acme.com` rebranded) |
| `scrape:v1` | Entire generation (only on schema bump) |

**Two invalidation primitives** (both from `@vercel/functions`):

- `cache.expireTag('scrape:domain:acme.com')` — Runtime Cache only. Use
  from a server action when only the agent layer needs to forget.
- `invalidateByTag('scrape:domain:acme.com')` — Runtime Cache **and**
  CDN/Data caches in one call. Use when re-scraping a domain should also
  drop the public pages that rendered with the old data.

The moderation UI gets a "force re-scrape this domain" button that calls
`invalidateByTag` so both layers stay in sync.

### 7.3 DB cohort cache (durable, cross-deployment)

`tailored_pages` (§5.9). Survives Vercel deployments and Cache Components
purges. Read-through from Cache Components on miss.

### 7.4 Tag taxonomy & invalidation

Cache tags are first-class citizens. The taxonomy below is enforced by
helpers in `apps/web/lib/cache-tags.ts`:

| Tag pattern | Set on read by | Invalidated on |
|---|---|---|
| `companies:list` | every `listCompanies()` | any company publish |
| `company:${slug}` | `getCompany(slug)` | that company publishes / is edited |
| `city:${slug}` | tailored, lists | any entity in that city publishes |
| `stage:${stage}` | tailored | any company at that stage publishes |
| `industry:${tag}` | tailored | company with that industry publishes |
| `type:${type}` | tailored, founders list | any founder of that type publishes |
| `tailored:fingerprint:${fp}` | tailored page render | direct invalidation of one cohort |
| `founders:list` | every `listFounders()` | any founder publish |
| `founder:${slug}` | `getFounder(slug)` | that founder publishes / is edited |
| `events:list`, `event:${slug}` | analogous | analogous |
| `jobs:list`, `job:${slug}` | analogous | analogous |
| `intake_run:${id}` | `/intake/<id>` rehydration | promoting a draft from this run, run finalisation |
| `user:${id}` | `/me`, `curated_configs` reads | profile edit, curation change |
| `draft_queue` | `/admin/queue` | any `cleaned_payloads` insert / status change |
| `embedding:${kind}:${id}` | "similar to this" rails | re-embed of that entity (busts only the rail, not the parent page) |
| `atlas` | every atlas read | atlas-wide invalidation (component catalog change, mass refresh) |
| `atlas:${citySlug}` | `/atlas/<city>` page render | any section in that city publishes / changes |
| `atlas:${citySlug}:${sectionSlug}` | section-level cache | edits to that one section |
| `atlas_entry:${id}` | individual entry render in list sections | edits to that entry |
| `scrape:${sha256(url)}` | scout/deepDive | manual purge |

**`revalidateTag` vs `updateTag` — pick one deliberately:**

- **`revalidateTag(tag, 'max')`** — stale-while-revalidate. **Default for
  every write path** (`promote`, embed step, cron recomputes). Background
  revalidation; the user issuing the write is *not* waiting on it.
- **`updateTag(tag)`** — immediate, same-request fresh. **Server actions
  only.** Use only when the writing user must see their own change on
  the next render of *this* request — i.e., curation save in
  `/p/[slug]` editor flips `curated_configs.layout`, then re-renders
  the page in the same response.

**Invalidation hooks** (run inside the `promote()` action, the embed step,
and the cron recompute):

```ts
import { revalidateTag } from "next/cache"

revalidateTag("companies:list", "max")
revalidateTag(`company:${row.slug}`, "max")
revalidateTag(`city:${row.citySlug}`, "max")
revalidateTag(`stage:${row.stage}`, "max")
for (const tag of row.industry) revalidateTag(`industry:${tag}`, "max")
```

**Read-your-own-writes exception** (curation editor):

```ts
"use server"
import { updateTag } from "next/cache"

export async function saveLayout(userId: number, layout: Layout) {
  await db.update(curatedConfigs).set({ layout }).where(eq(curatedConfigs.userId, userId))
  updateTag(`user:${userId}`)  // immediate — next render in this action sees fresh
}
```

---

## 8. Anti-abuse — BotID + Upstash rate limiting

**Two layers, different jobs.** BotID catches headless / scripted clients
(no human). Upstash rate-limits human traffic by IP. Both run on every
anonymous `POST /api/intake`; the bot check is cheap so it goes first.

### 8.1 BotID — block headless clients

Vercel BotID detects bots without CAPTCHAs and surfaces a verdict on the
request. Reject early so the workflow never starts and AI Gateway spend
stays clean.

```ts
// apps/web/app/api/intake/route.ts
import { checkBotId } from "botid/server"

export async function POST(req: Request) {
  const verdict = await checkBotId()
  if (verdict.isBot) {
    return Response.json({ error: "bot_blocked" }, { status: 403 })
  }
  // … then session check + rate limit + start workflow
}
```

### 8.2 Upstash rate limit

Anonymous users are capped at **2 intake runs per IP per hour**. Authenticated
users are uncapped (subject to AI Gateway spend monitoring).

Storage: **Upstash Redis** (Marketplace integration). No DB table — rate
limiting in Postgres adds write contention to the hot path and would couple
the limit to a DB round-trip.

```ts
// apps/web/lib/rate-limit.ts
import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

const redis = Redis.fromEnv()

export const intakeAnonymousLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(2, "1 h"),
  analytics: true,
  prefix: "rl:intake:anon",
})
```

```ts
// apps/web/app/api/intake/route.ts
import { headers } from "next/headers"
import { intakeAnonymousLimiter } from "@/lib/rate-limit"

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session) {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown"
    const { success, reset } = await intakeAnonymousLimiter.limit(ip)
    if (!success) {
      return Response.json(
        { error: "Anonymous intake limit reached", reset },
        { status: 429 },
      )
    }
  }

  // ... start workflow
}
```

The IP we rate-limit on is hashed and recorded in `intake_runs.ip_hash` for
post-hoc abuse review, but never used for live limit decisions.

---

## 9. Vercel Blob — assets

`@vercel/blob` is the storage layer for every user-visible image plus the
forensic raw-HTML snapshots from each scrape. URLs are public
(`access: 'public'`) for assets and private for HTML snapshots; uploads are
server-side from `promote()` (when the agent finds a logo) or from
authenticated profile-edit server actions.

**Path convention** (apply everywhere):

```
<entity-plural>/<id-or-slug>/<asset>[-<random>]
```

Examples: `companies/blackbird/logo`, `founders/eliot-park/avatar`,
`events/syd-founders-42/cover`, `scrapes/<sha256(url)>/raw.html`. The random
suffix is added by `put({ addRandomSuffix: true })` for assets so cache
busts work; HTML snapshots are content-addressed (no suffix) so the same
URL always wins on dedup.

**Every Blob URL column gets a paired `*_pathname` column.** The pathname
lets us call `del(pathname)` without re-parsing the URL when an entity is
rejected or replaced.

| Field | Pathname | Where it's set | Where it's read |
|---|---|---|---|
| `companies.logo_blob_url` | `logo_blob_pathname` | agent on promote, owner on edit | list, detail, bento |
| `companies.cover_blob_url` | `cover_blob_pathname` | owner on edit | detail hero |
| `founders.avatar_blob_url` | `avatar_blob_pathname` | agent on promote, claim flow | list, detail, leaderboard |
| `users.avatar_blob_url` | `avatar_blob_pathname` | profile-edit server action | site header |
| `events.cover_blob_url` | `cover_blob_pathname` | agent on promote (lu.ma og:image) | list, detail |
| `scrape_provenance.html_blob_url` | `html_blob_pathname` | scout/deepDive on cache miss | `/admin/runs/<id>` "what the agent saw" |
| `intake_runs.transcript_blob_url` | `transcript_blob_pathname` | nightly archive sweep (long transcripts) | rehydration path |

**Upload pattern** (server action):

```ts
"use server"

import { put } from "@vercel/blob"
// ...

export async function uploadCompanyLogo(companyId: number, file: File) {
  const blob = await put(`companies/${companyId}/logo`, file, {
    access: "public",
    addRandomSuffix: true,
  })

  await db.update(companies)
    .set({ logoBlobUrl: blob.url, updatedAt: new Date() })
    .where(eq(companies.id, companyId))

  revalidateTag(`company:${slug}`, "max")
  revalidateTag("companies:list", "max")
}
```

**Agent-side upload** (inside the WDK promote step):

```ts
// packages/agent-engine/src/tools/promote.ts
import { put } from "@vercel/blob"

if (cleaned.logoUrl) {
  const res = await fetch(cleaned.logoUrl)
  const buf = await res.arrayBuffer()
  const blob = await put(
    `companies/${slug}/logo`,
    new Blob([buf], { type: res.headers.get("content-type") ?? "image/png" }),
    { access: "public" },
  )
  insertValues.logoBlobUrl = blob.url
}
```

---

## 10. Search & recommendations

Two complementary paths:

### 10.1 Keyword (tsvector) — exact matches, fast

For "harbour" / "Blackbird" lookups in the command bar — pure keyword.
Generated columns on `companies.name`, `founders.name`, `events.title`,
`jobs.title` with a GIN index. No embedding round-trip.

```sql
-- emitted in a custom migration since drizzle-kit doesn't generate tsvector cols cleanly
ALTER TABLE companies
  ADD COLUMN search_tsv tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(name,'')), 'A') ||
    setweight(to_tsvector('english', coalesce(tagline,'')), 'B') ||
    setweight(to_tsvector('english', coalesce(description,'')), 'C')
  ) STORED;

CREATE INDEX companies_search_idx ON companies USING gin (search_tsv);
```

### 10.2 Semantic (pgvector) — fuzzy, intent-aware

For "climate founders" / "anyone working on robotics in Melbourne" —
embedding-based. See §5.8 for the table and read path.

### 10.3 Hybrid (recommended for the command bar)

Run both, then merge by score. Keyword wins for exact name matches; semantic
wins for thematic queries. The Vercel showcase moment is doing this in a
single Drizzle query plan — Postgres + pgvector means no separate search
service.

```ts
// apps/web/lib/data/search.ts (sketch)
const [keyword, semantic] = await Promise.all([
  db.execute(sql`/* tsvector match against companies, founders, events, jobs, atlas_sections, atlas_entries */`),
  semanticSearch(query, ["company", "founder", "event"]),
])

return mergeAndRank({ keyword, semantic })
```

---

## 11. Scheduled refresh — Vercel Cron Jobs

Different data has different freshness needs. Each refresh concern gets its
own cron entry in `vercel.json` pointing at `/api/cron/<job>/route.ts`.
Routes are guarded by Vercel's `CRON_SECRET` header check so they can't be
hit from the public internet.

```jsonc
// vercel.json
{
  "crons": [
    { "path": "/api/cron/recompute-trust",     "schedule": "0 17 * * *"  }, // 03:00 AEST
    { "path": "/api/cron/refresh-events",      "schedule": "0 */2 * * *" }, // every 2h, dispatcher
    { "path": "/api/cron/check-job-postings",  "schedule": "0 18 * * *"  }, // 04:00 AEST
    { "path": "/api/cron/refresh-companies",   "schedule": "0 19 * * 0"  }, // weekly, Sun 05:00 AEST
    { "path": "/api/cron/sweep-tailored",      "schedule": "30 17 * * *" }, // 03:30 AEST
    { "path": "/api/cron/sweep-rate-limit",    "schedule": "0 0 1 * *"   }  // monthly, analytics export
  ]
}
```

| Job | Cadence | What it does | How it picks rows |
|---|---|---|---|
| `recompute-trust` | nightly | Re-runs trust signals for every company; updates `trust_signals.score` and the cached `companies.trust_score` | Full sweep — cheap, all companies |
| `refresh-events` | every 2h | Re-fetches events whose `next_refresh_at <= now()`; updates `starts_at`, `venue`, `rsvp_count`, cancellation status. Re-computes the next refresh window per the table in §5.6 | `WHERE next_refresh_at <= now()` (partial index) |
| `check-job-postings` | nightly | HEAD-checks `apply_url` for open jobs; flips `closed_at = now()` on 404/410 | `WHERE closed_at IS NULL` |
| `refresh-companies` | weekly | Re-scrapes verified company homepages (via the same scout step a fresh intake would use) to catch tagline/stage drift; emits a `cleaned_payload` if material changes detected (review-gated, doesn't auto-update) | `WHERE verified = true` |
| `sweep-tailored` | nightly | Deletes `tailored_pages` rows where `expires_at < now() - interval '7 days'` (keeps recent expired entries for warm regen) | `WHERE expires_at < now() - 7d` |
| `sweep-rate-limit` | monthly | Exports Upstash analytics into a small `rate_limit_summary` table (or just logs) so we have a record of throttling activity | (Upstash → log) |

**Pattern for each cron route** — every job is a thin wrapper around
existing logic so cron is a *trigger*, not a code path of its own:

```ts
// apps/web/app/api/cron/refresh-events/route.ts
import { headers } from "next/headers"
import { db, events } from "@buildinaus/database"
import { lte, sql } from "drizzle-orm"
import { refreshEvent } from "@/lib/data/events" // the same helper used by /admin

export async function GET() {
  const auth = (await headers()).get("authorization")
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 })
  }

  const due = await db
    .select({ id: events.id })
    .from(events)
    .where(lte(events.nextRefreshAt, sql`now()`))
    .limit(50) // bounded so we never blow the function ceiling

  const results = await Promise.allSettled(due.map((r) => refreshEvent(r.id)))
  return Response.json({
    attempted: results.length,
    failed: results.filter((r) => r.status === "rejected").length,
  })
}
```

**Refresh-period semantics.** Static-ish data (company name, founder bio,
job title) doesn't auto-refresh — the agent re-checks on a slow weekly cron
and only proposes changes via the review queue (no silent overwrites).
Time-sensitive data (event date, RSVP count, trust score) refreshes on the
faster cadences above and writes through directly. The principle: **if a
human authored it, the cron proposes; if the agent / external source is the
authority, the cron writes**.

**`next_refresh_at` columns** (set by the relevant cron after each refresh):

| Table | Column | Set when |
|---|---|---|
| events | `next_refresh_at` | on insert and after each `refresh-events` pass; null once `starts_at` is past |
| companies | `next_refresh_at` (future) | once `verified = true` rows outgrow a full sweep; index-driven `WHERE next_refresh_at <= now()` |
| jobs | `next_refresh_at` (future) | once open-job count outgrows a full sweep; same pattern |

Companies and jobs use full-sweep crons today (`WHERE verified = true` /
`WHERE closed_at IS NULL`). The columns are listed above so the index-driven
upgrade is a column add + cron tweak, not a schema migration.

**No `cron_runs` table.** Each cron route writes structured log lines and
relies on the Vercel **Cron Jobs dashboard + Runtime Logs**. SQL-queryable
job history is overkill until we have multiple operators wanting to query
across crons. If we add it later, mirror the `intake_steps` shape (§5.15) —
audit-only, append-only, no source-of-truth role.

---

## 12. Indexes summary

| Table | Index | Used by |
|---|---|---|
| users | `(slug)` unique, `(auth_subject_id)` unique, `(email)` unique | profile lookup, auth bridge |
| users | `(role, city_slug)` | leaderboards |
| companies | `(slug)` unique, `(city_slug)`, `(stage)` | list filters, detail |
| companies | `(verified, published_at)` | "verified, recent" feed |
| companies | `(review_status, published_at DESC)` | public list filter |
| companies | GIN on `search_tsv` | keyword search |
| founders | `(slug)` unique, `(type)`, `(city_slug)`, `(user_id)` | list filters, claimed lookup |
| company_founders | `(company_id)`, `(founder_id)` | bidirectional joins |
| jobs | `(company_id)`, `(city_slug)`, `(posted_at)` | list, company detail |
| jobs | partial `WHERE closed_at IS NULL` | "open jobs" |
| events | `(city_slug, starts_at)` | "next events in Sydney" |
| events | partial `(next_refresh_at) WHERE next_refresh_at IS NOT NULL` | refresh-events cron sweep |
| embeddings | `(entity_kind, entity_id)` unique | upsert |
| embeddings | HNSW on `embedding_half` (halfvec, cosine) | semantic search |
| tailored_pages | PK `(fingerprint)` | cohort cache lookup |
| intake_runs | `(user_id, started_at)`, `(session_token)`, `(status, started_at)` | history, anon return, queue |
| intake_runs | `(workflow_status, started_at)` | "what's stuck in WDK" admin view |
| intake_messages | `(run_id, id)` | transcript rehydration |
| intake_steps | `(run_id, started_at)`, `(step_name, started_at)` | per-run trace, cost-by-step rollups |
| cleaned_payloads | `(status, kind, created_at)` | moderation queue |
| scrape_provenance | `(run_id)`, `(url, fetched_at)`, `(content_hash)` | audit, dedupe |
| trust_signals | PK `(company_id)` | join to companies |
| atlas_sections | unique `(city_slug, slug)`, `(city_slug, order_index)` | per-city render in order, slug lookup |
| atlas_sections | `(review_status, published_at)` | public list filter |
| atlas_sections | GIN on `search_tsv` | keyword search across atlas |
| atlas_entries | `(section_id, order_index)`, `(linked_kind, linked_id)` | render in order, cross-link to companies/founders |
| atlas_entries | GIN on `search_tsv` | keyword search across atlas items |

---

## 13. Migration plan

**Order matters** — FKs require parents to exist first.

> **Destructive ops are safe in preview, not in prod.** Each step below
> that drops or renames a table is run on a Neon branch attached to a
> preview deployment first; merging to prod runs the same steps against
> the prod branch only after we've confirmed a backfill path. **Step 2
> (drop `users`) is the only step that's destructive today** and is safe
> only because no prod row exists yet. The moment any environment carries
> a real `users` row, replace step 2 with an additive migration:
> `ALTER TABLE users ADD COLUMN auth_subject_id …`, populate, then drop
> the columns we no longer need. Same principle applies to the
> `startups → companies` rename in step 3.1 — preview = drop+recreate,
> prod = `ALTER TABLE … RENAME` once volume exists.

0. **Enable Cache Components.** In `apps/web/next.config.ts`, set
   `cacheComponents: true`. Required before any `'use cache'` directive
   in §7.1 / §7.2 has effect — without it, queries silently bypass the
   cache and tag invalidation is a no-op. Drop any legacy
   `experimental.ppr` or `dynamic = 'force-dynamic'` exports while
   you're here (Cache Components supersedes both).
1. **Extensions.** `CREATE EXTENSION IF NOT EXISTS vector;` (one-time SQL).
2. **`users`.** Drop the existing placeholder. Recreate per §5.1.
   *(Safe today; see callout above for the day-one-of-real-users path.)*
3. **Core entities, in order:**
   1. `companies` (rename from `startups`; add new columns + provenance)
   2. `founders`
   3. `company_founders`
   4. `jobs`
   5. `events`
4. **`trust_signals`.** Backfill `domain_age_days` / `score` from existing
   `companies` columns; companies' cached `trust_score` mirrors going forward.
5. **`embeddings`.** Create table; HNSW index on the halfvec shadow column
   lands in the post-push custom SQL (§13 step 9 / `migrations/0001_post_push.sql`).
6. **`tailored_pages`.** Create.
7. **`curated_configs`.** Already exists — add `auto_curated` column, tighten
   FK.
8. **Intake tables, in order:**
   1. `intake_runs`
   2. `intake_messages`
   3. `intake_steps`
   4. `cleaned_payloads`
   5. `scrape_provenance`
9. **CHECK constraints** that drizzle-kit doesn't emit cleanly:
   - `intake_runs_one_resource` (at most one `resource_*_id` set)
   - `cleaned_payloads_one_applied` (at most one `applied_*_id` set)
10. **Search columns:** `companies.search_tsv` (+GIN), and equivalents on
    `founders`, `events`, `jobs`.
11. **Seed.** Port `apps/web/lib/fixtures.ts` into
    `packages/database/src/seed.ts`. Each fixture insert goes through the
    join tables (companies → company_founders → founders) and seeds Blob
    placeholders (real Blob URLs uploaded via a one-shot script under
    `packages/database/scripts/seed-blob.ts`).
12. **Wire WDK.** Convert `packages/agent-engine` tools into a workflow
    (`apps/web/app/api/intake/route.ts` enqueues the workflow; the workflow
    calls existing tool execute functions as steps).
13. **Wire reads.** Replace `lib/data/*.ts` reads of `*_FIXTURES` with
    Drizzle queries filtered by `review_status IN ('approved','editorial')`
    for public surfaces, including `'drafted'` for `/admin/queue`.
14. **Wire cache tags** per §7.4. Add `revalidateTag()` calls to every write
    path: `promote`, manual edits, embed jobs.
15. **Wire rate limit** per §8 in the intake POST handler.
16. **Drop fixtures.** Gated on the search migration: `lib/search.ts` is
    the last fixture consumer (synchronous, client-side via the command
    bar). Convert it to a `/api/search` route handler running the hybrid
    tsvector + pgvector query (§10), then delete `apps/web/lib/fixtures.ts`.
17. **Atlas seed + cutover.** Parse `apps/web/lib/atlas.ts` into
    `cleaned_payloads` rows of kind `'atlas_section'` / `'atlas_entry'`
    (one PR-sized batch). Approve through `/admin/queue` so the existing
    review tooling diffs each section before it lands; on approve,
    `promote()` writes to `atlas_sections` / `atlas_entries`, generates
    embedding rows, and fires `revalidateTag('atlas:${city}')`. When all
    sections are approved, delete `apps/web/lib/atlas.ts` and update
    `app/atlas/[city]/page.tsx` to read via `lib/data/atlas.ts`. The
    `promote()` switch in `apps/web/lib/data/promote.ts` already has
    `'atlas_section'` / `'atlas_entry'` cases stubbed; the writers land
    here.

> Use `db:push` while the schema is fluid; switch to `db:generate` +
> `db:migrate` once any environment has real data we want to preserve.

---

## 14. Deferred (and why)

| Item | Why deferred | Bring back when |
|---|---|---|
| `cities` lookup table | `varchar(32)` slugs are sufficient; no per-city metadata in v1. | We need timezone, regional flags, or a per-city kill switch. |
| `atlas_cities` lookup table | `atlas_sections.city_slug` is `varchar(32)` matching `cities` (deferred above). When timezone / metadata per atlas city is needed, join with `cities`. | We need per-atlas-city metadata beyond what `cities` provides. |
| `audit_log` | Provenance columns (§4) cover the v1 need ("who/what drafted this"). | Editorial volume warrants a real audit trail. |
| Polymorphic `entity_id` on `atlas_items` | Atlas itself is deferred. | When atlas decomposes. |
| Marketplace search service (Typesense / Meilisearch) | pgvector + tsvector is enough; one Postgres demonstrates more Vercel + Neon integration than two services. | Result quality on hybrid search proves insufficient at scale. |
| Vector embeddings for atlas items | Atlas is editorial, not search-ranked. | Atlas decomposes. |
| Per-IP rate limit storage in Postgres | Upstash is the right tool (no hot-path write contention). | Never. |
| `scrape_recipes` (user-supplied selectors) | No user-supplied scrape DSL yet; would run inside Vercel Sandbox for isolation. Persistence is a forward-looking concern. | We let users author selectors / custom scrape recipes. |
| `cron_runs` audit table | Vercel Cron Jobs dashboard + Runtime Logs cover the v1 need. | We have multiple operators querying across cron history. |

---

## 15. Open follow-ups

All v1 follow-ups have been resolved (decisions captured in §3 and the
relevant sections). This section now tracks **post-v1** work that the
schema accommodates but doesn't yet implement.

1. **Curation agent.** `curated_configs.auto_curated` exists; the agent
   that sets it doesn't. Land the column now (already in §5.10), build the
   agent in a follow-up.
2. **Atlas component catalog expansion.** Atlas storage and rendering are
   live in §5.16 / §5.17. Adding components to
   `packages/dashboard-blocks/src/atlas/` is the v2 extension path — new
   components surface in MDX automatically once registered in
   `atlasComponents`, no DB migration needed. The agent's system prompt
   gets the updated catalog when we want it to invoke a new component
   by name (e.g. `<AtlasMap>` for sections with location data).
3. **Re-embedding on model upgrade.** If `SCRAPER_MODELS.embed` ever
   points at a different model (or the current one is superseded), we'll
   need a one-shot job that re-embeds every row, swaps the HNSW index,
   and writes the new model id into `embeddings.model`. Worth a
   `scripts/reembed.ts` skeleton in `packages/database` once the table has
   non-trivial volume — the job is `WHERE model != SCRAPER_MODELS.embed.id`,
   batched.
4. **Companies refresh proposes-only flow.** §11's `refresh-companies`
   cron emits a `cleaned_payload` rather than writing through. The
   reviewer UI for accepting agent-proposed updates to existing rows is
   distinct from the new-entity moderation queue — design when the cron
   produces enough volume to warrant it.
5. **Atlas embedding sweep.** Schema covers it (`embedding_entity` enum
   includes `'atlas_section'` / `'atlas_entry'`) but the writer that
   generates embedding rows on atlas promote isn't wired yet. Lands with
   the atlas `promote()` writer in §13 step 17.
6. **Cohort cache TTL tuning.** `tailored_pages.expires_at` is set
   uniformly today. Cohorts with high-traffic might want longer TTLs;
   stale-while-revalidate could reduce regen latency. Revisit after we
   have real traffic.
7. **Vercel Queues for embed-after-promote.** Today's embed step runs
   inside the workflow (§6.1 step 6), keeping the run alive until the
   embed lands. Once Queues exits beta, swap that step for an enqueue:
   `promote()` returns immediately and a queue worker handles `embed +
   revalidateTag`. Schema impact: none. UX impact: faster `/intake`
   redirect on success.
8. **Vercel Sandbox for user-supplied scrape recipes.** §14 already
   parks `scrape_recipes` as a future table. Sandbox is the runtime —
   each recipe execution gets a Firecracker microVM so a malicious
   selector or AI-generated DOM walker can't reach our function
   environment. No schema change needed beyond §14.
9. **Routing Middleware for `/p/<slug>` cohort resolution.** `/p/[slug]`
   today resolves the founder-slug → fingerprint inside the page. Once
   we want to redirect founder-slugs to a canonical cohort URL
   (`/p/founder::sydney::climate`), Routing Middleware does this before
   Cache Components, so the cache lookup happens on the canonical URL —
   one cache entry serves every founder-slug in the cohort instead of
   one per slug.

---

## 16. Vercel feature → showcase surface (cross-reference)

For demos and stakeholder walkthroughs:

- **AI SDK `streamText` + `useChat`:** open `/intake`, paste any URL.
- **AI SDK `streamObject`:** visit `/p/<role>::<city>::<type>` (cold cache);
  watch the tailored blocks stream in.
- **AI SDK `embed` + pgvector:** type "climate founders" in the command bar.
- **AI Gateway:** Vercel project dashboard → AI Gateway → traffic and cost
  charts populate as soon as `/intake` is hit.
- **WDK:** trigger an `/intake` run, then open the WDK dashboard to inspect
  steps, retries, durations.
- **Cache Components / PPR:** `/companies` page-source → see partial render;
  `revalidateTag` after a publish, watch the page rebuild only the relevant
  block.
- **Runtime Cache API:** run the same scrape twice in `/intake`; second is
  instant via Runtime Cache hit (`scrape_provenance.cache_hit = true`).
- **Vercel Blob:** company / founder cards render Blob-hosted logos and
  avatars.
- **Neon (branching):** Vercel preview deployment for a PR opens a Neon
  branch automatically; auth, runs, and cleaned_payloads live in the branch.
- **Neon Auth:** `/sign-in` passwordless OTP flow.
- **Upstash Ratelimit:** burn through the anonymous quota, see the 429;
  `intake_runs.rate_limit_bucket` records which bucket fired.
- **Edge Config:** flip `flags.intake_enabled` in the Vercel dashboard,
  watch `/intake` 503 within seconds — no deploy.
- **Vercel Cron Jobs:** dashboard shows scheduled runs; logs link back to
  the route handler that ran.
- **AI Gateway observability:** open a run row, click `gateway_request_id`
  → deep-link to the Gateway dashboard for that exact call; `intake_steps`
  shows per-step cost rolled up to the run.
- **Vercel Sandbox** (deferred): future user-authored scrape recipes run
  inside Sandbox; flagged in §14 so the schema doesn't pretend to support
  it yet.

Each item above maps to a concrete table or column in this spec. If a Vercel
feature doesn't have a clear surface here, it isn't being showcased — flag it
during review.

---

## 17. Edge Config — what stays out of Postgres

Edge Config is the home for **read-mostly, low-cardinality platform config**
that the request path needs synchronously. Putting it here (instead of in
Postgres) gives sub-millisecond reads at the edge and lets us flip values
from the Vercel dashboard without a migration or a deploy.

| Key | Shape | Used by | Why not Postgres |
|---|---|---|---|
| `flags.intake_enabled` | `boolean` | `/api/intake` route guard | Operator kill switch; needs to flip in <5s |
| `flags.intake_anon_allowed` | `boolean` | rate-limit branch in `/api/intake` | Same |
| `flags.hybrid_search` | `boolean` | command bar query path | A/B between keyword-only and hybrid |
| `block_registry` | `BlockId[]` | `dashboard-blocks/registry.ts`, `curated_configs.blocks` validation | Allow-list, not user data |
| `scrape_allow_domains` | `string[]` | scout/deepDive guard | Avoids a hot-path DB read on every fetch |
| `scrape_deny_domains` | `string[]` | same | Same |
| `cities` | `Record<CitySlug, { display: string; tz: string }>` | every `citySlug` render | Replaces the deferred `cities` lookup table for v1 |
| `cron.enabled` | `Record<string, boolean>` | each cron route's guard | Disable a single cron without redeploy |
| `gateway.preferred_models` | `Record<Tier, ModelId>` | `packages/agent-engine/src/gateway.ts` | Lets us swap models per tier via dashboard, no rebuild |

**Read pattern:**

```ts
// apps/web/lib/edge-config.ts
import { get } from "@vercel/edge-config"

export async function isIntakeEnabled() {
  return (await get<boolean>("flags.intake_enabled")) ?? true
}
```

**Write pattern:** Vercel dashboard → Edge Config → edit. No code path
writes Edge Config from a request handler — that's a deliberate boundary
to keep reads cacheable and writes auditable.

**Versioning:** when a key's shape changes (e.g. `cities` gets a new field),
introduce a versioned key (`cities.v2`) and migrate readers in the same PR
that ships the producer change. Old key stays until every reader has been
upgraded.

**What does NOT belong here:** anything user-authored (founder profiles,
companies, events), anything that needs SQL queries (lists, joins, filters),
anything that mutates per-request (intake runs, rate-limit counters — the
latter belong in Upstash). If it would benefit from `WHERE`, it's a table.
