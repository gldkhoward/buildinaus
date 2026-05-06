import { cacheLife, cacheTag } from "next/cache"
import {
  eq,
  events,
  getDb,
  type Event as EventRow,
} from "@buildinaus/database"
import type { Event, EventSource } from "@buildinaus/types"
import { citySlugToDisplay, eventStartLabel } from "./_helpers"

function rowToEvent(row: EventRow): Event {
  // The platform values include "Manual" which the existing UI type doesn't
  // understand. Public surfaces never carry Manual rows (they're editorial-only
  // and the seed uses real platforms), but we narrow defensively.
  const source = (row.platform === "Manual" ? "Lu.ma" : row.platform) as EventSource

  return {
    id: row.slug,
    title: row.title,
    city: citySlugToDisplay(row.citySlug),
    startsAt: eventStartLabel(row.startsAt),
    venue: row.venue,
    rsvp: row.rsvpCount,
    source,
    description: row.description,
    platformUrl: row.platformUrl,
  }
}

export async function listEvents(): Promise<Event[]> {
  "use cache"
  cacheLife("hours")
  cacheTag("events:list")

  const db = getDb()
  const rows = await db
    .select()
    .from(events)
    .where(eq(events.reviewStatus, "approved"))
  return rows.map(rowToEvent)
}

export async function getEvent(id: string): Promise<Event | null> {
  "use cache"
  cacheLife("hours")
  cacheTag(`event:${id}`)

  const db = getDb()
  const [row] = await db
    .select()
    .from(events)
    .where(eq(events.slug, id))
    .limit(1)
  return row ? rowToEvent(row) : null
}
