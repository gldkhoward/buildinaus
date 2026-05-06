import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
import {
  PageShell,
  PageHeader,
  Panel,
  PanelHeader,
} from "@/components/layout/page-shell"

export const metadata = {
  title: "About — BuildinAus",
  description:
    "Why BuildinAus exists, who's behind it, and where we're heading next.",
}

const PILLARS = [
  {
    title: "Discoverable",
    body: "Every Australian startup, founder, job, and event in one indexed surface — no LinkedIn-trawling, no random Notion docs.",
  },
  {
    title: "Verified",
    body: "Trust signals (domain age, MX, public mentions) plus a human-reviewed admin queue mean what you see is what's actually shipping.",
  },
  {
    title: "Personalised",
    body: "Tailored one-pagers and curated atlases let founders, operators, and investors filter the index to the cohort they care about.",
  },
]

export default function AboutPage() {
  return (
    <PageShell>
      <PageHeader
        eyebrow="About"
        title="The home of the Australian startup ecosystem"
        description="BuildinAus is an open, agent-curated index of what's being built across Sydney, Melbourne, Brisbane, and beyond. We're trying to make it easier to find — and contribute to — Australian tech."
      />

      <div className="mt-10 grid gap-3 lg:grid-cols-3">
        {PILLARS.map((p) => (
          <Panel key={p.title} className="p-6">
            <h2 className="text-base font-medium tracking-tight">{p.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {p.body}
            </p>
          </Panel>
        ))}
      </div>

      <Panel className="mt-8">
        <PanelHeader label="How it works" />
        <div className="space-y-4 p-6 text-sm leading-relaxed text-foreground/90">
          <p>
            BuildinAus is an editorial-meets-agent index. Founders submit a
            link or a description through the intake bar; an agent classifies
            it, scrapes the source, and produces a structured draft. A human
            review queue checks the draft before publishing — so the index is
            both fast to grow and trustworthy to read.
          </p>
          <p>
            Underneath, the platform runs on Vercel: Fluid Compute, Cache
            Components, AI Gateway, Vercel Workflow for the durable intake
            pipeline, and Neon Postgres + pgvector for storage and embeddings.
            Source for the public site is open and lives in the Turborepo
            monorepo.
          </p>
        </div>
      </Panel>

      <div className="mt-10 flex flex-wrap items-center gap-3 text-sm">
        <Link
          href="/contact"
          className="inline-flex items-center gap-1.5 rounded-md bg-foreground px-4 py-2 text-xs font-medium text-background hover:bg-foreground/90"
        >
          Get in touch
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
        <Link
          href="/changelog"
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          See what's shipping →
        </Link>
      </div>
    </PageShell>
  )
}
