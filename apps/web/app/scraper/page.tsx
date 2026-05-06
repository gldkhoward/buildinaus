import { Suspense } from "react"
import { scrapeAndPresent } from "@buildinaus/agent-engine"
import {
  EventCard,
  FounderCard,
  StartupBento,
  type EventCardData,
  type FounderCardData,
  type StartupBentoData,
} from "@buildinaus/dashboard-blocks"

export const metadata = {
  title: "Scraper agent — BuildinAus",
  description:
    "Drive the planner-executor end-to-end against any URL. Returns a structured dashboard block plus the agent trace.",
}

interface PageProps {
  searchParams: Promise<{ url?: string; hint?: "event" | "startup" }>
}

export default function ScraperPage({ searchParams }: PageProps) {
  return (
    <main className="min-h-svh bg-background px-6 py-12">
      <div className="mx-auto max-w-3xl space-y-6">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            Scraper agent
          </h1>
          <p className="text-sm text-muted-foreground">
            Pass <code>?url=…</code> (and optionally <code>&hint=event|startup</code>)
            to drive the planner-executor end-to-end. The agent picks a tool,
            scrapes, the sanitizer cleans the markdown, and the presenter maps
            the result onto a dashboard block.
          </p>
        </header>

        <Suspense fallback={<ScraperFormFallback />}>
          <ScraperForm searchParams={searchParams} />
        </Suspense>
      </div>
    </main>
  )
}

function ScraperFormFallback() {
  return (
    <form className="flex gap-2" aria-busy="true">
      <div className="flex-1 rounded-md border bg-background px-3 py-2 text-sm text-muted-foreground">
        Loading…
      </div>
      <div className="rounded-md border bg-background px-2 py-2 text-sm">
        auto
      </div>
      <div className="rounded-md border bg-foreground px-3 py-2 text-sm text-background">
        Scrape
      </div>
    </form>
  )
}

async function ScraperForm({
  searchParams,
}: {
  searchParams: Promise<{ url?: string; hint?: "event" | "startup" }>
}) {
  const { url, hint } = await searchParams

  return (
    <>
      <form className="flex gap-2" action="/scraper" method="get">
        <input
          name="url"
          defaultValue={url}
          placeholder="https://lu.ma/…"
          className="flex-1 rounded-md border bg-background px-3 py-2 text-sm"
        />
        <select
          name="hint"
          defaultValue={hint ?? ""}
          className="rounded-md border bg-background px-2 py-2 text-sm"
        >
          <option value="">auto</option>
          <option value="event">event</option>
          <option value="startup">startup</option>
        </select>
        <button
          type="submit"
          className="rounded-md border bg-foreground px-3 py-2 text-sm text-background"
        >
          Scrape
        </button>
      </form>

      {url ? <Result url={url} hint={hint} /> : null}
    </>
  )
}

async function Result({
  url,
  hint,
}: {
  url: string
  hint?: "event" | "startup"
}) {
  try {
    const { block, trace } = await scrapeAndPresent({ url, hint })

    return (
      <section className="space-y-4">
        <RenderedBlock block={block} />
        <details className="rounded-md border p-3 text-xs">
          <summary className="cursor-pointer font-medium">
            Agent trace ({trace.length} tool calls)
          </summary>
          <pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-words text-muted-foreground">
            {JSON.stringify(trace, null, 2)}
          </pre>
        </details>
      </section>
    )
  } catch (err) {
    return (
      <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
        {err instanceof Error ? err.message : String(err)}
      </div>
    )
  }
}

function RenderedBlock({
  block,
}: {
  block:
    | { component: "EventCard"; props: EventCardData }
    | { component: "StartupBento"; props: StartupBentoData }
    | { component: "FounderCard"; props: FounderCardData }
}) {
  if (block.component === "EventCard") {
    return <EventCard event={block.props} />
  }
  if (block.component === "FounderCard") {
    return <FounderCard founder={block.props} />
  }
  return <StartupBento startup={block.props} />
}
