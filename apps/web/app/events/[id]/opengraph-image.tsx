import { ImageResponse } from "next/og"
import { OG_CONTENT_TYPE, OG_SIZE, OgCard } from "@/components/system/og-card"
import { getEvent } from "@/lib/data/events"

export const alt = "Event on BuildinAus"
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export default async function Image({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const event = await getEvent(id)
  if (!event) {
    return new ImageResponse(
      (
        <OgCard
          eyebrow="BuildinAus"
          title="Event not found"
          subtitle="This listing may have ended or be pending review."
        />
      ),
      size,
    )
  }
  return new ImageResponse(
    (
      <OgCard
        eyebrow={`${event.startsAt} · ${event.city}`}
        title={event.title}
        subtitle={`${event.venue} · ${event.rsvp} going · via ${event.source}`}
      />
    ),
    size,
  )
}
