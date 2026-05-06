import { eq } from "drizzle-orm"
import { getDb } from "."
import {
  companies,
  companyFounders,
  events,
  founders,
  jobs,
} from "./schema"

const CITY_MAP = {
  Sydney: "sydney",
  Melbourne: "melbourne",
  Brisbane: "brisbane",
  Perth: "perth",
  Adelaide: "adelaide",
  Canberra: "canberra",
  "Remote AU": "remote",
} as const

type CityDisplay = keyof typeof CITY_MAP

function citySlug(city: CityDisplay): string {
  return CITY_MAP[city]
}

function daysAgo(n: number): Date {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000)
}

const COMPANIES = [
  {
    slug: "harbour-ai",
    name: "Harbour AI",
    tagline: "Voice agents for Australian SMBs.",
    description:
      "Harbour AI builds production voice agents for service businesses across Australia, fine-tuned on Whisper and shipped on Vercel Functions.",
    domain: "harbourai.dev",
    city: "Sydney" as CityDisplay,
    industry: ["AI Infra", "SMB"],
    stage: "Series A" as const,
    trustScore: 86,
    domainAgeDays: 612,
    metricLabel: "WoW signups",
    metricValue: "+412%",
    founderSlugs: ["eliot-park"],
  },
  {
    slug: "reefline",
    name: "Reefline",
    tagline: "Satellite + sonar pipelines for ocean climate teams.",
    description:
      "Reefline ingests near-real-time reef telemetry and turns it into structured datasets for climate researchers and insurers.",
    domain: "reefline.com",
    city: "Brisbane" as CityDisplay,
    industry: ["Climate", "Data"],
    stage: "Seed" as const,
    trustScore: 74,
    domainAgeDays: 240,
    metricLabel: "ARR QoQ",
    metricValue: "+186%",
    founderSlugs: ["tom-larsen"],
  },
  {
    slug: "tramline",
    name: "Tramline",
    tagline: "Open-source dev tooling for shipping Postgres at scale.",
    description:
      "Tramline gives platform teams a safe path to large schema changes — branching, shadow traffic, and one-click rollback.",
    domain: "tramline.dev",
    city: "Melbourne" as CityDisplay,
    industry: ["DevTools", "Data"],
    stage: "Pre-seed" as const,
    trustScore: 81,
    domainAgeDays: 480,
    metricLabel: "GitHub stars",
    metricValue: "9.4k",
    founderSlugs: ["priya-naidu"],
  },
  {
    slug: "patera-bio",
    name: "Patera Bio",
    tagline: "Computational drug discovery for rare disease.",
    description:
      "Patera Bio uses AlphaFold-derived embeddings to shortlist rare-disease drug candidates, partnered with Walter and Eliza Hall Institute.",
    domain: "patera.bio",
    city: "Melbourne" as CityDisplay,
    industry: ["Biotech"],
    stage: "Series A" as const,
    trustScore: 90,
    domainAgeDays: 1040,
    metricLabel: "Active programs",
    metricValue: "7",
    founderSlugs: ["mara-chen"],
  },
  {
    slug: "sunline-robotics",
    name: "Sunline Robotics",
    tagline: "Autonomous orchard harvesting.",
    description:
      "Sunline builds row-following robotic arms for stone-fruit and citrus orchards across Queensland and NSW.",
    domain: "sunline-robotics.com",
    city: "Brisbane" as CityDisplay,
    industry: ["Robotics", "Agtech"],
    stage: "Seed" as const,
    trustScore: 70,
    domainAgeDays: 320,
    metricLabel: "Orchards on contract",
    metricValue: "14",
    founderSlugs: ["jess-whitfield"],
  },
  {
    slug: "vellum-labs",
    name: "Vellum Labs",
    tagline: "Document intelligence for Australian law firms.",
    description:
      "Vellum extracts obligations from contracts at portfolio scale; used by mid-market firms in Sydney and Perth.",
    domain: "vellumlabs.io",
    city: "Sydney" as CityDisplay,
    industry: ["Legaltech", "AI Infra"],
    stage: "Seed" as const,
    trustScore: 78,
    domainAgeDays: 410,
    metricLabel: "Pages processed",
    metricValue: "12.6M",
    founderSlugs: ["sam-okafor"],
  },
]

