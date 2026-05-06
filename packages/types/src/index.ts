/**
 * Public type surface for BuildinAus.
 *
 * Two layers:
 * - **Value types** (`./values`): string-literal unions and helpers like
 *   `CitySlug`, `City`, `FounderType`, `BlockId`, `cityLabel`. Mirrored
 *   in `@buildinaus/database` (pgEnum values) so both sides stay in sync.
 * - **View types** (this file): app-facing entity shapes consumed by
 *   components. They differ from Drizzle row types — display fields
 *   (`city: City`), denormalised joins (`founderSlugs: string[]`), and
 *   string-formatted timestamps (`postedAt: "2 days ago"`) live here.
 *
 * Drizzle row types (`typeof companies.$inferSelect`, etc.) live in
 * `@buildinaus/database`. The `lib/data/*` translation layer in the web
 * app maps row → view; nothing else should touch row types directly.
 */

import type {
  BlockId,
  City,
  CompanyStage,
  EventSource,
  FounderType,
  JobType,
  UserRole,
} from "./values"

export * from "./values"

/* ── User ─────────────────────────────────────────────────────────────── */

export interface User {
  id: string
  slug: string
  name: string
  email: string
  role: UserRole
  city: City
  headline?: string
  linkedinUrl?: string
  createdAt: Date
}

/* ── Company ──────────────────────────────────────────────────────────── */

export interface Company {
  slug: string
  name: string
  tagline: string
  description: string
  city: City
  industry: string[]
  stage: CompanyStage
  founderSlugs: string[]
  trustScore: number
  domainAgeDays: number
  metric: { label: string; value: string }
}

/* ── Founder ──────────────────────────────────────────────────────────── */

export interface Founder {
  slug: string
  name: string
  role: string
  companySlug: string
  city: City
  type: FounderType
  bio: string
  linkedin?: string
}

/* ── Job ──────────────────────────────────────────────────────────────── */

export interface Job {
  id: string
  title: string
  companySlug: string
  city: City
  salary: string
  type: JobType
  postedAt: string
  description: string
  applyUrl?: string
}

/* ── Event ────────────────────────────────────────────────────────────── */

export interface Event {
  id: string
  title: string
  city: City
  startsAt: string
  venue: string
  rsvp: number
  source: EventSource
  description: string
  platformUrl?: string
}

/* ── Tailored-page personalisation ────────────────────────────────────── */

export interface CuratedConfig {
  id: string
  userId: string
  blocks: BlockId[]
  layout: "grid" | "feed" | "kanban"
  updatedAt: Date
}
