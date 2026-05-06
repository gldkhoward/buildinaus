import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@buildinaus/ui/atoms/card"
import { Badge } from "@buildinaus/ui/atoms/badge"
import { CalendarDays, MapPin, Ticket, Users } from "lucide-react"

import type { EventCardData } from "../types"

const AEST = "Australia/Sydney"

function formatAEST(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return new Intl.DateTimeFormat("en-AU", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: AEST,
    timeZoneName: "short",
  }).format(d)
}

export function EventCard({ event }: { event: EventCardData }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarDays className="size-4" />
          <a
            href={event.url}
            target="_blank"
            rel="noreferrer"
            className="truncate hover:underline"
          >
            {event.title}
          </a>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <CalendarDays className="size-3.5" />
          <span>{formatAEST(event.date)}</span>
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="size-3.5" />
          <span>{event.location}</span>
        </div>
        {event.ticket_price ? (
          <div className="flex items-center gap-2">
            <Ticket className="size-3.5" />
            <span>{event.ticket_price}</span>
          </div>
        ) : null}
        {typeof event.rsvp_count === "number" ? (
          <div className="flex items-center gap-2">
            <Users className="size-3.5" />
            <span>{event.rsvp_count} RSVPs</span>
          </div>
        ) : null}
        {event.tags.length > 0 ? (
          <div className="flex flex-wrap gap-1 pt-1">
            {event.tags.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
