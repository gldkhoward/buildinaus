import { Suspense } from "react"
import Link from "next/link"
import { ArrowUpRight, Building2, MapPin, ShieldCheck } from "lucide-react"
import { PageShell, PageHeader, Panel } from "@/components/layout/page-shell"
import { CardGridSkeleton } from "@/components/layout/skeletons"
import { CommandBarTrigger } from "@/components/intake/command-bar-trigger"
import { EmptyListState } from "@/components/layout/empty-state"
import { listCompanies } from "@/lib/data/companies"

export const metadata = {
  title: "Companies — BuildinAus",
  description: "Australian startups indexed on BuildinAus.",
}

export default function CompaniesPage() {
  return (
    <PageShell>
      <PageHeader
        eyebrow="Index"
        title="Companies building in Australia"
        description="A curated index of startups across Sydney, Melbourne, Brisbane and beyond. Verified by domain age, public mentions, and founder signal."
        action={
          <CommandBarTrigger
            prefill="Submit a startup — paste a link or describe the company"
            className="inline-flex items-center gap-1.5 rounded-md border border-border/80 bg-card/60 px-3 py-1.5 text-xs font-medium transition-colors hover:border-foreground/30"
          >
            Submit a startup
            <ArrowUpRight className="h-3.5 w-3.5" />
          </CommandBarTrigger>
        }
      />

      <Suspense fallback={<CardGridSkeleton count={6} />}>
        <CompaniesGrid />
      </Suspense>
    </PageShell>
  )
}

async function CompaniesGrid() {
  const companies = await listCompanies()
  if (companies.length === 0) {
    return (
      <EmptyListState
        icon={<Building2 className="h-4 w-4" />}
        title="No companies indexed yet"
        description="Once founders start submitting and the agent finishes its first crawl, every Australian startup we know about lands here."
        prefill="Submit a startup — paste a link or describe the company"
        actionLabel="Submit a startup"
      />
    )
  }
  return (
    <>
      <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {companies.map((company) => (
          <Panel key={company.slug} className="group hover:border-foreground/30">
            <Link href={`/companies/${company.slug}`} className="flex flex-1 flex-col gap-6 p-6">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border/80 bg-gradient-to-b from-muted/60 to-muted/20 font-mono text-base font-medium">
                    {company.name[0]}
                  </div>
                  <div>
                    <div className="text-base font-medium tracking-tight">{company.name}</div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {company.city}
                    </div>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 rounded-md border border-border/80 bg-muted/40 px-2 py-1 font-mono text-[11px] text-muted-foreground">
                  {company.stage}
                </span>
              </div>

              <p className="text-pretty text-sm leading-relaxed text-foreground/90">
                {company.tagline}
              </p>

              <div className="flex flex-wrap gap-1.5">
                {company.industry.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-md border border-border/60 bg-muted/30 px-2 py-0.5 text-[11px] text-muted-foreground"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <div className="mt-auto flex items-end justify-between border-t border-border/60 pt-4">
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    {company.metric.label}
                  </div>
                  <div className="text-lg font-medium tabular-nums">{company.metric.value}</div>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Trust {company.trustScore}
                </div>
              </div>
            </Link>
          </Panel>
        ))}
      </div>

      <div className="mt-12 flex items-center gap-2 text-xs text-muted-foreground">
        <Building2 className="h-3.5 w-3.5" />
        Showing {companies.length} of {companies.length}. More indexed weekly.
      </div>
    </>
  )
}
