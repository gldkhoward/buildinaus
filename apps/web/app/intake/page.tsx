import { Suspense } from "react"
import { IntakeChat } from "@/components/intake/intake-chat"

export const metadata = {
  title: "Intake — BuildinAus",
  description:
    "Drop a link or describe what you're building — the intake agent classifies it, scrapes it, and routes you to a clean profile.",
}

interface PageProps {
  searchParams: Promise<{ q?: string; run?: string }>
}

export default function IntakePage({ searchParams }: PageProps) {
  return (
    <main className="flex h-svh flex-col bg-background">
      <header className="border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-baseline justify-between gap-4 px-6 py-4">
          <div className="space-y-0.5">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground/70">
              Intake agent
            </p>
            <h1 className="text-base font-semibold tracking-tight">
              Working on your input
            </h1>
          </div>
          <p className="hidden text-xs text-muted-foreground sm:block">
            Plans before it acts. Click any step to expand.
          </p>
        </div>
      </header>

      <Suspense
        fallback={
          <p className="px-6 py-6 text-sm text-muted-foreground">Loading…</p>
        }
      >
        <IntakeWithParams searchParams={searchParams} />
      </Suspense>
    </main>
  )
}

async function IntakeWithParams({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; run?: string }>
}) {
  const { q = "" } = await searchParams
  return <IntakeChat initialInput={q} />
}
