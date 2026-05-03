"use client"

import * as React from "react"
import Link from "next/link"
import {
  ArrowUpRight,
  Banknote,
  Briefcase,
  Calendar,
  Flame,
  MapPin,
  Newspaper,
  Star,
  TrendingUp,
  Users,
} from "lucide-react"
import { cn } from "@/lib/utils"

type CityKey = "sydney" | "melbourne" | "brisbane"

const CITIES: { key: CityKey; label: string; tz: string }[] = [
  { key: "sydney", label: "Sydney", tz: "AEDT" },
  { key: "melbourne", label: "Melbourne", tz: "AEDT" },
  { key: "brisbane", label: "Brisbane", tz: "AEST" },
]

type Trending = {
  hero: { name: string; tagline: string; metric: string; metricLabel: string; tag: string }
  raise: { company: string; round: string; amount: string; lead: string; sector: string }
  jobs: { title: string; company: string; location: string; salary: string }[]
  newsletter: { title: string; author: string; readers: string }
  event: { title: string; date: string; venue: string; rsvp: string }
  founder: { name: string; role: string; company: string; quote: string }
  index: { label: string; value: string; delta: string; series: number[] }
}

const DATA: Record<CityKey, Trending> = {
  sydney: {
    hero: {
      name: "Harbour AI",
      tagline: "Voice agents for Australian SMBs — built on Whisper + GPT.",
      metric: "+412%",
      metricLabel: "WoW signups",
      tag: "Series A · AI Infra",
    },
    raise: {
      company: "Reefline",
      round: "Seed",
      amount: "A$8.4M",
      lead: "Blackbird",
      sector: "Climate",
    },
    jobs: [
      { title: "Founding Engineer", company: "Vellum Labs", location: "Surry Hills", salary: "A$180–230k + equity" },
      { title: "Product Designer", company: "Kindred", location: "Remote AU", salary: "A$160–200k" },
      { title: "GTM Lead", company: "Harbour AI", location: "Sydney CBD", salary: "A$170k + 0.4%" },
    ],
    newsletter: {
      title: "The Lighthouse",
      author: "Mara Chen",
      readers: "12,480",
    },
    event: {
      title: "Sydney Founders Drinks #42",
      date: "Thu 14 May · 6:30pm",
      venue: "The Grounds, Alexandria",
      rsvp: "248 going",
    },
    founder: {
      name: "Eliot Park",
      role: "CEO & Co-founder",
      company: "Harbour AI",
      quote:
        "We're hiring three founding engineers and an applied researcher. Sydney is becoming the obvious place to build agent infrastructure.",
    },
    index: {
      label: "Sydney Builder Index",
      value: "1,284",
      delta: "+6.2% MoM",
      series: [40, 44, 41, 48, 53, 51, 58, 62, 60, 66, 72, 78],
    },
  },
  melbourne: {
    hero: {
      name: "Tramline",
      tagline: "Open-source dev tooling for shipping Postgres at scale.",
      metric: "9.4k",
      metricLabel: "GitHub stars",
      tag: "Pre-seed · DevTools",
    },
    raise: {
      company: "Patera Bio",
      round: "Series A",
      amount: "A$22M",
      lead: "Square Peg",
      sector: "Biotech",
    },
    jobs: [
      { title: "Staff Engineer", company: "Tramline", location: "Fitzroy", salary: "A$210–260k + equity" },
      { title: "Head of Growth", company: "Patera Bio", location: "Parkville", salary: "A$200k + 0.3%" },
      { title: "Designer (Founding)", company: "Cellar", location: "Collingwood", salary: "A$150–190k" },
    ],
    newsletter: {
      title: "Yarra Notes",
      author: "Sam Okafor",
      readers: "8,920",
    },
    event: {
      title: "Melbourne AI Tinkerers",
      date: "Wed 20 May · 6:00pm",
      venue: "Higher Order, CBD",
      rsvp: "312 going",
    },
    founder: {
      name: "Priya Naidu",
      role: "Founder",
      company: "Tramline",
      quote:
        "Melbourne's open-source community is the most underrated talent pool in APAC right now. Come build with us.",
    },
    index: {
      label: "Melbourne Builder Index",
      value: "1,061",
      delta: "+4.8% MoM",
      series: [36, 38, 42, 40, 45, 49, 47, 52, 56, 58, 63, 68],
    },
  },
  brisbane: {
    hero: {
      name: "Reefline",
      tagline: "Satellite + sonar data pipelines for ocean climate teams.",
      metric: "+186%",
      metricLabel: "ARR QoQ",
      tag: "Seed · Climate",
    },
    raise: {
      company: "Sunline Robotics",
      round: "Seed",
      amount: "A$5.1M",
      lead: "Tenacious",
      sector: "Robotics",
    },
    jobs: [
      { title: "Robotics Engineer", company: "Sunline", location: "Fortitude Valley", salary: "A$160–200k" },
      { title: "ML Engineer", company: "Reefline", location: "South Bank", salary: "A$170–210k" },
      { title: "Operator-in-Residence", company: "BNE Ventures", location: "Brisbane", salary: "A$140k" },
    ],
    newsletter: {
      title: "Sunline Weekly",
      author: "Jess Whitfield",
      readers: "5,210",
    },
    event: {
      title: "Brisbane Climate Tech Mixer",
      date: "Tue 26 May · 5:30pm",
      venue: "Fishburners BNE",
      rsvp: "128 going",
    },
    founder: {
      name: "Tom Larsen",
      role: "Co-founder",
      company: "Reefline",
      quote:
        "We moved HQ from London to Brisbane for the reef access and the talent. Best decision we made this year.",
    },
    index: {
      label: "Brisbane Builder Index",
      value: "612",
      delta: "+9.1% MoM",
      series: [22, 24, 23, 26, 28, 30, 32, 31, 34, 38, 42, 46],
    },
  },
}

