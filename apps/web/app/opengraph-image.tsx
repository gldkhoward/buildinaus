import { ImageResponse } from "next/og"
import { OG_CONTENT_TYPE, OG_SIZE, OgCard } from "@/components/system/og-card"

export const alt = "BuildinAus — The home of the Australian startup ecosystem"
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export default async function Image() {
  return new ImageResponse(
    (
      <OgCard
        eyebrow="BuildinAus"
        title="The home of the Australian startup ecosystem."
        subtitle="Discover, contribute to, and follow what's being built across Sydney, Melbourne, Brisbane and beyond."
      />
    ),
    { ...size },
  )
}
