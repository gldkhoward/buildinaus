import { Suspense } from "react"
import { cn } from "@buildinaus/ui/lib/utils"
import { getEcosystemStats } from "@/lib/data/stats"

interface Stat {
  value: string
  label: string
}

const numberFmt = new Intl.NumberFormat("en-AU")

function formatStats(stats: Awaited<ReturnType<typeof getEcosystemStats>>): Stat[] {
  return [
    { value: numberFmt.format(stats.companies), label: "Australian startups indexed" },
    { value: numberFmt.format(stats.founders), label: "Founders profiled" },
    { value: numberFmt.format(stats.openJobs), label: "Open roles" },
    { value: numberFmt.format(stats.cities), label: "Cities covered" },
  ]
}

const PLACEHOLDER_LABELS = [
  "Australian startups indexed",
  "Founders profiled",
  "Open roles",
  "Cities covered",
]

export function EcosystemStats() {
  return (
    <Suspense fallback={<EcosystemStatsSkeleton />}>
      <EcosystemStatsLive />
    </Suspense>
  )
}

async function EcosystemStatsLive() {
  const stats = await getEcosystemStats()
  return <EcosystemStatsView stats={formatStats(stats)} />
}

function EcosystemStatsView({ stats }: { stats: Stat[] }) {
  return (
    <section className="border-b border-border/60">
      <div className="mx-auto w-full max-w-6xl px-4 md:px-6">
        <div className="grid grid-cols-2 divide-x divide-y divide-border/60 border-x border-border/60 md:grid-cols-4 md:divide-y-0">
          {stats.map((s) => (
            <div key={s.label} className="flex flex-col gap-2 px-6 py-8">
              <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                {s.label}
              </div>
              <div className="text-3xl font-medium tracking-tight tabular-nums md:text-4xl">
                {s.value}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function EcosystemStatsSkeleton() {
  return (
    <section className="border-b border-border/60">
      <div className="mx-auto w-full max-w-6xl px-4 md:px-6">
        <div className="grid grid-cols-2 divide-x divide-y divide-border/60 border-x border-border/60 md:grid-cols-4 md:divide-y-0">
          {PLACEHOLDER_LABELS.map((label) => (
            <div key={label} className="flex flex-col gap-2 px-6 py-8">
              <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                {label}
              </div>
              <div
                aria-hidden
                className={cn(
                  "h-9 w-20 animate-pulse rounded-md bg-muted/40 md:h-10 md:w-24",
                )}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