export function TrendingBento() {
  const [city, setCity] = React.useState<CityKey>("sydney")
  const data = DATA[city]

  return (
    <section id="trending" className="relative border-b border-border/60">
      <div className="mx-auto w-full max-w-6xl px-4 py-20 md:px-6 md:py-28">
        {/* Heading */}
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-border/80 bg-card/50 px-2.5 py-1 text-[11px] text-muted-foreground">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-soft-pulse rounded-full bg-chart-1" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-chart-1" />
              </span>
              <span className="font-mono uppercase tracking-wider">Live · updated 12 min ago</span>
            </div>
            <h2 className="text-balance text-3xl font-medium tracking-tight md:text-4xl">
              Trending right now
            </h2>
            <p className="mt-3 text-pretty text-sm leading-relaxed text-muted-foreground md:text-base">
              The companies, raises, hires and conversations moving the Australian ecosystem this
              week — sourced from founder submissions and our editorial team.
            </p>
          </div>

          {/* City switcher */}
          <div
            role="tablist"
            aria-label="City"
            className="inline-flex items-center gap-1 rounded-lg border border-border/80 bg-card/60 p-1 backdrop-blur"
          >
            {CITIES.map((c) => {
              const active = city === c.key
              return (
                <button
                  key={c.key}
                  role="tab"
                  aria-selected={active}
                  onClick={() => setCity(c.key)}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                    active
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <MapPin className="h-3.5 w-3.5" />
                  {c.label}
                  <span
                    className={cn(
                      "font-mono text-[10px] uppercase tracking-wider",
                      active ? "text-background/70" : "text-muted-foreground/70",
                    )}
                  >
                    {c.tz}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Bento grid */}
        <div className="mt-10 grid auto-rows-[minmax(0,1fr)] grid-cols-1 gap-3 sm:grid-cols-2 md:gap-4 lg:grid-cols-6">
          {/* HERO COMPANY — large */}
          <Card className="lg:col-span-4 lg:row-span-2">
            <CardHeader
              icon={<Flame className="h-3.5 w-3.5" />}
              label="Hero company"
              accessory={
                <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                  {data.hero.tag}
                </span>
              }
            />
            <div className="flex flex-1 flex-col justify-end gap-6 p-6 pt-2">
              <div>
                <div className="flex items-center gap-3">
                  <CompanyMark name={data.hero.name} />
                  <div>
                    <div className="text-lg font-medium tracking-tight">{data.hero.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {CITIES.find((c) => c.key === city)?.label} · Featured
                    </div>
                  </div>
                </div>
                <p className="mt-4 max-w-md text-pretty text-base leading-relaxed text-foreground/90">
                  {data.hero.tagline}
                </p>
              </div>

              <div className="flex flex-wrap items-end justify-between gap-6 border-t border-border/60 pt-5">
                <div>
                  <div className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                    {data.hero.metricLabel}
                  </div>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-3xl font-medium tracking-tight tabular-nums">
                      {data.hero.metric}
                    </span>
                    <TrendingUp className="h-4 w-4 text-chart-1" />
                  </div>
                </div>
                <Link
                  href="#"
                  className="inline-flex items-center gap-1.5 rounded-md border border-border/80 bg-muted/40 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-foreground/30"
                >
                  View profile
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </Card>

          {/* INDEX — top right small */}
          <Card className="lg:col-span-2">
            <CardHeader icon={<TrendingUp className="h-3.5 w-3.5" />} label="Builder Index" />
            <div className="flex flex-1 flex-col justify-end gap-3 p-6 pt-2">
              <div className="text-xs text-muted-foreground">{data.index.label}</div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-medium tabular-nums">{data.index.value}</span>
                <span className="text-xs text-chart-1">{data.index.delta}</span>
              </div>
              <Sparkline values={data.index.series} />
            </div>
          </Card>

          {/* RAISE — middle right */}
          <Card className="lg:col-span-2">
            <CardHeader icon={<Banknote className="h-3.5 w-3.5" />} label="Latest raise" />
            <div className="flex flex-1 flex-col justify-between gap-4 p-6 pt-2">
              <div>
                <div className="text-xs text-muted-foreground">{data.raise.sector}</div>
                <div className="mt-1 text-lg font-medium tracking-tight">{data.raise.company}</div>
                <div className="mt-3 inline-flex items-center gap-2 rounded-md border border-border/80 bg-muted/40 px-2 py-1 font-mono text-[11px] text-muted-foreground">
                  {data.raise.round}
                </div>
              </div>
              <div className="flex items-end justify-between border-t border-border/60 pt-4">
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    Amount
                  </div>
                  <div className="text-2xl font-medium tabular-nums">{data.raise.amount}</div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    Led by
                  </div>
                  <div className="text-sm">{data.raise.lead}</div>
                </div>
              </div>
            </div>
          </Card>

          {/* JOBS — wide */}
          <Card className="lg:col-span-3">
            <CardHeader
              icon={<Briefcase className="h-3.5 w-3.5" />}
              label="Hiring this week"
              accessory={
                <Link
                  href="#jobs"
                  className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
                >
                  All jobs →
                </Link>
              }
            />
            <ul className="flex-1 divide-y divide-border/60">
              {data.jobs.map((job) => (
                <li key={job.title} className="group">
                  <Link
                    href="#"
                    className="flex items-center justify-between gap-4 px-6 py-3.5 transition-colors hover:bg-muted/30"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">{job.title}</div>
                      <div className="truncate text-xs text-muted-foreground">
                        {job.company} · {job.location}
                      </div>
                    </div>
                    <div className="hidden shrink-0 font-mono text-[11px] text-muted-foreground sm:block">
                      {job.salary}
                    </div>
                    <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground" />
                  </Link>
                </li>
              ))}
            </ul>
          </Card>

          {/* FOUNDER QUOTE */}
          <Card className="lg:col-span-3">
            <CardHeader icon={<Users className="h-3.5 w-3.5" />} label="Founder spotlight" />
            <div className="flex flex-1 flex-col justify-between gap-5 p-6 pt-2">
              <p className="text-pretty text-[15px] leading-relaxed text-foreground/90">
                {`\u201C${data.founder.quote}\u201D`}
              </p>
              <div className="flex items-center justify-between border-t border-border/60 pt-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-muted/60 font-mono text-xs">
                    {data.founder.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </div>
                  <div>
                    <div className="text-sm font-medium">{data.founder.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {data.founder.role} · {data.founder.company}
                    </div>
                  </div>
                </div>
                <Star className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </Card>

          {/* NEWSLETTER */}
          <Card className="lg:col-span-2">
            <CardHeader icon={<Newspaper className="h-3.5 w-3.5" />} label="Newsletter pick" />
            <div className="flex flex-1 flex-col justify-between gap-4 p-6 pt-2">
              <div>
                <div className="text-lg font-medium tracking-tight">{data.newsletter.title}</div>
                <div className="mt-1 text-xs text-muted-foreground">by {data.newsletter.author}</div>
              </div>
              <div className="flex items-center justify-between border-t border-border/60 pt-4">
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    Readers
                  </div>
                  <div className="text-sm tabular-nums">{data.newsletter.readers}</div>
                </div>
                <Link
                  href="#"
                  className="inline-flex items-center gap-1 text-xs font-medium text-foreground transition-colors hover:text-foreground/80"
                >
                  Subscribe
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </Card>

          {/* EVENT */}
          <Card className="lg:col-span-2">
            <CardHeader icon={<Calendar className="h-3.5 w-3.5" />} label="Upcoming event" />
            <div className="flex flex-1 flex-col justify-between gap-4 p-6 pt-2">
              <div>
                <div className="text-base font-medium leading-snug">{data.event.title}</div>
                <div className="mt-2 text-xs text-muted-foreground">{data.event.venue}</div>
              </div>
              <div className="flex items-center justify-between border-t border-border/60 pt-4">
                <div className="font-mono text-[11px] text-muted-foreground">{data.event.date}</div>
                <div className="rounded-md border border-border/80 bg-muted/40 px-2 py-1 text-[11px] tabular-nums">
                  {data.event.rsvp}
                </div>
              </div>
            </div>
          </Card>

          {/* SUBMIT TILE — last cell */}
          <Card className="group lg:col-span-2 lg:row-span-1 hover:border-foreground/30">
            <Link href="#submit" className="flex h-full flex-col justify-between gap-6 p-6">
              <div>
                <div className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                  Contribute
                </div>
                <div className="mt-3 text-balance text-base font-medium leading-snug">
                  Building something in {CITIES.find((c) => c.key === city)?.label}? Get on the
                  index.
                </div>
              </div>
              <div className="flex items-center justify-between border-t border-border/60 pt-4">
                <span className="text-xs text-muted-foreground">Free · 60 seconds</span>
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border bg-muted/40 transition-colors group-hover:border-foreground/40 group-hover:bg-foreground group-hover:text-background">
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </Link>
          </Card>
        </div>
      </div>
    </section>
  )
}

/* -------------------- Helpers -------------------- */

function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "relative flex flex-col overflow-hidden rounded-xl border border-border/80 bg-card/60 backdrop-blur transition-colors",
        "shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset]",
        className,
      )}
    >
      {children}
    </div>
  )
}

function CardHeader({
  icon,
  label,
  accessory,
}: {
  icon: React.ReactNode
  label: string
  accessory?: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-2 border-b border-border/60 px-6 py-3">
      <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
        <span className="text-foreground/70">{icon}</span>
        {label}
      </div>
      {accessory}
    </div>
  )
}

function CompanyMark({ name }: { name: string }) {
  const initial = name[0]
  return (
    <div className="relative flex h-11 w-11 items-center justify-center rounded-lg border border-border/80 bg-gradient-to-b from-muted/60 to-muted/20 font-mono text-base font-medium">
      {initial}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-lg ring-1 ring-inset ring-foreground/5"
      />
    </div>
  )
}

function Sparkline({ values }: { values: number[] }) {
  const w = 220
  const h = 56
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const step = w / (values.length - 1)
  const points = values
    .map((v, i) => `${i * step},${h - ((v - min) / range) * (h - 6) - 3}`)
    .join(" ")
  const areaPath = `M0,${h} L${points.split(" ").join(" L")} L${w},${h} Z`
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="h-14 w-full"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="spark" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="oklch(0.78 0.16 150)" stopOpacity="0.35" />
          <stop offset="100%" stopColor="oklch(0.78 0.16 150)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#spark)" />
      <polyline
        points={points}
        fill="none"
        stroke="oklch(0.78 0.16 150)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
