-- Atlas migration: post-push custom SQL for §5.16 / §5.17.
-- Idempotent — safe to re-run.

-- ── 1. Replace the cleaned_payloads CHECK to cover atlas applied_*_id columns ──

ALTER TABLE cleaned_payloads
  DROP CONSTRAINT IF EXISTS cleaned_payloads_one_applied;
ALTER TABLE cleaned_payloads
  ADD CONSTRAINT cleaned_payloads_one_applied CHECK (
    (applied_company_id       IS NOT NULL)::int +
    (applied_founder_id       IS NOT NULL)::int +
    (applied_event_id         IS NOT NULL)::int +
    (applied_atlas_section_id IS NOT NULL)::int +
    (applied_atlas_entry_id   IS NOT NULL)::int <= 1
  );

-- ── 2. Tsvector generated columns + GIN indexes for atlas hybrid search ──

ALTER TABLE atlas_sections
  ADD COLUMN IF NOT EXISTS search_tsv tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title,      '')), 'A') ||
    setweight(to_tsvector('english', coalesce(summary,    '')), 'B') ||
    setweight(to_tsvector('english', coalesce(content_md, '')), 'C')
  ) STORED;

CREATE INDEX IF NOT EXISTS atlas_sections_search_idx
  ON atlas_sections USING gin (search_tsv);

ALTER TABLE atlas_entries
  ADD COLUMN IF NOT EXISTS search_tsv tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(name,    '')), 'A') ||
    setweight(to_tsvector('english', coalesce(tagline, '')), 'B')
  ) STORED;

CREATE INDEX IF NOT EXISTS atlas_entries_search_idx
  ON atlas_entries USING gin (search_tsv);
