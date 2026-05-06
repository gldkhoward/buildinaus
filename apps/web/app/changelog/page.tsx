import { PageShell, PageHeader, Panel } from "@/components/layout/page-shell"

export const metadata = {
  title: "Changelog — BuildinAus",
  description:
    "What's shipping on BuildinAus — releases, agent improvements, and editorial updates.",
}

interface ChangelogEntry {
  date: string
  title: string
  tag: "Release" | "Improvement" | "Editorial" | "Fix"
  body: string[]
}

const ENTRIES: ChangelogEntry[] = [
  {
    date: "2026-05-03",
    title: "v1.0 — public launch",
    tag: "Release",
    body: [
      "Mobile nav, branded error and 404 pages, OG cards on every detail route.",
      "/me, /me/edit, /me/curated for profile and personalisation.",
      "/admin/queue and /admin/runs/[id] for promoting agent drafts to live rows.",
      "Sitemap, robots, and per-entity metadata so link unfurls and SEO are first-class.",
    ],
  },
  {
    date: "2026-04-12",
    title: "Cache Components",
    tag: "Improvement",
    body: [
      "Every list page now uses use-cache + cache-tags for granular invalidation. Promote a draft and only the affected lists revalidate.",
    ],
  },
  {
    date: "2026-03-22",
    title: "Sydney Atlas",
    tag: "Editorial",
    body: [
      "First city Atlas live. Communities, programs, capital, workspaces, visiting and immigration — all hand-curated, agent-augmented.",
    ],
  },
  {
    date: "2026-02-27",
    title: "Intake agent v2",
    tag: "Release",
    body: [
      "Vercel Workflow + AI Gateway behind the intake bar. Each tool call is a durable, observable step; replay any run from /intake/[runId].",
    ],
  },
]

const TAG_STYLES: Record<ChangelogEntry["tag"], string> = {
  Release: "bg-foreground text-background",
  Improvement: "bg-muted/50 text-foreground",
  Editorial: "bg-muted/40 text-muted-foreground",
  Fix: "bg-destructive/15 text-destructive",
}

export default function ChangelogPage() {
  return (
    <PageShell>
      <PageHeader
        eyebrow="Changelog"
        title="What's shipping"
        description="Releases, agent improvements, editorial milestones, and fixes."
      />

      <div className="mt-10 space-y-3">
        {ENTRIES.map((e) => (
          <Panel key={e.date + e.title} className="p-6">
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <span className="font-mono text-muted-foreground">{e.date}</span>
              <span
                className={`rounded-md px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${TAG_STYLES[e.tag]}`}
              >
                {e.tag}
              </span>
            </div>
            <h2 className="mt-2 text-lg font-medium tracking-tight">
              {e.title}
            </h2>
            <ul className="mt-3 list-inside list-disc space-y-1.5 text-sm text-foreground/90">
              {e.body.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
          </Panel>
        ))}
      </div>
    </PageShell>
  )
}