const FOUNDERS = [
  {
    slug: "eliot-park",
    name: "Eliot Park",
    role: "CEO & Co-founder",
    bio: "Previously ML lead at Atlassian. Building Harbour AI to put production voice agents in the hands of every Australian SMB.",
    city: "Sydney" as CityDisplay,
    type: "ai-infra" as const,
    linkedinUrl: "https://www.linkedin.com/in/eliotpark",
  },
  {
    slug: "tom-larsen",
    name: "Tom Larsen",
    role: "Co-founder",
    bio: "Ex-Met Office, ex-Palantir. Moved Reefline HQ from London to Brisbane for reef access and Queensland's marine-tech talent.",
    city: "Brisbane" as CityDisplay,
    type: "climate" as const,
  },
  {
    slug: "priya-naidu",
    name: "Priya Naidu",
    role: "Founder",
    bio: "Maintainer of pg-shadow and pg-branch. Spent four years on platform infra at Culture Amp before starting Tramline.",
    city: "Melbourne" as CityDisplay,
    type: "devtools" as const,
  },
  {
    slug: "mara-chen",
    name: "Mara Chen",
    role: "CEO",
    bio: "PhD in computational biology, Monash. Co-authored four papers on protein-language models before founding Patera.",
    city: "Melbourne" as CityDisplay,
    type: "biotech" as const,
  },
  {
    slug: "jess-whitfield",
    name: "Jess Whitfield",
    role: "CEO",
    bio: "Mechatronics engineer. Built Sunline's first prototype at UQ's robotics lab; now operating across 14 orchards.",
    city: "Brisbane" as CityDisplay,
    type: "robotics" as const,
  },
  {
    slug: "sam-okafor",
    name: "Sam Okafor",
    role: "Co-founder",
    bio: "Former senior associate at Allens. Started Vellum after watching peers re-read the same clauses every week.",
    city: "Sydney" as CityDisplay,
    type: "ai-infra" as const,
  },
]

const JOBS = [
  {
    slug: "harbour-eng-1",
    title: "Founding Engineer",
    companySlug: "harbour-ai",
    city: "Sydney" as CityDisplay,
    salary: "A$180–230k + 0.4–0.8%",
    type: "Founding" as const,
    daysAgo: 2,
    description:
      "Lead the agent-runtime team. You'll own latency, voice quality, and the on-call pager for production calls.",
  },
  {
    slug: "harbour-gtm-1",
    title: "GTM Lead",
    companySlug: "harbour-ai",
    city: "Sydney" as CityDisplay,
    salary: "A$170k + 0.4%",
    type: "Full-time" as const,
    daysAgo: 5,
    description:
      "Own pipeline from outbound through close. Strong ICP work already done — your job is to industrialise it.",
  },
  {
    slug: "tramline-staff-1",
    title: "Staff Engineer",
    companySlug: "tramline",
    city: "Melbourne" as CityDisplay,
    salary: "A$210–260k + equity",
    type: "Full-time" as const,
    daysAgo: 7,
    description:
      "Drive the migrations engine. Postgres internals experience expected; wire-protocol work a plus.",
  },
  {
    slug: "patera-growth-1",
    title: "Head of Growth",
    companySlug: "patera-bio",
    city: "Melbourne" as CityDisplay,
    salary: "A$200k + 0.3%",
    type: "Full-time" as const,
    daysAgo: 3,
    description: "Position Patera with academic medical centres in APAC and the EU.",
  },
  {
    slug: "sunline-robotics-1",
    title: "Robotics Engineer",
    companySlug: "sunline-robotics",
    city: "Brisbane" as CityDisplay,
    salary: "A$160–200k",
    type: "Full-time" as const,
    daysAgo: 4,
    description: "Own perception for our row-following arm. ROS2 + RealSense experience.",
  },
  {
    slug: "reefline-ml-1",
    title: "ML Engineer",
    companySlug: "reefline",
    city: "Brisbane" as CityDisplay,
    salary: "A$170–210k",
    type: "Full-time" as const,
    daysAgo: 6,
    description: "Time-series modelling on multi-modal reef telemetry. PyTorch-first stack.",
  },
  {
    slug: "vellum-design-1",
    title: "Product Designer",
    companySlug: "vellum-labs",
    city: "Remote AU" as CityDisplay,
    salary: "A$160–200k",
    type: "Full-time" as const,
    daysAgo: 7,
    description:
      "Design the surface that lawyers actually want to use. Strong systems thinker, comfortable with dense interfaces.",
  },
]

