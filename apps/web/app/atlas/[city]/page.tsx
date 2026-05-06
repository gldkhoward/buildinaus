import { Suspense } from "react"
import Link from "next/link"
import { notFound } from "next/navigation"
import {
  ArrowLeft,
  ArrowUpRight,
  Compass,
  ExternalLink,
  Sparkles,
} from "lucide-react"
import {
  PageShell,
  Panel,
  PanelHeader,
} from "@/components/layout/page-shell"
import { AtlasCitySwitcher } from "@/components/atlas/atlas-city-switcher"
import { ATLAS_CITIES } from "@/lib/atlas-cities"
import { renderProseSection } from "@/lib/atlas/compile"
import { getAtlasCity } from "@/lib/data/atlas"

export function generateStaticParams() {
  return ATLAS_CITIES.map((c) => ({ city: c.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ city: string }>
}) {
  const { city } = await params
  const data = await getAtlasCity(city)
  if (!data) return {}
  return {
    title: `${data.city} Atlas — BuildinAus`,
    description: data.tagline,
  }
}

export default function CityAtlasPage({
  params,
}: {
  params: Promise<{ city: string }>
}) {
  return (
    <PageShell>
      <Link
        href="/atlas"
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3 w-3" />
        Atlas
      </Link>

      <Suspense fallback={<AtlasCityFallback />}>
        <AtlasCityContent params={params} />
      </Suspense>
    </PageShell>
  )
}

function AtlasCityFallback() {
  return (
    <div className="mt-8 space-y-10">
      <div className="space-y-3">
        <div className="h-8 w-64 animate-pulse rounded-md bg-muted/40" />
        <div className="h-12 w-96 animate-pulse rounded-md bg-muted/40" />
        <div className="h-4 w-full max-w-xl animate-pulse rounded-md bg-muted/40" />
      </div>
      <div className="grid grid-cols-2 gap-px bg-border/60 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 bg-background" />
        ))}
      </div>
      <div className="grid gap-3 lg:grid-cols-6">
        <Panel className="h-64 lg:col-span-4" />
        <Panel className="h-64 lg:col-span-2" />
      </div>
    </div>
  )
}

