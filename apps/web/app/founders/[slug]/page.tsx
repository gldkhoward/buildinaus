import { Suspense } from "react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, ArrowUpRight, ExternalLink, MapPin, Sparkles } from "lucide-react"
import { PageShell, Panel, PanelHeader } from "@/components/layout/page-shell"
import { Button } from "@buildinaus/ui/atoms/button"
import {
  DetailHeaderSkeleton,
  DetailBodySkeleton,
} from "@/components/layout/skeletons"
import { getCompany } from "@/lib/data/companies"
import { getFounder, listFounders } from "@/lib/data/founders"
import { listJobsForCompany } from "@/lib/data/jobs"

export async function generateStaticParams() {
  const founders = await listFounders()
  return founders.map((f) => ({ slug: f.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const founder = await getFounder(slug)
  if (!founder) return { title: "Founder not found — BuildinAus" }
  return {
    title: `${founder.name} · BuildinAus`,
    description: `${founder.role} · ${founder.city}. ${founder.bio.slice(0, 140)}`,
    openGraph: {
      title: `${founder.name} · BuildinAus`,
      description: founder.bio.slice(0, 200),
      type: "profile",
    },
  }
}

export default function FounderPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  return (
    <PageShell>
      <Link
        href="/founders"
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3 w-3" />
        All founders
      </Link>

      <Suspense
        fallback={
          <>
            <DetailHeaderSkeleton />
            <DetailBodySkeleton />
          </>
        }
      >
        <FounderDetail params={params} />
      </Suspense>
    </PageShell>
  )
}

async function FounderDetail({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const founder = await getFounder(slug)
  if (!founder) notFound()

  // Company is needed before we can fetch its jobs — sequential. But the
  // company itself doesn't depend on anything else, so the await chain is
  // optimal.
  const company = await getCompany(founder.companySlug)
  const jobs = company ? await listJobsForCompany(company.slug) : []

  return (
    <>
      <header className="mt-6 flex flex-col items-start justify-between gap-6 border-b border-border/60 pb-10 md:flex-row md:items-center">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border border-border/80 bg-gradient-to-b from-muted/60 to-muted/20 font-mono text-xl font-medium">
            {founder.name
              .split(" ")
              .map((n) => n[0])
              .join("")}
          </div>
          <div>
            <h1 className="text-3xl font-medium tracking-tight md:text-4xl">{founder.name}</h1>
            <p className="mt-1 text-sm text-muted-foreground md:text-base">
              {founder.role}
              {company && (
                <>
                  {" · "}
                  <Link href={`/companies/${company.slug}`} className="hover:text-foreground">
                    {company.name}
                  </Link>
                </>
              )}
            </p>
            <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-3 w-3" />
                {founder.city}
              </span>
              {founder.linkedin && (
                <a
                  href={founder.linkedin}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 hover:text-foreground"
                >
                  LinkedIn
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <Button asChild className="h-9 rounded-md bg-foreground px-4 text-xs font-medium text-background hover:bg-foreground/90">
            <Link href={`/p/${founder.slug}`}>
              <Sparkles className="mr-1.5 h-3.5 w-3.5" />
              View tailored one-pager
            </Link>
          </Button>
          <Link
            href={`/founders/${founder.slug}/claim`}
            className="text-[11px] text-muted-foreground hover:text-foreground"
          >
            Is this you? Claim profile →
          </Link>
        </div>
      </header>

      <div className="mt-10 grid gap-3 lg:grid-cols-6">
        <Panel className="lg:col-span-4">
          <PanelHeader label="About" />
          <p className="p-6 text-pretty text-[15px] leading-relaxed text-foreground/90">
            {founder.bio}
          </p>
        </Panel>

        <Panel className="lg:col-span-2">
          <PanelHeader label="Currently hiring" />
          {jobs.length === 0 ? (
            <div className="p-6 text-sm text-muted-foreground">No open roles right now.</div>
          ) : (
            <ul className="divide-y divide-border/60">
              {jobs.slice(0, 3).map((job) => (
                <li key={job.id}>
                  <Link
                    href={`/jobs/${job.id}`}
                    className="group flex items-center justify-between gap-3 px-6 py-3 transition-colors hover:bg-muted/30"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">{job.title}</div>
                      <div className="truncate text-xs text-muted-foreground">{job.salary}</div>
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
