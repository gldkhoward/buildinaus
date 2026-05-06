import { z } from "zod"

// ── Scout / Deep-Diver shared types ─────────────────────────────────────────

export const ScoutLinkSchema = z.object({
  href: z.string(),
  text: z.string().optional(),
})

export const ScoutOutputSchema = z.object({
  url: z.string(),
  page_title: z.string().optional(),
  meta_description: z.string().optional(),
  markdown_content: z.string(),
  detected_links: z.array(ScoutLinkSchema),
  fetched_at: z.string(),
  /**
   * Raw HTML the fetcher saw, when available. Server-side only — strip before
   * returning to the LLM. The intake-tools factory uploads it to Vercel Blob
   * and stores the resulting URL on `scrape_provenance.html_blob_url`.
   */
  raw_html: z.string().optional(),
  /** Underlying provider that produced this snapshot. */
  provider: z.enum(["firecrawl", "fetch"]).optional(),
  /** HTTP status code from the upstream response, when available. */
  http_status: z.number().optional(),
})

export type ScoutOutput = z.infer<typeof ScoutOutputSchema>

export const DeepDiveOutputSchema = z.object({
  root_url: z.string(),
  pages: z.array(ScoutOutputSchema),
  aggregated_markdown: z.string(),
})

export type DeepDiveOutput = z.infer<typeof DeepDiveOutputSchema>

// ── Unified Event schema ────────────────────────────────────────────────────

export const EventSchema = z.object({
  title: z.string(),
  date: z.string().describe("ISO 8601 timestamp"),
  location: z.string(),
  tags: z.array(z.string()),
  source: z.enum(["lu.ma", "eventbrite", "meetup", "other"]),
  url: z.string(),
  ticket_price: z.string().optional(),
  rsvp_count: z.number().optional(),
  description: z.string().optional(),
})

export type Event = z.infer<typeof EventSchema>

// ── Cleaned entity types ────────────────────────────────────────────────────

export const StartupProfileSchema = z.object({
  name: z.string(),
  hq_location: z.string().optional(),
  primary_problem: z.string().optional(),
  description: z.string().optional(),
  industry: z.array(z.string()).default([]),
  founders: z.array(z.string()).default([]),
  links: z
    .object({
      website: z.string().optional(),
      linkedin: z.string().optional(),
      twitter: z.string().optional(),
    })
    .default({}),
})

export type StartupProfile = z.infer<typeof StartupProfileSchema>

export const FounderProfileSchema = z.object({
  name: z.string(),
  headline: z.string().optional(),
  city: z.string().optional(),
  bio: z.string().optional(),
  current_company: z.string().optional(),
  links: z
    .object({
      website: z.string().optional(),
      linkedin: z.string().optional(),
      twitter: z.string().optional(),
    })
    .default({}),
})

export type FounderProfile = z.infer<typeof FounderProfileSchema>

export const CleanedPayloadSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("event"), data: EventSchema }),
  z.object({ type: z.literal("startup"), data: StartupProfileSchema }),
  z.object({ type: z.literal("founder"), data: FounderProfileSchema }),
])

export type CleanedPayload = z.infer<typeof CleanedPayloadSchema>

// ── Plan + finalize types (used by the intake agent) ────────────────────────

export const PlanStepSchema = z.object({
  tool: z
    .enum(["scout", "deepDive", "luma", "eventbrite", "clean", "finalize"])
    .describe("Which tool the agent intends to call for this step."),
  label: z
    .string()
    .describe("One-line human label, e.g. 'Top search of harbourai.dev'."),
  reason: z
    .string()
    .describe("Why this step is needed for the user's request."),
})

export type PlanStep = z.infer<typeof PlanStepSchema>

export const PlanSchema = z.object({
  intent: z.enum([
    "scrape_url",
    "create_startup",
    "create_founder",
    "create_event",
    "search",
    "unknown",
  ]),
  summary: z
    .string()
    .describe("One sentence summary of what the agent is about to do."),
  steps: z.array(PlanStepSchema).min(1).max(8),
})

export type Plan = z.infer<typeof PlanSchema>

export const FinalizeSchema = z.object({
  outcome: z.enum(["created", "drafted", "noop", "error"]),
  redirect_url: z
    .string()
    .optional()
    .describe("Relative path the user can be redirected to, e.g. /companies/foo"),
  resource_kind: z
    .enum(["startup", "founder", "event", "page", "other"])
    .optional(),
  resource_label: z.string().optional(),
  summary_markdown: z.string(),
})

export type Finalize = z.infer<typeof FinalizeSchema>
