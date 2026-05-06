-- Things drizzle-kit doesn't emit cleanly (per docs/database-schema.md §13).
-- Idempotent: every CHECK / INDEX / generated column uses IF NOT EXISTS or
-- ALTER ... ADD CONSTRAINT IF NOT EXISTS so re-running this file is safe.

-- ── 1. CHECK constraints (compound predicates that drizzle-kit doesn't round-trip) ──

ALTER TABLE intake_runs
  DROP CONSTRAINT IF EXISTS intake_runs_one_resource;
ALTER TABLE intake_runs
  ADD CONSTRAINT intake_runs_one_resource CHECK (
    (resource_company_id IS NOT NULL)::int +
    (resource_founder_id IS NOT NULL)::int +
    (resource_event_id   IS NOT NULL)::int <= 1
  );

ALTER TABLE cleaned_payloads
  DROP CONSTRAINT IF EXISTS cleaned_payloads_one_applied;
ALTER TABLE cleaned_payloads
  ADD CONSTRAINT cleaned_payloads_one_applied CHECK (
    (applied_company_id IS NOT NULL)::int +
    (applied_founder_id IS NOT NULL)::int +
    (applied_event_id   IS NOT NULL)::int <= 1
  );

-- ── 2. Partial indexes drizzle-kit's DSL handles awkwardly ──

CREATE INDEX IF NOT EXISTS jobs_open_only
  ON jobs (closed_at)
  WHERE closed_at IS NULL;

CREATE INDEX IF NOT EXISTS events_due_for_refresh
  ON events (next_refresh_at)
  WHERE next_refresh_at IS NOT NULL;

-- ── 3. Tsvector generated columns + GIN indexes for keyword search (§10.1) ──

ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS search_tsv tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(name,        '')), 'A') ||
    setweight(to_tsvector('english', coalesce(tagline,     '')), 'B') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'C')
  ) STORED;

CREATE INDEX IF NOT EXISTS companies_search_idx
  ON companies USING gin (search_tsv);

ALTER TABLE founders
  ADD COLUMN IF NOT EXISTS search_tsv tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(role, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(bio,  '')), 'C')
  ) STORED;

CREATE INDEX IF NOT EXISTS founders_search_idx
  ON founders USING gin (search_tsv);

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS search_tsv tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title,       '')), 'A') ||
    setweight(to_tsvector('english', coalesce(venue,       '')), 'B') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'C')
  ) STORED;

CREATE INDEX IF NOT EXISTS events_search_idx
  ON events USING gin (search_tsv);

ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS search_tsv tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title,       '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'B')
  ) STORED;

CREATE INDEX IF NOT EXISTS jobs_search_idx
  ON jobs USING gin (search_tsv);

-- ── 4. HNSW index on embeddings (cosine, half-precision shadow) ──
--
-- pgvector's ivfflat AND hnsw both cap at 2000 dimensions on the indexed
-- column; text-embedding-3-large is 3072. Standard workaround: store the
-- full vector for exact distance / re-ranking, generate a halfvec shadow,
-- index the shadow. Halfvec recall is ~99% of full precision at half the
-- storage and within hnsw's 4000-dim limit.

ALTER TABLE embeddings
  ADD COLUMN IF NOT EXISTS embedding_half halfvec(3072)
  GENERATED ALWAYS AS (embedding::halfvec(3072)) STORED;

CREATE INDEX IF NOT EXISTS embeddings_cosine_hnsw
  ON embeddings
  USING hnsw (embedding_half halfvec_cosine_ops)
  WITH (m = 16, ef_construction = 64);
