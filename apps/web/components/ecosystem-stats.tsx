const STATS = [
  { value: "2,184", label: "Australian startups indexed" },
  { value: "A$3.6B", label: "Total raised in 2025" },
  { value: "412", label: "Active investors" },
  { value: "11", label: "Cities covered" },
]

export function EcosystemStats() {
  return (
    <section className="border-b border-border/60">
      <div className="mx-auto w-full max-w-6xl px-4 md:px-6">
        <div className="grid grid-cols-2 divide-x divide-y divide-border/60 border-x border-border/60 md:grid-cols-4 md:divide-y-0">
          {STATS.map((s) => (
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