// Demo events — anchored to fixed future dates so previews stay coherent.
const EVENTS = [
  {
    slug: "syd-founders-42",
    title: "Sydney Founders Drinks #42",
    city: "Sydney" as CityDisplay,
    startsAt: new Date("2026-05-14T08:30:00Z"), // Thu 14 May 6:30pm AEST
    venue: "The Grounds, Alexandria",
    rsvpCount: 248,
    platform: "Lu.ma" as const,
    platformUrl: "https://lu.ma/syd-founders-42",
    description:
      "Monthly drinks for working Australian founders. Open to anyone who's shipped in the last 90 days.",
  },
  {
    slug: "mel-ai-tinkerers",
    title: "Melbourne AI Tinkerers",
    city: "Melbourne" as CityDisplay,
    startsAt: new Date("2026-05-20T08:00:00Z"), // Wed 20 May 6:00pm AEST
    venue: "Higher Order, CBD",
    rsvpCount: 312,
    platform: "Lu.ma" as const,
    platformUrl: "https://lu.ma/mel-ai-tinkerers",
    description: "Lightning demos from Melbourne builders shipping with frontier models.",
  },
  {
    slug: "bne-climate-mixer",
    title: "Brisbane Climate Tech Mixer",
    city: "Brisbane" as CityDisplay,
    startsAt: new Date("2026-05-26T07:30:00Z"), // Tue 26 May 5:30pm AEST
    venue: "Fishburners BNE",
    rsvpCount: 128,
    platform: "Eventbrite" as const,
    platformUrl: "https://www.eventbrite.com/e/bne-climate-mixer",
    description: "Reef, agriculture, and energy founders trading notes over Stone & Wood.",
  },
  {
    slug: "syd-devtools-night",
    title: "Sydney DevTools Night",
    city: "Sydney" as CityDisplay,
    startsAt: new Date("2026-06-09T08:00:00Z"), // Mon 9 Jun 6:00pm AEST
    venue: "Vercel Sydney",
    rsvpCount: 96,
    platform: "Lu.ma" as const,
    platformUrl: "https://lu.ma/syd-devtools-night",
    description: "Three short demos and an open mic. RSVP closes when seats fill.",
  },
]

async function main() {
  const db = getDb()
  const now = new Date()

  console.log("seeding companies…")
  for (const c of COMPANIES) {
    await db
      .insert(companies)
      .values({
        slug: c.slug,
        name: c.name,
        tagline: c.tagline,
        description: c.description,
        domain: c.domain,
        citySlug: citySlug(c.city),
        stage: c.stage,
        industry: c.industry,
        trustScore: c.trustScore,
        domainAgeDays: c.domainAgeDays,
        verified: true,
        metricLabel: c.metricLabel,
        metricValue: c.metricValue,
        source: "editorial",
        reviewStatus: "approved",
        publishedAt: now,
      })
      .onConflictDoNothing({ target: companies.slug })
  }

  console.log("seeding founders…")
  for (const f of FOUNDERS) {
    await db
      .insert(founders)
      .values({
        slug: f.slug,
        name: f.name,
        role: f.role,
        bio: f.bio,
        citySlug: citySlug(f.city),
        type: f.type,
        linkedinUrl: f.linkedinUrl,
        source: "editorial",
        reviewStatus: "approved",
        publishedAt: now,
      })
      .onConflictDoNothing({ target: founders.slug })
  }

  console.log("seeding company_founders…")
  for (const c of COMPANIES) {
    const [companyRow] = await db
      .select({ id: companies.id })
      .from(companies)
      .where(eq(companies.slug, c.slug))
      .limit(1)
    if (!companyRow) continue

    for (const founderSlug of c.founderSlugs) {
      const [founderRow] = await db
        .select({ id: founders.id })
        .from(founders)
        .where(eq(founders.slug, founderSlug))
        .limit(1)
      if (!founderRow) continue

      await db
        .insert(companyFounders)
        .values({
          companyId: companyRow.id,
          founderId: founderRow.id,
          role: "Co-founder",
          isPrimary: true,
        })
        .onConflictDoNothing()
    }
  }

  console.log("seeding jobs…")
  for (const j of JOBS) {
    const [companyRow] = await db
      .select({ id: companies.id })
      .from(companies)
      .where(eq(companies.slug, j.companySlug))
      .limit(1)
    if (!companyRow) continue

    await db
      .insert(jobs)
      .values({
        slug: j.slug,
        title: j.title,
        description: j.description,
        companyId: companyRow.id,
        citySlug: citySlug(j.city),
        salary: j.salary,
        type: j.type,
        postedAt: daysAgo(j.daysAgo),
        source: "editorial",
        reviewStatus: "approved",
        publishedAt: now,
      })
      .onConflictDoNothing({ target: jobs.slug })
  }

  console.log("seeding events…")
  for (const e of EVENTS) {
    await db
      .insert(events)
      .values({
        slug: e.slug,
        title: e.title,
        description: e.description,
        citySlug: citySlug(e.city),
        startsAt: e.startsAt,
        venue: e.venue,
        rsvpCount: e.rsvpCount,
        platform: e.platform,
        platformUrl: e.platformUrl,
        tags: [],
        source: "editorial",
        reviewStatus: "approved",
        publishedAt: now,
      })
      .onConflictDoNothing({ target: events.slug })
  }

  console.log(
    `seeded: ${COMPANIES.length} companies, ${FOUNDERS.length} founders, ${JOBS.length} jobs, ${EVENTS.length} events`,
  )
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
