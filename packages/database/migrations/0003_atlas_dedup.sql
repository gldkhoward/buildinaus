-- Dedup atlas_entries by (section_id, name), keep the lowest id per pair.
-- Then add a unique constraint so the bulk-promote → re-seed flow can't
-- duplicate again. Idempotent.

DELETE FROM atlas_entries a
USING atlas_entries b
WHERE  a.section_id = b.section_id
  AND  a.name       = b.name
  AND  a.id > b.id;

ALTER TABLE atlas_entries
  DROP CONSTRAINT IF EXISTS atlas_entries_section_name_unique;
ALTER TABLE atlas_entries
  ADD CONSTRAINT atlas_entries_section_name_unique UNIQUE (section_id, name);
