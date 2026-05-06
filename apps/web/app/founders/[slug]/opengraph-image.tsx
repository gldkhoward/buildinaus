import { ImageResponse } from "next/og"
import { OG_CONTENT_TYPE, OG_SIZE, OgCard } from "@/components/system/og-card"
import { getFounder } from "@/lib/data/founders"

export const alt = "Founder on BuildinAus"
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const founder = await getFounder(slug)
  if (!founder) {
    return new ImageResponse(
      (
        <OgCard
          eyebrow="BuildinAus"
          title="Founder not found"
          subtitle="This profile may have moved or be pending review."
        />
      ),
      size,
    )
  }
  return new ImageResponse(
    (
      <OgCard
        eyebrow={`${founder.city} · ${founder.role}`}
        title={founder.name}
        subtitle={founder.bio.slice(0, 200)}
      />
    ),
    size,
  )
}
