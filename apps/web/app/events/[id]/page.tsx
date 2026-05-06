import { Suspense } from "react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, ArrowUpRight, CalendarDays, MapPin, Users } from "lucide-react"
import { PageShell, Panel, PanelHeader } from "@/components/layout/page-shell"
import { Button } from "@buildinaus/ui/atoms/button"
import {
  DetailHeaderSkeleton,
  DetailBodySkeleton,
} from "@/components/layout/skeletons"
import { getEvent, listEvents } from "@/lib/data/events"

export async function generateStaticParams() {
  const events = await listEvents()
  return events.map((e) => ({ id: e.id }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const event = await getEvent(id)
  if (!event) return { title: "Event not found — BuildinAus" }
  return {
    title: `${event.title} · BuildinAus`,
    description: `${event.startsAt} · ${event.venue}, ${event.city}. ${event.description.slice(0, 140)}`,
  }
}

export default function EventPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  return (
    <PageShell>
      <Link
        href="/events"
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3 w-3" />
        All events
      </Link>

      <Suspense
        fallback={
          <>
            <DetailHeaderSkeleton />
            <DetailBodySkeleton />
          </>
        }
      >
        <EventDetail params={params} />
      </Suspense>
    </PageShell>
  )
}

async function EventDetail({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const event = await getEvent(id)
  if (!event) notFound()

  return (
    <>
      <header className="mt-6 flex flex-col items-start justify-between gap-6 border-b border-border/60 pb-10 md:flex-row md:items-end">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-card/50 px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
            via {event.source}
          </div>
          <h1 className="mt-3 text-3xl font-medium tracking-tight md:text-4xl">{event.title}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="h-3 w-3" />
              {event.startsAt}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-3 w-3" />
              {event.venue} · {event.city}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Users className="h-3 w-3" />
              {event.rsvp} going
            </span>
          </div>
        </div>

        {event.platformUrl ? (
          <Button asChild className="h-9 rounded-md bg-foreground px-4 text-xs font-medium text-background hover:bg-foreground/90">
            <a href={event.platformUrl} target="_blank" rel="noreferrer noopener">
              RSVP on {event.source}
              <ArrowUpRight className="ml-1.5 h-3.5 w-3.5" />
            </a>
          </Button>
        ) : (
          <span className="inline-flex h-9 items-center gap-1 rounded-md border border-border/80 bg-card/60 px-4 text-xs text-muted-foreground">
            RSVP details TBA
          </span>
        )}
      </header>

      <Panel className="mt-10">
        <PanelHeader label="About this event" />
        <p className="p-6 text-pretty text-[15px] leading-relaxed text-foreground/90">
          {event.description}
        </p>
      </Panel>
    </>
  )
}
