import { Suspense } from "react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, ArrowUpRight, Banknote, Clock, MapPin } from "lucide-react"
import { PageShell, Panel, PanelHeader } from "@/components/layout/page-shell"
import { Button } from "@buildinaus/ui/atoms/button"
import {
  DetailHeaderSkeleton,
  DetailBodySkeleton,
} from "@/components/layout/skeletons"
import { getCompany } from "@/lib/data/companies"
import { getJob, listJobs } from "@/lib/data/jobs"

export async function generateStaticParams() {
  const jobs = await listJobs()
  return jobs.map((j) => ({ id: j.id }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const job = await getJob(id)
  if (!job) return { title: "Job not found — BuildinAus" }
  return {
    title: `${job.title} · BuildinAus`,
    description: `${job.type} · ${job.city} · ${job.salary}. ${job.description.slice(0, 140)}`,
  }
}

export default function JobPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  return (
    <PageShell>
      <Link
        href="/jobs"
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3 w-3" />
        All jobs
      </Link>

      <Suspense
        fallback={
          <>
            <DetailHeaderSkeleton />
            <DetailBodySkeleton />
          </>
        }
      >
        <JobDetail params={params} />
      </Suspense>
    </PageShell>
  )
}

async function JobDetail({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const job = await getJob(id)
  if (!job) notFound()
  const company = await getCompany(job.companySlug)

  return (
    <>
      <header className="mt-6 flex flex-col items-start justify-between gap-6 border-b border-border/60 pb-10 md:flex-row md:items-end">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-card/50 px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
            {job.type}
          </div>
          <h1 className="mt-3 text-3xl font-medium tracking-tight md:text-4xl">{job.title}</h1>
          <p className="mt-2 text-sm text-muted-foreground md:text-base">
            {company && (
              <Link href={`/companies/${company.slug}`} className="hover:text-foreground">
                {company.name}
              </Link>
            )}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-3 w-3" />
              {job.city}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Banknote className="h-3 w-3" />
              {job.salary}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-3 w-3" />
              Posted {job.postedAt}
            </span>
          </div>
        </div>

        {job.applyUrl ? (
          <Button asChild className="h-9 rounded-md bg-foreground px-4 text-xs font-medium text-background hover:bg-foreground/90">
            <a href={job.applyUrl} target="_blank" rel="noreferrer noopener">
              Apply
              <ArrowUpRight className="ml-1.5 h-3.5 w-3.5" />
            </a>
          </Button>
        ) : (
          <span className="inline-flex h-9 items-center gap-1 rounded-md border border-border/80 bg-card/60 px-4 text-xs text-muted-foreground">
            Apply via founder
          </span>
        )}
      </header>

      <div className="mt-10 grid gap-3 lg:grid-cols-6">
        <Panel className="lg:col-span-4">
          <PanelHeader label="The role" />
          <p className="p-6 text-pretty text-[15px] leading-relaxed text-foreground/90">
            {job.description}
          </p>
        </Panel>

        {company && (
          <Panel className="lg:col-span-2">
            <PanelHeader label="About the team" />
            <div className="flex flex-1 flex-col justify-between gap-4 p-6">
              <p className="text-pretty text-sm text-foreground/90">{company.tagline}</p>
              <Link
                href={`/companies/${company.slug}`}
                className="inline-flex items-center gap-1 text-xs font-medium text-foreground transition-colors hover:text-foreground/80"
              >
                Company profile
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </Panel>
        )}
      </div>
    </>
  )
}
