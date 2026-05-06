import { ImageResponse } from "next/og"
import { OG_CONTENT_TYPE, OG_SIZE, OgCard } from "@/components/system/og-card"
import { getAtlasCity } from "@/lib/atlas"

export const alt = "City atlas on BuildinAus"
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export default async function Image({
  params,
}: {
  params: Promise<{ city: string }>
}) {
  const { city } = await params
  const data = getAtlasCity(city)
  if (!data) {
    return new ImageResponse(
      (
        <OgCard
          eyebrow="BuildinAus Atlas"
          title="City not found"
          subtitle="Try sydney, melbourne, or brisbane."
        />
      ),
      size,
    )
  }
  return new ImageResponse(
    (
      <OgCard
        eyebrow={`${data.state} · Atlas`}
        title={`The ${data.city} Atlas`}
        subtitle={data.tagline}
      />
    ),
    size,
  )
}
