import { ImageResponse } from "next/og"
import { OG_CONTENT_TYPE, OG_SIZE, OgCard } from "@/components/system/og-card"
import { getCompany } from "@/lib/data/companies"

export const alt = "Company on BuildinAus"
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const company = await getCompany(slug)
  if (!company) {
    return new ImageResponse(
      (
        <OgCard
          eyebrow="BuildinAus"
          title="Company not found"
          subtitle="This profile may have moved or be pending review."
        />
      ),
      size,
    )
  }
  return new ImageResponse(
    (
      <OgCard
        eyebrow={`${company.city} · ${company.stage}`}
        title={company.name}
        subtitle={company.tagline}
      />
    ),
    size,
  )
}
