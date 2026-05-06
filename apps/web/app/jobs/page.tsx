import { Suspense } from "react"
import Link from "next/link"
import { ArrowUpRight, Briefcase, Clock, MapPin } from "lucide-react"
import { PageShell, PageHeader, Panel, PanelHeader } from "@/components/layout/page-shell"
import { ListRowsSkeleton } from "@/components/layout/skeletons"
import { CommandBarTrigger } from "@/components/intake/command-bar-trigger"
import { EmptyListState } from "@/components/layout/empty-state"
import { listCompanies } from "@/lib/data/companies"
import { listJobs } from "@/lib/data/jobs"

export const metadata = {
  title: "Jobs — BuildinAus",
  description: "Open roles at Australian startups.",
}

export default function JobsPage() {
  return (
    <PageShell>
      <PageHeader
        eyebrow="Hiring"
        title="Roles open this week"
        description="Direct from founders. Each role links back to the team and the company profile."
        action={
          <CommandBarTrigger
            prefill="Post a job — paste the listing URL or describe the role"
            className="inline-flex items-center gap-1.5 rounded-md border border-border/80 bg-card/60 px-3 py-1.5 text-xs font-medium transition-colors hover:border-foreground/30"
          >
            Post a job
            <ArrowUpRight className="h-3.5 w-3.5" />
          </CommandBarTrigger>
        }
      />

      <Suspense fallback={<ListRowsSkeleton count={6} label="loading" />}>
        <JobsList />
      </Suspense>
    </PageShell>
  )
}

async function JobsList() {
  const [jobs, companies] = await Promise.all([listJobs(), listCompanies()])
  if (jobs.length === 0) {
    return (
      <EmptyListState
        icon={<Briefcase className="h-4 w-4" />}
        title="No open roles right now"
        description="When founders post the next round of roles, they'll show up here. Have a listing? Drop the link in and we'll structure it."
        prefill="Post a job — paste the listing URL or describe the role"
        actionLabel="Post a job"
      />
    )
  }
  const companyBySlug = new Map(companies.map((c) => [c.slug, c]))
  const cities = Array.from(new Set(jobs.map((j) => j.city)))

  return (
    <>
      <div className="mt-8 flex flex-wrap items-center gap-2 text-xs">
        <span className="font-mono uppercase tracking-wider text-muted-foreground">Filters:</span>
        {cities.map((city) => (
          <span
            key={city}
            className="inline-flex items-center gap-1 rounded-md border border-border/60 bg-muted/30 px-2 py-1 text-muted-foreground"
          >
            <MapPin className="h-3 w-3" />
            {city}
          </span>
        ))}
      </div>

      <Panel className="mt-8">
        <PanelHeader
          icon={<Briefcase className="h-3.5 w-3.5" />}
          label={`${jobs.length} open roles`}
        />
        <ul className="divide-y divide-border/60">
          {jobs.map((job) => {
            const company = companyBySlug.get(job.companySlug)
            return (
              <li key={job.id} className="group">
                <Link
                  href={`/jobs/${job.id}`}
                  className="flex items-center justify-between gap-4 px-6 py-4 transition-colors hover:bg-muted/30"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{job.title}</span>
                      <span className="rounded-md border border-border/60 bg-muted/30 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                        {job.type}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      {company && <span className="text-foreground/80">{company.name}</span>}
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {job.city}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {job.postedAt}
                      </span>
                    </div>
                  </div>
                  <div className="hidden shrink-0 font-mono text-[11px] text-muted-foreground sm:block">
                    {job.salary}
                  </div>
                  <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground" />
                </Link>
              </li>
            )
          })}
        </ul>
      </Panel>
    </>
  )
}
