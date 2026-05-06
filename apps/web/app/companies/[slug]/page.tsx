import { Suspense } from "react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, ArrowUpRight, MapPin, ShieldCheck, Sparkles } from "lucide-react"
import { PageShell, Panel, PanelHeader } from "@/components/layout/page-shell"
import {
  DetailHeaderSkeleton,
  DetailBodySkeleton,
} from "@/components/layout/skeletons"
import { getCompany, listCompanies } from "@/lib/data/companies"
import { listFoundersForCompany } from "@/lib/data/founders"
import { listJobsForCompany } from "@/lib/data/jobs"

export async function generateStaticParams() {
  const companies = await listCompanies()
  return companies.map((c) => ({ slug: c.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const company = await getCompany(slug)
  if (!company) return { title: "Company not found — BuildinAus" }
  return {
    title: `${company.name} · BuildinAus`,
    description: company.tagline,
    openGraph: {
      title: `${company.name} · BuildinAus`,
      description: company.tagline,
      type: "profile",
    },
  }
}

export default function CompanyPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  return (
    <PageShell>
      <Link
        href="/companies"
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3 w-3" />
        All companies
      </Link>

      <Suspense
        fallback={
          <>
            <DetailHeaderSkeleton />
            <DetailBodySkeleton />
          </>
        }
      >
        <CompanyDetail params={params} />
      </Suspense>
    </PageShell>
  )
}

async function CompanyDetail({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const company = await getCompany(slug)
  if (!company) notFound()

  // Founders + jobs are independent of each other and of the company body —
  // fetch in parallel.
  const [founders, jobs] = await Promise.all([
    listFoundersForCompany(company.slug),
    listJobsForCompany(company.slug),
  ])

  return (
    <>
      <header className="mt-6 flex flex-col items-start justify-between gap-6 border-b border-border/60 pb-10 md:flex-row md:items-end">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-border/80 bg-gradient-to-b from-muted/60 to-muted/20 font-mono text-2xl font-medium">
            {company.name[0]}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-medium tracking-tight md:text-4xl">{company.name}</h1>
              <span className="inline-flex items-center gap-1 rounded-md border border-border/80 bg-muted/40 px-2 py-1 font-mono text-[11px] text-muted-foreground">
                {company.stage}
              </span>
            </div>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground md:text-base">
              {company.tagline}
            </p>
            <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-3 w-3" />
                {company.city}
              </span>
              <span aria-hidden>·</span>
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="h-3 w-3" />
                Trust score {company.trustScore} / 100
              </span>
              <span aria-hidden>·</span>
              <span>Domain age {Math.round(company.domainAgeDays / 30)} mo</span>
            </div>
          </div>
        </div>
      </header>

      <div className="mt-10 grid gap-3 lg:grid-cols-6">
        <Panel className="lg:col-span-4">
          <PanelHeader icon={<Sparkles className="h-3.5 w-3.5" />} label="About" />
          <div className="p-6 text-pretty text-[15px] leading-relaxed text-foreground/90">
            {company.description}
          </div>
        </Panel>

        <Panel className="lg:col-span-2">
          <PanelHeader label={company.metric.label} />
          <div className="p-6">
            <div className="text-4xl font-medium tabular-nums">{company.metric.value}</div>
            <div className="mt-2 text-xs text-muted-foreground">
              {company.industry.join(" · ")}
            </div>
          </div>
        </Panel>

        <Panel className="lg:col-span-3">
          <PanelHeader label="Founders" />
          {founders.length === 0 ? (
            <div className="p-6 text-sm text-muted-foreground">No founder profiles yet.</div>
          ) : (
            <ul className="divide-y divide-border/60">
              {founders.map((f) => (
                <li key={f.slug}>
                  <Link
                    href={`/founders/${f.slug}`}
                    className="group flex items-center justify-between gap-4 px-6 py-4 transition-colors hover:bg-muted/30"
                  >
                    <div>
                      <div className="text-sm font-medium">{f.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {f.role} · {f.city}
                      </div>
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel className="lg:col-span-3">
          <PanelHeader
            label="Open roles"
            accessory={
              jobs.length > 0 ? (
                <Link
                  href="/jobs"
                  className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground hover:text-foreground"
                >
                  All jobs →
                </Link>
              ) : undefined
            }
          />
          {jobs.length === 0 ? (
            <div className="p-6 text-sm text-muted-foreground">Not currently hiring.</div>
          ) : (
            <ul className="divide-y divide-border/60">
              {jobs.map((job) => (
                <li key={job.id}>
                  <Link
                    href={`/jobs/${job.id}`}
                    className="group flex items-center justify-between gap-4 px-6 py-4 transition-colors hover:bg-muted/30"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">{job.title}</div>
                      <div className="truncate text-xs text-muted-foreground">
                        {job.salary} · {job.city}
                      </div>
                    </div>
                    <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  )
}
