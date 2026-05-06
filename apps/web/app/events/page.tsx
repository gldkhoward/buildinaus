import { Suspense } from "react"
import Link from "next/link"
import { ArrowUpRight, CalendarDays, MapPin, Users } from "lucide-react"
import { PageShell, PageHeader, Panel, PanelHeader } from "@/components/layout/page-shell"
import { ListRowsSkeleton } from "@/components/layout/skeletons"
import { CommandBarTrigger } from "@/components/intake/command-bar-trigger"
import { EmptyListState } from "@/components/layout/empty-state"
import { listEvents } from "@/lib/data/events"

export const metadata = {
  title: "Events — BuildinAus",
  description: "Meetups, demo days, and pitch nights across Australia.",
}

export default function EventsPage() {
  return (
    <PageShell>
      <PageHeader
        eyebrow="Calendar"
        title="What's on this month"
        description="Founders, operators, and investors get together. RSVP counts pulled from Lu.ma, Eventbrite, and Meetup."
        action={
          <CommandBarTrigger
            prefill="List an event — paste the Lu.ma / Eventbrite URL"
            className="inline-flex items-center gap-1.5 rounded-md border border-border/80 bg-card/60 px-3 py-1.5 text-xs font-medium transition-colors hover:border-foreground/30"
          >
            List an event
            <ArrowUpRight className="h-3.5 w-3.5" />
          </CommandBarTrigger>
        }
      />

      <Suspense fallback={<ListRowsSkeleton count={5} label="loading" />}>
        <EventsList />
      </Suspense>
    </PageShell>
  )
}

async function EventsList() {
  const events = await listEvents()
  if (events.length === 0) {
    return (
      <EmptyListState
        icon={<CalendarDays className="h-4 w-4" />}
        title="No events listed yet"
        description="Lu.ma, Eventbrite and Meetup feeds populate here once they're crawled. Have one to share? Drop the link in."
        prefill="List an event — paste the Lu.ma / Eventbrite URL"
        actionLabel="List an event"
      />
    )
  }
  return (
    <Panel className="mt-10">
      <PanelHeader
        icon={<CalendarDays className="h-3.5 w-3.5" />}
        label={`${events.length} upcoming`}
      />
      <ul className="divide-y divide-border/60">
        {events.map((ev) => (
          <li key={ev.id} className="group">
            <Link
              href={`/events/${ev.id}`}
              className="flex flex-col gap-3 px-6 py-5 transition-colors hover:bg-muted/30 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex flex-1 items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-md border border-border/80 bg-muted/40 text-center font-mono">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    {ev.startsAt.split(" ")[0]}
                  </span>
                  <span className="text-base font-medium leading-none">
                    {ev.startsAt.split(" ")[1]}
                  </span>
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium">{ev.title}</div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {ev.city} · {ev.venue}
                    </span>
                    <span className="font-mono text-[11px]">{ev.startsAt}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="inline-flex items-center gap-1.5 rounded-md border border-border/80 bg-muted/40 px-2 py-1 text-[11px] tabular-nums text-muted-foreground">
                  <Users className="h-3 w-3" />
                  {ev.rsvp} going
                </span>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground" />
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </Panel>
  )
}
