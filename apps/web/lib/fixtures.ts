/**
 * Legacy in-memory fixtures — kept for the client-side search index only.
 *
 * `lib/data/*` no longer reads this; those functions hit Drizzle/Neon. The
 * remaining consumer is `lib/search.ts`, which the command bar imports
 * synchronously. When `/api/search` ships (search migrates to a hybrid
 * tsvector + pgvector query — see `docs/database-schema.md` §10), this
 * file gets deleted alongside the search.ts rewrite.
 */

import type {
  Company,
  Event,
  Founder,
  Job,
} from "@buildinaus/types"

export const COMPANY_FIXTURES: Company[] = [
  {
    slug: "harbour-ai",
    name: "Harbour AI",
    tagline: "Voice agents for Australian SMBs.",
    description:
      "Harbour AI builds production voice agents for service businesses across Australia, fine-tuned on Whisper and shipped on Vercel Functions.",
    city: "Sydney",
    industry: ["AI Infra", "SMB"],
    stage: "Series A",
    founderSlugs: ["eliot-park"],
    trustScore: 86,
    domainAgeDays: 612,
    metric: { label: "WoW signups", value: "+412%" },
  },
  {
    slug: "reefline",
    name: "Reefline",
    tagline: "Satellite + sonar pipelines for ocean climate teams.",
    description:
      "Reefline ingests near-real-time reef telemetry and turns it into structured datasets for climate researchers and insurers.",
    city: "Brisbane",
    industry: ["Climate", "Data"],
    stage: "Seed",
    founderSlugs: ["tom-larsen"],
    trustScore: 74,
    domainAgeDays: 240,
    metric: { label: "ARR QoQ", value: "+186%" },
  },
  {
    slug: "tramline",
    name: "Tramline",
    tagline: "Open-source dev tooling for shipping Postgres at scale.",
    description:
      "Tramline gives platform teams a safe path to large schema changes — branching, shadow traffic, and one-click rollback.",
    city: "Melbourne",
    industry: ["DevTools", "Data"],
    stage: "Pre-seed",
    founderSlugs: ["priya-naidu"],
    trustScore: 81,
    domainAgeDays: 480,
    metric: { label: "GitHub stars", value: "9.4k" },
  },
  {
    slug: "patera-bio",
    name: "Patera Bio",
    tagline: "Computational drug discovery for rare disease.",
    description:
      "Patera Bio uses AlphaFold-derived embeddings to shortlist rare-disease drug candidates, partnered with Walter and Eliza Hall Institute.",
    city: "Melbourne",
    industry: ["Biotech"],
    stage: "Series A",
    founderSlugs: ["mara-chen"],
    trustScore: 90,
    domainAgeDays: 1040,
    metric: { label: "Active programs", value: "7" },
  },
  {
    slug: "sunline-robotics",
    name: "Sunline Robotics",
    tagline: "Autonomous orchard harvesting.",
    description:
      "Sunline builds row-following robotic arms for stone-fruit and citrus orchards across Queensland and NSW.",
    city: "Brisbane",
    industry: ["Robotics", "Agtech"],
    stage: "Seed",
    founderSlugs: ["jess-whitfield"],
    trustScore: 70,
    domainAgeDays: 320,
    metric: { label: "Orchards on contract", value: "14" },
  },
  {
    slug: "vellum-labs",
    name: "Vellum Labs",
    tagline: "Document intelligence for Australian law firms.",
    description:
      "Vellum extracts obligations from contracts at portfolio scale; used by mid-market firms in Sydney and Perth.",
    city: "Sydney",
    industry: ["Legaltech", "AI Infra"],
    stage: "Seed",
    founderSlugs: ["sam-okafor"],
    trustScore: 78,
    domainAgeDays: 410,
    metric: { label: "Pages processed", value: "12.6M" },
  },
]

export const FOUNDER_FIXTURES: Founder[] = [
  {
    slug: "eliot-park",
    name: "Eliot Park",
    role: "CEO & Co-founder",
    companySlug: "harbour-ai",
    city: "Sydney",
    type: "ai-infra",
    bio: "Previously ML lead at Atlassian. Building Harbour AI to put production voice agents in the hands of every Australian SMB.",
    linkedin: "https://www.linkedin.com/in/eliotpark",
  },
  {
    slug: "tom-larsen",
    name: "Tom Larsen",
    role: "Co-founder",
    companySlug: "reefline",
    city: "Brisbane",
    type: "climate",
    bio: "Ex-Met Office, ex-Palantir. Moved Reefline HQ from London to Brisbane for reef access and Queensland's marine-tech talent.",
  },
  {
    slug: "priya-naidu",
    name: "Priya Naidu",
    role: "Founder",
    companySlug: "tramline",
    city: "Melbourne",
    type: "devtools",
    bio: "Maintainer of pg-shadow and pg-branch. Spent four years on platform infra at Culture Amp before starting Tramline.",
  },
  {
    slug: "mara-chen",
    name: "Mara Chen",
    role: "CEO",
    companySlug: "patera-bio",
    city: "Melbourne",
    type: "biotech",
    bio: "PhD in computational biology, Monash. Co-authored four papers on protein-language models before founding Patera.",
  },
  {
    slug: "jess-whitfield",
    name: "Jess Whitfield",
    role: "CEO",
    companySlug: "sunline-robotics",
    city: "Brisbane",
    type: "robotics",
    bio: "Mechatronics engineer. Built Sunline's first prototype at UQ's robotics lab; now operating across 14 orchards.",
  },
  {
    slug: "sam-okafor",
    name: "Sam Okafor",
    role: "Co-founder",
    companySlug: "vellum-labs",
    city: "Sydney",
    type: "ai-infra",
    bio: "Former senior associate at Allens. Started Vellum after watching peers re-read the same clauses every week.",
  },
]