async function AtlasCityContent({
  params,
}: {
  params: Promise<{ city: string }>
}) {
  const { city } = await params
  const data = await getAtlasCity(city)
  if (!data) notFound()

  return (
    <>
      <header className="mt-4 flex flex-col items-start justify-between gap-6 border-b border-border/60 pb-10 lg:flex-row lg:items-end">
        <div className="max-w-2xl">
          <AtlasCitySwitcher active={data.slug} />
          <h1 className="mt-5 text-balance text-4xl font-medium tracking-tight md:text-5xl">
            The {data.city} Atlas
          </h1>
          <p className="mt-3 text-pretty text-base leading-relaxed text-muted-foreground md:text-[17px]">
            {data.tagline}
          </p>
        </div>

        <PersonaliseCta city={data.city} />
      </header>

      {data.status === "scaffolded" && (
        <div className="mt-6 rounded-xl border border-dashed border-border/80 bg-card/40 p-4 text-sm text-muted-foreground">
          The {data.city} Atlas is being built out. Sections below are seeded —
          full coverage lands as the agent crawls and editors verify.
        </div>
      )}

      {data.stats.length > 0 && (
        <section className="mt-10">
          <div className="grid grid-cols-2 divide-x divide-y divide-border/60 border-x border-y border-border/60 md:grid-cols-4 md:divide-y-0">
            {data.stats.map((s) => (
              <div key={s.label} className="flex flex-col gap-2 px-6 py-6">
                <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                  {s.label}
                </div>
                <div className="text-2xl font-medium tracking-tight tabular-nums md:text-3xl">
                  {s.value}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="mt-10 grid gap-3 lg:grid-cols-6">
        {data.intro && (
          <Panel className="lg:col-span-4">
            <PanelHeader
              icon={<Compass className="h-3.5 w-3.5" />}
              label={`Why ${data.city}`}
            />
            <div className="space-y-4 p-6 text-pretty text-[15px] leading-relaxed text-foreground/90">
              {await renderProseSection(data.intro)}
            </div>
          </Panel>
        )}

        <Panel className={data.intro ? "lg:col-span-2" : "lg:col-span-6"}>
          <PanelHeader label="In this atlas" />
          <ul className="flex-1 divide-y divide-border/60">
            {data.sections.map((s) => {
              const itemCount = s.groups.reduce(
                (n, g) => n + g.items.length,
                0,
              )
              return (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    className="flex items-center justify-between gap-3 px-6 py-3 text-sm transition-colors hover:bg-muted/30"
                  >
                    <span>{s.title}</span>
                    <span className="font-mono text-[11px] text-muted-foreground">
                      {itemCount}
                    </span>
                  </a>
                </li>
              )
            })}
          </ul>
        </Panel>
      </section>

      <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-[1fr_220px] lg:gap-12">
        <div className="space-y-10">
          {data.sections.map((section) => (
            <section
              key={section.id}
              id={section.id}
              className="scroll-mt-24"
            >
              <header className="mb-5">
                <h2 className="text-2xl font-medium tracking-tight md:text-3xl">
                  {section.title}
                </h2>
                {section.blurb && (
                  <p className="mt-2 max-w-2xl text-sm text-muted-foreground md:text-base">
                    {section.blurb}
                  </p>
                )}
              </header>

              <div className="space-y-6">
                {section.groups.map((group, gi) => (
                  <Panel key={gi}>
                    {group.label && <PanelHeader label={group.label} />}
                    {group.blurb && (
                      <p className="px-6 pt-4 text-xs leading-relaxed text-muted-foreground">
                        {group.blurb}
                      </p>
                    )}
                    <ul className="divide-y divide-border/60">
                      {group.items.map((item, ii) => (
                        <li key={ii}>
                          {item.href ? (
                            <a
                              href={item.href}
                              target="_blank"
                              rel="noreferrer"
                              className="group flex items-start justify-between gap-4 px-6 py-3.5 transition-colors hover:bg-muted/30"
                            >
                              <div className="min-w-0">
                                <div className="text-sm font-medium">
                                  {item.label}
                                </div>
                                {item.description && (
                                  <div className="mt-0.5 text-xs text-muted-foreground">
                                    {item.description}
                                  </div>
                                )}
                              </div>
                              <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground" />
                            </a>
                          ) : (
                            <div className="flex items-start justify-between gap-4 px-6 py-3.5">
                              <div className="min-w-0">
                                <div className="text-sm font-medium">
                                  {item.label}
                                </div>
                                {item.description && (
                                  <div className="mt-0.5 text-xs text-muted-foreground">
                                    {item.description}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  </Panel>
                ))}
              </div>
            </section>
          ))}
        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-32">
            <div className="mb-3 font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              Sections
            </div>
            <ul className="space-y-1.5">
              {data.sections.map((s) => (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    className="block rounded-md px-2 py-1 text-sm text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
                  >
                    {s.title}
                  </a>
                </li>
              ))}
            </ul>

            <div className="mt-8 rounded-lg border border-border/60 bg-card/50 p-4">
              <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                Updated
              </div>
              <div className="mt-1 text-xs text-foreground/80">
                {formatDate(data.lastUpdated)}
              </div>
              <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
                Atlas entries are agent-curated and editor-verified. Spot
                something missing? Paste a link in the command bar and the IRA
                agent will categorise it.
              </p>
            </div>
          </div>
        </aside>
      </div>

      <section className="mt-16 rounded-xl border border-border/80 bg-card/60 p-6 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-card/50 px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
          <Sparkles className="h-3 w-3" />
          Personalise
        </div>
        <h3 className="mt-3 text-balance text-xl font-medium tracking-tight md:text-2xl">
          Want a version of {data.city} written for your stage and role?
        </h3>
        <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">
          Sign in and we'll generate a one-pager that filters this atlas down to
          what matters for an AI-infra founder, a robotics PhD, or a designer
          looking for their next role.
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/sign-in"
            className="inline-flex h-9 items-center rounded-md bg-foreground px-4 text-xs font-medium text-background transition-colors hover:bg-foreground/90"
          >
            Sign in for personalised atlas
            <ArrowUpRight className="ml-1.5 h-3.5 w-3.5" />
          </Link>
          <Link
            href="/p/eliot-park"
            className="inline-flex h-9 items-center rounded-md border border-border/80 bg-card/60 px-4 text-xs font-medium transition-colors hover:border-foreground/30"
          >
            Preview a sample one-pager
          </Link>
        </div>
      </section>
    </>
  )
}

function PersonaliseCta({ city }: { city: string }) {
  return (
    <div className="rounded-xl border border-border/80 bg-card/60 p-4 backdrop-blur">
      <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
        <Sparkles className="h-3 w-3" />
        Personalise
      </div>
      <p className="mt-2 max-w-xs text-sm text-foreground/90">
        Get this {city} atlas filtered to your role and stage.
      </p>
      <Link
        href="/sign-in"
        className="mt-3 inline-flex h-8 items-center rounded-md bg-foreground px-3 text-xs font-medium text-background hover:bg-foreground/90"
      >
        Sign in
        <ArrowUpRight className="ml-1.5 h-3.5 w-3.5" />
      </Link>
    </div>
  )
}

function formatDate(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime()) || d.getTime() === 0) return "—"
  return d.toLocaleDateString("en-AU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}
