import { Suspense } from "react"
import Link from "next/link"
import { ArrowUpRight, MapPin, Sparkles, Users } from "lucide-react"
import { PageShell, PageHeader, Panel } from "@/components/layout/page-shell"
import { CardGridSkeleton } from "@/components/layout/skeletons"
import { EmptyListState } from "@/components/layout/empty-state"
import { listCompanies } from "@/lib/data/companies"
import { listFounders } from "@/lib/data/founders"

export const metadata = {
  title: "Founders — BuildinAus",
  description: "Founders shipping in Australia.",
}

const TYPE_LABEL: Record<string, string> = {
  "ai-infra": "AI Infra",
  devtools: "DevTools",
  climate: "Climate",
  biotech: "Biotech",
  robotics: "Robotics",
  consumer: "Consumer",
}

export default function FoundersPage() {
  return (
    <PageShell>
      <PageHeader
        eyebrow="Index"
        title="Founders shipping in Australia"
        description="Click any profile for a tailored one-pager — content blocks adapt to the founder's category, city, and stage."
      />

      <Suspense fallback={<CardGridSkeleton count={6} />}>
        <FoundersGrid />
      </Suspense>
    </PageShell>
  )
}

async function FoundersGrid() {
  // Independent reads — fetch in parallel.
  const [founders, companies] = await Promise.all([listFounders(), listCompanies()])
  if (founders.length === 0) {
    return (
      <EmptyListState
        icon={<Users className="h-4 w-4" />}
        title="No founder profiles yet"
        description="Founders appear here once they're verified. Building something? Drop a link to your site and we'll draft a profile from it."
        prefill="Add a founder profile — paste a LinkedIn URL or describe yourself"
        actionLabel="Add a founder"
      />
    )
  }
  const companyBySlug = new Map(companies.map((c) => [c.slug, c]))

  return (
    <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {founders.map((founder) => {
        const company = companyBySlug.get(founder.companySlug)
        return (
          <Panel key={founder.slug} className="group hover:border-foreground/30">
            <div className="flex flex-1 flex-col gap-5 p-6">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border/80 bg-gradient-to-b from-muted/60 to-muted/20 font-mono text-sm font-medium">
                    {founder.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </div>
                  <div>
                    <div className="text-base font-medium tracking-tight">{founder.name}</div>
                    <div className="text-xs text-muted-foreground">{founder.role}</div>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 rounded-md border border-border/60 bg-muted/30 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  {TYPE_LABEL[founder.type]}
                </span>
              </div>

              <p className="text-pretty text-sm leading-relaxed text-foreground/90 line-clamp-3">
                {founder.bio}
              </p>

              <div className="mt-auto flex items-center justify-between gap-3 border-t border-border/60 pt-4">
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {founder.city}
                  </span>
                  {company && (
                    <Link
                      href={`/companies/${company.slug}`}
                      className="hover:text-foreground"
                    >
                      {company.name}
                    </Link>
                  )}
                </div>
                <Link
                  href={`/founders/${founder.slug}`}
                  className="inline-flex items-center gap-1 text-xs font-medium text-foreground transition-colors hover:text-foreground/80"
                >
                  View
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              <Link
                href={`/p/${founder.slug}`}
                className="inline-flex items-center justify-center gap-1.5 rounded-md border border-border/60 bg-muted/30 px-3 py-2 text-xs font-medium text-foreground/90 transition-colors hover:border-foreground/30 hover:bg-muted/50"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Tailored one-pager
              </Link>
            </div>
          </Panel>
        )
      })}
    </div>
  )
}