export const JOB_FIXTURES: Job[] = [
  {
    id: "harbour-eng-1",
    title: "Founding Engineer",
    companySlug: "harbour-ai",
    city: "Sydney",
    salary: "A$180–230k + 0.4–0.8%",
    type: "Founding",
    postedAt: "2 days ago",
    description:
      "Lead the agent-runtime team. You'll own latency, voice quality, and the on-call pager for production calls.",
  },
  {
    id: "harbour-gtm-1",
    title: "GTM Lead",
    companySlug: "harbour-ai",
    city: "Sydney",
    salary: "A$170k + 0.4%",
    type: "Full-time",
    postedAt: "5 days ago",
    description:
      "Own pipeline from outbound through close. Strong ICP work already done — your job is to industrialise it.",
  },
  {
    id: "tramline-staff-1",
    title: "Staff Engineer",
    companySlug: "tramline",
    city: "Melbourne",
    salary: "A$210–260k + equity",
    type: "Full-time",
    postedAt: "1 week ago",
    description:
      "Drive the migrations engine. Postgres internals experience expected; wire-protocol work a plus.",
  },
  {
    id: "patera-growth-1",
    title: "Head of Growth",
    companySlug: "patera-bio",
    city: "Melbourne",
    salary: "A$200k + 0.3%",
    type: "Full-time",
    postedAt: "3 days ago",
    description: "Position Patera with academic medical centres in APAC and the EU.",
  },
  {
    id: "sunline-robotics-1",
    title: "Robotics Engineer",
    companySlug: "sunline-robotics",
    city: "Brisbane",
    salary: "A$160–200k",
    type: "Full-time",
    postedAt: "4 days ago",
    description: "Own perception for our row-following arm. ROS2 + RealSense experience.",
  },
  {
    id: "reefline-ml-1",
    title: "ML Engineer",
    companySlug: "reefline",
    city: "Brisbane",
    salary: "A$170–210k",
    type: "Full-time",
    postedAt: "6 days ago",
    description: "Time-series modelling on multi-modal reef telemetry. PyTorch-first stack.",
  },
  {
    id: "vellum-design-1",
    title: "Product Designer",
    companySlug: "vellum-labs",
    city: "Remote AU",
    salary: "A$160–200k",
    type: "Full-time",
    postedAt: "1 week ago",
    description:
      "Design the surface that lawyers actually want to use. Strong systems thinker, comfortable with dense interfaces.",
  },
]

export const EVENT_FIXTURES: Event[] = [
  {
    id: "syd-founders-42",
    title: "Sydney Founders Drinks #42",
    city: "Sydney",
    startsAt: "Thu 14 May · 6:30pm",
    venue: "The Grounds, Alexandria",
    rsvp: 248,
    source: "Lu.ma",
    description:
      "Monthly drinks for working Australian founders. Open to anyone who's shipped in the last 90 days.",
  },
  {
    id: "mel-ai-tinkerers",
    title: "Melbourne AI Tinkerers",
    city: "Melbourne",
    startsAt: "Wed 20 May · 6:00pm",
    venue: "Higher Order, CBD",
    rsvp: 312,
    source: "Lu.ma",
    description: "Lightning demos from Melbourne builders shipping with frontier models.",
  },
  {
    id: "bne-climate-mixer",
    title: "Brisbane Climate Tech Mixer",
    city: "Brisbane",
    startsAt: "Tue 26 May · 5:30pm",
    venue: "Fishburners BNE",
    rsvp: 128,
    source: "Eventbrite",
    description: "Reef, agriculture, and energy founders trading notes over Stone & Wood.",
  },
  {
    id: "syd-devtools-night",
    title: "Sydney DevTools Night",
    city: "Sydney",
    startsAt: "Mon 9 Jun · 6:00pm",
    venue: "Vercel Sydney",
    rsvp: 96,
    source: "Lu.ma",
    description: "Three short demos and an open mic. RSVP closes when seats fill.",
  },
]
