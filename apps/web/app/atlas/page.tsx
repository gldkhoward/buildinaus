import Link from "next/link"
import { ArrowUpRight, Compass, MapPin } from "lucide-react"
import {
  PageShell,
  PageHeader,
  Panel,
  PanelHeader,
} from "@/components/layout/page-shell"
import { AtlasAutoDetectBanner } from "@/components/atlas/atlas-city-switcher"
import { listAtlasCities } from "@/lib/data/atlas"

export const metadata = {
  title: "Atlas — BuildinAus",
  description:
    "City-level guides to Australia's startup ecosystem. Communities, programs, capital, workspaces, and the spots where founders actually meet.",
}

export default async function AtlasIndexPage() {
  const cities = await listAtlasCities()

  return (
    <PageShell>
      <PageHeader
        eyebrow={
          <span className="inline-flex items-center gap-1.5">
            <Compass className="h-3 w-3" />
            Atlas
          </span>
        }
        title="A working atlas of Australia's startup cities"
        description="Each city is a structured guide — communities, programs, capital, workspaces, and the spots founders actually meet. Curated by the platform, refreshed via the review queue."
      />

      <AtlasAutoDetectBanner />

      <div className="mt-10 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {cities.map((city) => (
          <Panel key={city.slug} className="group hover:border-foreground/30">
            <Link
              href={`/atlas/${city.slug}`}
              className="flex flex-1 flex-col gap-5 p-6"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    {city.state}
                  </div>
                  <h2 className="mt-1 text-2xl font-medium tracking-tight">
                    {city.city}
                  </h2>
                </div>
                {city.status === "scaffolded" && (
                  <span className="rounded-md border border-border/60 bg-muted/30 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    Building
                  </span>
                )}
              </div>
              <p className="text-pretty text-sm leading-relaxed text-foreground/90">
                {city.tagline}
              </p>
              <div className="mt-auto flex items-end justify-between border-t border-border/60 pt-4 text-xs text-muted-foreground">
                <span>
                  {city.sectionCount} sections · updated{" "}
                  {formatDate(city.lastUpdated)}
                </span>
                <ArrowUpRight className="h-4 w-4 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground" />
              </div>
            </Link>
          </Panel>
        ))}
      </div>

      <Panel className="mt-10">
        <PanelHeader label="What goes in an Atlas" />
        <div className="grid gap-6 p-6 sm:grid-cols-2">
          {[
            {
              t: "Communities & events",
              b: "Recurring meet-ups, salons, and aggregators that punch above their weight.",
            },
            {
              t: "Programs & accelerators",
              b: "Cohorts running locally — pre-accelerator through structured residency.",
            },
            {
              t: "Grants & non-dilutive capital",
              b: "Government and philanthropic capital that doesn't take equity.",
            },
            {
              t: "Venture capital",
              b: "Funds with a local presence and a meaningful local cheque history.",
            },
            {
              t: "Workspaces & cafés",
              b: "Where founders actually meet — coworking, libraries, walking-meeting routes.",
            },
            {
              t: "Visiting & immigration",
              b: "How to plug in if you're flying in or moving here.",
            },
          ].map((row) => (
            <div key={row.t}>
              <div className="text-sm font-medium">{row.t}</div>
              <p className="mt-1 text-sm text-muted-foreground">{row.b}</p>
            </div>
          ))}
        </div>
      </Panel>
    </PageShell>
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
