import { ImageResponse } from "next/og"
import { OG_CONTENT_TYPE, OG_SIZE, OgCard } from "@/components/system/og-card"
import { getJob } from "@/lib/data/jobs"

export const alt = "Open role on BuildinAus"
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export default async function Image({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const job = await getJob(id)
  if (!job) {
    return new ImageResponse(
      (
        <OgCard
          eyebrow="BuildinAus"
          title="Job not found"
          subtitle="This role may have closed or be pending review."
        />
      ),
      size,
    )
  }
  return new ImageResponse(
    (
      <OgCard
        eyebrow={`${job.type} · ${job.city}`}
        title={job.title}
        subtitle={`${job.salary} · posted ${job.postedAt}`}
      />
    ),
    size,
  )
}
