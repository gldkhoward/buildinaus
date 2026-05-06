/**
 * String-literal types and value helpers.
 *
 * Pure — no package dependencies. Imported by `@buildinaus/database` (where
 * the schema's pgEnum values are mirrored), by `@buildinaus/types` (re-export
 * surface), and by app code that needs to render display labels for slugs.
 */

/* ── Geography ─────────────────────────────────────────────────────────── */

export type CitySlug =
  | "sydney"
  | "melbourne"
  | "brisbane"
  | "perth"
  | "adelaide"
  | "canberra"
  | "remote"

/** Display label for a city — what the UI shows. */
export type City =
  | "Sydney"
  | "Melbourne"
  | "Brisbane"
  | "Perth"
  | "Adelaide"
  | "Canberra"
  | "Remote AU"

const CITY_LABELS: Record<CitySlug, City> = {
  sydney: "Sydney",
  melbourne: "Melbourne",
  brisbane: "Brisbane",
  perth: "Perth",
  adelaide: "Adelaide",
  canberra: "Canberra",
  remote: "Remote AU",
}

/** Convert a city slug to its display label. Falls back to the slug. */
export function cityLabel(slug: string | null | undefined): City | string {
  if (!slug) return ""
  return CITY_LABELS[slug as CitySlug] ?? slug
}

/* ── Roles / categories ────────────────────────────────────────────────── */

export type UserRole =
  | "founder"
  | "operator"
  | "investor"
  | "engineer"
  | "researcher"
  | "student"

export type FounderType =
  | "ai-infra"
  | "devtools"
  | "climate"
  | "biotech"
  | "robotics"
  | "consumer"

export type CompanyStage =
  | "Pre-seed"
  | "Seed"
  | "Series A"
  | "Series B"
  | "Series C+"
  | "Unknown"

export type JobType = "Full-time" | "Contract" | "Founding"

export type EventSource = "Lu.ma" | "Eventbrite" | "Meetup" | "Manual"

/* ── Tailored-page blocks (app-level, not persisted as columns) ────────── */

export type BlockId =
  | "vc-map"
  | "jobs-board"
  | "events-feed"
  | "robotics-labs"
  | "blackbird-grants"
  | "founder-leaderboard"

export interface BlockDefinition {
  id: BlockId
  title: string
  description: string
  defaultProps?: Record<string, unknown>
}
